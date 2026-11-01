-- PhilHealth slice 5.0: restore PhilHealth claim creation and guard the claim lifecycle.
-- 20260927180000 replaced finalize_billing_event with a version that issues a
-- zero-balance invoice but never inserts a claim, so NBB visits stopped
-- producing PhilHealth claims. Issuing a zero-balance PhilHealth bill now
-- creates (or refreshes) one draft claim per encounter. Submission and
-- adjudication follow a lifecycle state and validate their inputs.
-- Rollback: drop the wrapper issue_billing_invoice, rename
-- issue_billing_invoice_without_claim back, drop the trigger and new functions,
-- restore submit_claim / adjudicate_claim / get_claims_workspace from
-- 20260903000700, then drop the added columns and the enum.

create type public.claim_lifecycle_state as enum (
  'draft', 'clean_validated', 'batched', 'submitted', 'acknowledged',
  'returned', 'adjudicated', 'settled', 'disputed'
);

alter table public.claims
  add column if not exists state public.claim_lifecycle_state not null default 'draft',
  add column if not exists payer_type text
    check (payer_type is null or payer_type in ('philhealth', 'hmo', 'corporate_account')),
  add column if not exists currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  add column if not exists claimed_amount_centavos bigint
    check (claimed_amount_centavos is null or claimed_amount_centavos >= 0),
  add column if not exists approved_amount_centavos bigint
    check (approved_amount_centavos is null or approved_amount_centavos >= 0),
  add column if not exists primary_icd10_code text,
  add column if not exists submitted_by uuid references auth.users(id),
  add column if not exists adjudicated_by uuid references auth.users(id);

update public.claims
set payer_type = case payor_type
      when 'hmo' then 'hmo'
      when 'philhealth_nbb' then 'philhealth'
      else payer_type
    end,
    claimed_amount_centavos = round(coalesce(total, 0) * 100)::bigint,
    approved_amount_centavos = case when approved_amount is not null then round(approved_amount * 100)::bigint end,
    state = case
      when adjudicated_at is not null then 'adjudicated'::public.claim_lifecycle_state
      when submitted_at is not null then 'submitted'::public.claim_lifecycle_state
      else 'draft'::public.claim_lifecycle_state
    end;

create index if not exists claims_org_state_idx
  on public.claims (organization_id, state, created_at desc);
create index if not exists claims_encounter_payer_idx
  on public.claims (encounter_id, payer_type)
  where encounter_id is not null;

alter table public.billing_state_transitions
  drop constraint if exists billing_state_transitions_entity_type_check;
alter table public.billing_state_transitions
  add constraint billing_state_transitions_entity_type_check check (
    entity_type in ('appointment', 'billing_event', 'invoice', 'payment', 'line_item', 'inventory_usage', 'claim')
  );

-- Builds or refreshes the single draft PhilHealth claim for an encounter from
-- every finalized bill of the visit (the appointment reservation bill plus
-- encounter and supplemental bills). Submitted claims are never rewritten.
create or replace function public.refresh_philhealth_claim_for_encounter(p_encounter_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encounter public.encounters%rowtype;
  v_membership record;
  v_items jsonb;
  v_total numeric(14,2);
  v_primary_code text;
  v_latest_event_id uuid;
  v_claim_id uuid;
  v_state public.claim_lifecycle_state;
begin
  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.id = p_encounter_id;
  if not found or v_encounter.patient_id is null then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_encounter.id::text || ':philhealth-claim', 0));

  select coalesce(jsonb_agg(jsonb_build_object(
      'billing_line_item_id', line.id,
      'source_type', line.source_type,
      'description', line.description,
      'quantity', line.quantity,
      'unit_price', line.unit_price,
      'line_total', line.line_total
    ) order by line.created_at), '[]'::jsonb),
    coalesce(sum(line.line_total), 0)
  into v_items, v_total
  from public.billing_line_items line
  join public.billing_events event on event.id = line.billing_event_id
  where event.organization_id = v_encounter.organization_id
    and event.status = 'finalized'
    and line.payment_status <> 'voided'
    and (
      event.encounter_id = v_encounter.id
      or (v_encounter.appointment_id is not null
        and event.appointment_id = v_encounter.appointment_id
        and event.encounter_id is null)
    );

  select event.id into v_latest_event_id
  from public.billing_events event
  where event.encounter_id = v_encounter.id
    and event.status = 'finalized'
  order by event.finalized_at desc nulls last, event.created_at desc
  limit 1;
  if v_latest_event_id is null and v_encounter.appointment_id is not null then
    select event.id into v_latest_event_id
    from public.billing_events event
    where event.appointment_id = v_encounter.appointment_id
      and event.status = 'finalized'
    order by event.created_at desc
    limit 1;
  end if;

  select * into v_membership
  from public.resolve_philhealth_membership(v_encounter.organization_id, v_encounter.patient_id);

  select condition.code into v_primary_code
  from public.conditions condition
  where condition.encounter_id = v_encounter.id
    and condition.diagnosis_rank = 1
  order by condition.updated_at desc
  limit 1;

  select claim.id, claim.state into v_claim_id, v_state
  from public.claims claim
  where claim.encounter_id = v_encounter.id
    and claim.payer_type = 'philhealth'
    and claim.status = 'active'
  order by claim.created_at desc
  limit 1
  for update;

  if v_claim_id is null then
    insert into public.claims (
      organization_id, patient_id, encounter_id, coverage_id, status, use, claim_type,
      billing_event_id, payor_type, payer_type, billable_period_start, billable_period_end,
      provider_organization_id, total, claimed_amount_centavos, items, primary_icd10_code, state
    ) values (
      v_encounter.organization_id, v_encounter.patient_id, v_encounter.id, v_membership.coverage_id,
      'active', 'claim', 'institutional',
      v_latest_event_id, 'philhealth_nbb', 'philhealth',
      (coalesce(v_encounter.period_start, now()) at time zone 'Asia/Manila')::date,
      (coalesce(v_encounter.period_end, v_encounter.period_start, now()) at time zone 'Asia/Manila')::date,
      v_encounter.organization_id, v_total, round(v_total * 100)::bigint, v_items, v_primary_code, 'draft'
    ) returning id into v_claim_id;
    perform public.log_billing_transition(v_encounter.organization_id, 'claim', v_claim_id, null, 'draft',
      'PhilHealth claim drafted from zero-balance bill');
  elsif v_state in ('draft', 'clean_validated', 'returned') then
    update public.claims
    set items = v_items,
        total = v_total,
        claimed_amount_centavos = round(v_total * 100)::bigint,
        billing_event_id = coalesce(v_latest_event_id, billing_event_id),
        coverage_id = coalesce(coverage_id, v_membership.coverage_id),
        primary_icd10_code = coalesce(v_primary_code, primary_icd10_code),
        billable_period_end = (coalesce(v_encounter.period_end, v_encounter.period_start, now()) at time zone 'Asia/Manila')::date,
        state = case when state = 'clean_validated' then 'draft'::public.claim_lifecycle_state else state end
    where id = v_claim_id;
  else
    perform public.log_billing_transition(v_encounter.organization_id, 'claim', v_claim_id, v_state::text, v_state::text,
      'Charges finalized after submission were not added to the claim.');
  end if;

  return v_claim_id;
end;
$$;

-- Every caller (finish encounter, finalize bill, appointment bill) goes through
-- issue_billing_invoice, so the claim hook lives in a wrapper around it.
alter function public.issue_billing_invoice(uuid) rename to issue_billing_invoice_without_claim;

create function public.issue_billing_invoice(p_billing_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_event public.billing_events%rowtype;
  v_claim_id uuid;
begin
  v_result := public.issue_billing_invoice_without_claim(p_billing_event_id);
  select event.* into v_event from public.billing_events event where event.id = p_billing_event_id;
  if v_event.encounter_id is not null
    and v_event.billing_mode = 'nbb'
    and v_event.payor_type = 'philhealth_nbb' then
    v_claim_id := public.refresh_philhealth_claim_for_encounter(v_event.encounter_id);
    v_result := v_result || jsonb_build_object('claim_id', v_claim_id);
  end if;
  return v_result;
end;
$$;

-- A consultation-only visit has no encounter draft bill, so finishing the
-- encounter must still claim the zero-balance appointment bill.
create or replace function public.refresh_philhealth_claim_on_encounter_finish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.billing_events event
    where event.organization_id = new.organization_id
      and event.status = 'finalized'
      and event.billing_mode = 'nbb'
      and event.payor_type = 'philhealth_nbb'
      and (
        event.encounter_id = new.id
        or (new.appointment_id is not null and event.appointment_id = new.appointment_id and event.encounter_id is null)
      )
  ) then
    perform public.refresh_philhealth_claim_for_encounter(new.id);
  end if;
  return new;
end;
$$;

create trigger encounters_refresh_philhealth_claim
  after update of status on public.encounters
  for each row
  when (new.status = 'finished' and old.status is distinct from new.status)
  execute function public.refresh_philhealth_claim_on_encounter_finish();

-- Keep an open draft claim's diagnosis in step with the encounter's final
-- (rank 1) ICD-10 code, so billing staff see coding added after the visit.
create or replace function public.sync_claim_primary_diagnosis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encounter_id uuid := coalesce(new.encounter_id, old.encounter_id);
begin
  if v_encounter_id is null then
    return null;
  end if;
  update public.claims claim
  set primary_icd10_code = (
    select condition.code
    from public.conditions condition
    where condition.encounter_id = v_encounter_id
      and condition.diagnosis_rank = 1
    order by condition.updated_at desc
    limit 1
  )
  where claim.encounter_id = v_encounter_id
    and claim.payer_type = 'philhealth'
    and claim.status = 'active'
    and claim.state in ('draft', 'clean_validated', 'returned');
  return null;
end;
$$;

create trigger conditions_sync_claim_primary_diagnosis
  after insert or update of diagnosis_rank, code or delete on public.conditions
  for each row execute function public.sync_claim_primary_diagnosis();

create or replace function public.submit_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_coverage_id uuid;
  v_pin text;
  v_primary_code text;
  v_problems text[] := array[]::text[];
begin
  select claim.* into v_claim from public.claims claim where claim.id = p_claim_id for update;
  if not found then raise exception 'Claim not found.' using errcode = 'P0002'; end if;
  if not public.has_organization_permission(v_claim.organization_id, 'can_manage_claims') then
    raise exception 'Claims management permission is required.' using errcode = '42501';
  end if;
  if v_claim.status <> 'active' then
    raise exception 'Only active claims can be submitted.' using errcode = '22023';
  end if;
  if v_claim.state not in ('draft', 'clean_validated', 'returned') then
    raise exception 'This claim has already been submitted.' using errcode = '22023';
  end if;

  if v_claim.payer_type = 'philhealth' then
    v_coverage_id := v_claim.coverage_id;
    if v_coverage_id is null then
      select membership.coverage_id into v_coverage_id
      from public.resolve_philhealth_membership(v_claim.organization_id, v_claim.patient_id) membership;
    end if;
    select coverage.philhealth_id into v_pin from public.coverages coverage where coverage.id = v_coverage_id;
    if v_pin is null or regexp_replace(v_pin, '[^0-9]', '', 'g') !~ '^[0-9]{12}$' then
      v_problems := array_append(v_problems, 'record the patient''s 12-digit PhilHealth PIN');
    end if;

    select condition.code into v_primary_code
    from public.conditions condition
    where condition.encounter_id = v_claim.encounter_id
      and condition.diagnosis_rank = 1
      and condition.verification_status = 'confirmed'
    order by condition.updated_at desc
    limit 1;
    if v_primary_code is null then
      v_problems := array_append(v_problems, 'record a confirmed final ICD-10 diagnosis (rank 1)');
    end if;
  end if;

  if coalesce(v_claim.claimed_amount_centavos, round(coalesce(v_claim.total, 0) * 100)::bigint) <= 0 then
    v_problems := array_append(v_problems, 'add at least one billed charge');
  end if;

  if cardinality(v_problems) > 0 then
    raise exception 'Claim is not ready to submit: %.', array_to_string(v_problems, '; ') using errcode = '22023';
  end if;

  update public.claims
  set state = 'submitted',
      submitted_at = now(),
      submitted_by = auth.uid(),
      coverage_id = coalesce(v_coverage_id, coverage_id),
      primary_icd10_code = coalesce(v_primary_code, primary_icd10_code)
  where id = v_claim.id;
  perform public.log_billing_transition(v_claim.organization_id, 'claim', v_claim.id, v_claim.state::text, 'submitted', 'Claim submitted');
end;
$$;

create or replace function public.adjudicate_claim(
  p_claim_id uuid,
  p_result text,
  p_approved_amount numeric default null,
  p_denied_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_claimed bigint;
  v_approved bigint;
begin
  select claim.* into v_claim from public.claims claim where claim.id = p_claim_id for update;
  if not found then raise exception 'Claim not found.' using errcode = 'P0002'; end if;
  if not public.has_organization_permission(v_claim.organization_id, 'can_manage_claims') then
    raise exception 'Claims management permission is required.' using errcode = '42501';
  end if;
  if v_claim.status <> 'active' or v_claim.state not in ('submitted', 'acknowledged') then
    raise exception 'Only a submitted claim that has not been adjudicated can be adjudicated.' using errcode = '22023';
  end if;
  if p_result is null or p_result not in ('approved', 'denied', 'partial') then
    raise exception 'Result must be approved, denied, or partial.' using errcode = '22023';
  end if;
  if p_approved_amount is not null and p_approved_amount < 0 then
    raise exception 'The approved amount cannot be negative.' using errcode = '22023';
  end if;

  v_claimed := coalesce(v_claim.claimed_amount_centavos, round(coalesce(v_claim.total, 0) * 100)::bigint);
  v_approved := case p_result
    when 'denied' then 0
    when 'approved' then coalesce(round(p_approved_amount * 100)::bigint, v_claimed)
    else round(p_approved_amount * 100)::bigint
  end;

  if p_result = 'approved' and v_approved > v_claimed then
    raise exception 'The approved amount cannot exceed the claimed amount.' using errcode = '22023';
  end if;
  if p_result = 'partial' and (v_approved is null or v_approved <= 0 or v_approved >= v_claimed) then
    raise exception 'A partial approval needs an amount above zero and below the claimed amount.' using errcode = '22023';
  end if;
  if p_result = 'denied' and nullif(btrim(p_denied_reason), '') is null then
    raise exception 'A denial reason is required.' using errcode = '22023';
  end if;

  update public.claims
  set state = 'adjudicated',
      adjudicated_at = now(),
      adjudicated_by = auth.uid(),
      adjudication_result = p_result,
      approved_amount_centavos = v_approved,
      approved_amount = v_approved / 100.0,
      denied_reason = nullif(btrim(p_denied_reason), '')
  where id = v_claim.id;
  perform public.log_billing_transition(v_claim.organization_id, 'claim', v_claim.id, v_claim.state::text, 'adjudicated',
    'Payer decision: ' || p_result);
end;
$$;

create or replace function public.get_claims_workspace(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  if not public.has_organization_permission(p_organization_id, 'can_view_claims') then
    raise exception 'Claims view permission is required.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', claim.id, 'patient_id', claim.patient_id,
    'patient_name', coalesce(patient.name ->> 'text', 'Unknown'),
    'encounter_id', claim.encounter_id, 'coverage_id', claim.coverage_id,
    'status', claim.status, 'state', claim.state, 'use', claim.use, 'claim_type', claim.claim_type,
    'payor_type', claim.payor_type, 'payer_type', claim.payer_type, 'total', claim.total,
    'claimed_amount_centavos', claim.claimed_amount_centavos,
    'approved_amount_centavos', claim.approved_amount_centavos,
    'primary_icd10_code', claim.primary_icd10_code,
    'submitted_at', claim.submitted_at, 'adjudicated_at', claim.adjudicated_at,
    'adjudication_result', claim.adjudication_result,
    'approved_amount', claim.approved_amount, 'denied_reason', claim.denied_reason,
    'philhealth_claim_number', claim.philhealth_claim_number,
    'items', claim.items, 'created_at', claim.created_at
  ) order by claim.created_at desc), '[]'::jsonb) into v_result
  from public.claims claim
  left join public.patients patient on patient.id = claim.patient_id
  where claim.organization_id = p_organization_id;

  return v_result;
end;
$$;

revoke all on function public.refresh_philhealth_claim_for_encounter(uuid) from public, anon, authenticated;
revoke all on function public.refresh_philhealth_claim_on_encounter_finish() from public, anon, authenticated;
revoke all on function public.sync_claim_primary_diagnosis() from public, anon, authenticated;
revoke all on function public.issue_billing_invoice(uuid) from public, anon, authenticated;
revoke all on function public.issue_billing_invoice_without_claim(uuid) from public, anon, authenticated;
revoke all on function public.submit_claim(uuid) from public, anon;
revoke all on function public.adjudicate_claim(uuid, text, numeric, text) from public, anon;
revoke all on function public.get_claims_workspace(uuid) from public, anon;
grant execute on function public.submit_claim(uuid) to authenticated;
grant execute on function public.adjudicate_claim(uuid, text, numeric, text) to authenticated;
grant execute on function public.get_claims_workspace(uuid) to authenticated;

comment on column public.claims.state is
  'Claim lifecycle (design doc §4.4) plus returned for PhilHealth return-to-hospital. status keeps the FHIR Claim status.';
comment on function public.refresh_philhealth_claim_for_encounter(uuid) is
  'Creates or refreshes the one draft PhilHealth claim of an encounter from all finalized bills of the visit. Submitted claims are left unchanged.';
