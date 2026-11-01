-- PhilHealth slice 5.0: facility billing profile and patient-level zero-balance rules.
-- A facility's PhilHealth posture is no longer inferred from default_payor_type
-- alone. Zero patient balance is decided from three inputs together: the
-- facility policy (NBB / DOH ZBB / facility-wide subsidy), the encounter setting
-- and accommodation, and the patient's PhilHealth category.
-- Rollback: restore resolve_billing_mode(uuid, uuid, uuid), ensure_encounter_draft_bill
-- and set_organization_facility_classification from 20260927180000 /
-- 20260927144500, drop the functions created here, then drop the added columns.

alter table public.organization_settings
  add column if not exists facility_type text not null default 'clinic'
    check (facility_type in ('clinic', 'infirmary', 'hospital_level_1', 'hospital_level_2', 'hospital_level_3')),
  add column if not exists ownership text not null default 'private'
    check (ownership in ('private', 'doh_retained', 'lgu', 'other_government')),
  add column if not exists balance_billing_policy text not null default 'none'
    check (balance_billing_policy in ('none', 'nbb', 'zbb', 'facility_wide_subsidy')),
  add column if not exists hci_accreditation_number text
    check (hci_accreditation_number is null or length(btrim(hci_accreditation_number)) between 3 and 40);

comment on column public.organization_settings.balance_billing_policy is
  'none: normal billing. nbb: PhilHealth No Balance Billing for NBB-category members (PC 2017-0006). zbb: DOH Zero Balance Billing for every patient in basic/ward accommodation. facility_wide_subsidy: legacy government mode where every visit is subsidized.';

insert into public.organization_settings (organization_id, fee_model)
select organization.id, 'fixed_rate'
from public.organizations organization
on conflict (organization_id) do nothing;

-- Preserve current behavior: facilities already toggled to Government No-Billing
-- keep zero-balance visits until an administrator chooses NBB or ZBB.
update public.organization_settings settings
set ownership = 'other_government',
    balance_billing_policy = 'facility_wide_subsidy'
from public.organizations organization
where organization.id = settings.organization_id
  and organization.default_payor_type in ('philhealth_nbb', 'government_subsidized')
  and settings.balance_billing_policy = 'none';

alter table public.encounters
  add column if not exists encounter_setting text
    check (encounter_setting is null or encounter_setting in ('outpatient', 'emergency', 'inpatient')),
  add column if not exists accommodation_type text
    check (accommodation_type is null or accommodation_type in ('ward_basic', 'private'));

alter table public.coverages
  drop constraint if exists coverages_philhealth_category_check;
alter table public.coverages
  add constraint coverages_philhealth_category_check check (
    philhealth_category is null or philhealth_category in (
      'employed', 'voluntary', 'indigent', 'senior', 'sponsored', 'lifetime', 'kasambahay'
    )
  ),
  add column if not exists philhealth_eligibility_reference text
    check (philhealth_eligibility_reference is null or length(btrim(philhealth_eligibility_reference)) between 3 and 80),
  add column if not exists philhealth_eligibility_checked_at timestamptz;

create index if not exists coverages_patient_philhealth_idx
  on public.coverages (organization_id, patient_id)
  where philhealth_id is not null;

-- Facilities toggled through the legacy classification switch keep working even
-- when their settings row still says 'none'.
create or replace function public.effective_balance_billing_policy(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when coalesce(settings.balance_billing_policy, 'none') = 'none'
      and organization.default_payor_type in ('philhealth_nbb', 'government_subsidized')
      then 'facility_wide_subsidy'
    else coalesce(settings.balance_billing_policy, 'none')
  end
  from public.organizations organization
  left join public.organization_settings settings on settings.organization_id = organization.id
  where organization.id = p_organization_id;
$$;

-- Returns the patient's active PhilHealth coverage and whether they belong to a
-- No Balance Billing category: indigent, sponsored, kasambahay, senior citizen
-- or lifetime member (PC 2017-0006 §II.A). Senior citizens qualify by age.
create or replace function public.resolve_philhealth_membership(
  p_organization_id uuid,
  p_patient_id uuid
)
returns table (coverage_id uuid, is_member boolean, is_nbb_category boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_coverage public.coverages%rowtype;
  v_birth_date date;
begin
  select coverage.* into v_coverage
  from public.coverages coverage
  where coverage.organization_id = p_organization_id
    and coverage.patient_id = p_patient_id
    and coverage.status = 'active'
    and (coverage.period_start is null or coverage.period_start <= current_date)
    and (coverage.period_end is null or coverage.period_end >= current_date)
    and (
      coverage.philhealth_id is not null
      or lower(coverage.coverage_type) in ('philhealth', 'philhealth_nbb', 'nbb')
    )
  order by coverage.updated_at desc
  limit 1;

  select patient.birth_date into v_birth_date
  from public.patients patient
  where patient.id = p_patient_id and patient.organization_id = p_organization_id;

  return query select
    v_coverage.id,
    v_coverage.id is not null,
    coalesce(v_coverage.philhealth_category in ('indigent', 'sponsored', 'kasambahay', 'senior', 'lifetime'), false)
      or lower(coalesce(v_coverage.coverage_type, '')) in ('philhealth_nbb', 'nbb')
      or (v_birth_date is not null and v_birth_date <= (current_date - interval '60 years')::date);
end;
$$;

drop function if exists public.resolve_billing_mode(uuid, uuid, uuid);

create function public.resolve_billing_mode(
  p_organization_id uuid,
  p_patient_id uuid,
  p_clinic_service_id uuid default null,
  p_encounter_id uuid default null
) returns table (
  billing_mode public.billing_mode,
  payor_type public.payor_type,
  coverage_id uuid,
  resolution_source text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_policy text := public.effective_balance_billing_policy(p_organization_id);
  v_subsidy_coverage_id uuid;
  v_membership record;
  v_service_nbb_eligible boolean;
  v_setting text;
  v_accommodation text;
  v_inpatient_ward boolean;
  v_default public.payor_type;
begin
  -- An explicit government subsidy coverage still waives the patient balance.
  select coverage.id into v_subsidy_coverage_id
  from public.coverages coverage
  where coverage.organization_id = p_organization_id
    and coverage.patient_id = p_patient_id
    and coverage.status = 'active'
    and (coverage.period_start is null or coverage.period_start <= current_date)
    and (coverage.period_end is null or coverage.period_end >= current_date)
    and lower(coverage.coverage_type) = 'government_subsidized'
  order by coverage.updated_at desc
  limit 1;
  if v_subsidy_coverage_id is not null then
    return query select 'nbb'::public.billing_mode, 'government_subsidized'::public.payor_type,
      v_subsidy_coverage_id, 'government_subsidy_coverage'::text;
    return;
  end if;

  select * into v_membership
  from public.resolve_philhealth_membership(p_organization_id, p_patient_id);

  if p_clinic_service_id is not null then
    select service.nbb_eligible into v_service_nbb_eligible
    from public.clinic_services service
    where service.id = p_clinic_service_id and service.organization_id = p_organization_id;
  end if;

  if p_encounter_id is not null then
    select encounter.encounter_setting, encounter.accommodation_type
    into v_setting, v_accommodation
    from public.encounters encounter
    where encounter.id = p_encounter_id and encounter.organization_id = p_organization_id;
  end if;
  -- Ward is the default accommodation; private rooms are an explicit patient choice.
  v_inpatient_ward := v_setting = 'inpatient' and coalesce(v_accommodation, 'ward_basic') = 'ward_basic';

  if v_policy = 'facility_wide_subsidy' and v_service_nbb_eligible is distinct from false then
    return query select 'nbb'::public.billing_mode,
      case when v_membership.is_member then 'philhealth_nbb'::public.payor_type
        else 'government_subsidized'::public.payor_type end,
      v_membership.coverage_id, 'facility_wide_subsidy'::text;
    return;
  elsif v_policy = 'zbb' and v_inpatient_ward then
    -- Every Filipino is a PhilHealth member under RA 11223; the claim stays a
    -- draft until the PIN is recorded.
    return query select 'nbb'::public.billing_mode, 'philhealth_nbb'::public.payor_type,
      v_membership.coverage_id, 'zbb_basic_accommodation'::text;
    return;
  elsif v_policy = 'nbb' and v_membership.is_nbb_category
    and (v_inpatient_ward or v_service_nbb_eligible is true) then
    return query select 'nbb'::public.billing_mode, 'philhealth_nbb'::public.payor_type,
      v_membership.coverage_id,
      case when v_inpatient_ward then 'nbb_member_ward' else 'nbb_member_package' end;
    return;
  end if;

  select organization.default_payor_type into v_default
  from public.organizations organization where organization.id = p_organization_id;
  return query select 'standard'::public.billing_mode,
    case when v_default in ('self_pay', 'hmo') then v_default else 'self_pay'::public.payor_type end,
    null::uuid, 'standard_billing'::text;
end;
$$;

create or replace function public.ensure_encounter_draft_bill(p_encounter_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encounter public.encounters%rowtype;
  v_appointment public.appointments%rowtype;
  v_resolution record;
  v_event_id uuid;
begin
  select * into v_encounter from public.encounters where id = p_encounter_id;
  if not found then raise exception 'Encounter not found.' using errcode = 'P0002'; end if;
  select * into v_appointment from public.appointments where id = v_encounter.appointment_id;
  select * into v_resolution from public.resolve_billing_mode(
    v_encounter.organization_id, v_encounter.patient_id, v_appointment.clinic_service_id, v_encounter.id
  );
  perform pg_advisory_xact_lock(hashtextextended(v_encounter.id::text || ':draft-bill', 0));
  select id into v_event_id from public.billing_events
  where encounter_id = v_encounter.id and status = 'draft'
  order by created_at desc limit 1 for update;
  if v_event_id is null then
    insert into public.billing_events (
      organization_id, encounter_id, patient_id, payor_type, coverage_id,
      billing_mode, billing_mode_source, status, notes
    ) values (
      v_encounter.organization_id, v_encounter.id, v_encounter.patient_id,
      v_resolution.payor_type, v_resolution.coverage_id, v_resolution.billing_mode,
      v_resolution.resolution_source, 'draft',
      case when exists (select 1 from public.billing_events where encounter_id = v_encounter.id and status = 'finalized')
        then 'Supplemental encounter charges' else 'Encounter charges' end
    ) returning id into v_event_id;
  end if;
  update public.encounters set billing_mode = v_resolution.billing_mode,
    billing_mode_source = v_resolution.resolution_source,
    billing_coverage_id = v_resolution.coverage_id
  where id = v_encounter.id;
  return v_event_id;
end;
$$;

create or replace function public.get_organization_billing_profile(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings public.organization_settings%rowtype;
begin
  if not (public.is_superadmin() or public.can_access_organization(p_organization_id)) then
    raise exception 'Organization not found or access denied.' using errcode = '42501';
  end if;
  select * into v_settings from public.organization_settings where organization_id = p_organization_id;
  return jsonb_build_object(
    'organization_id', p_organization_id,
    'facility_type', coalesce(v_settings.facility_type, 'clinic'),
    'ownership', coalesce(v_settings.ownership, 'private'),
    'balance_billing_policy', public.effective_balance_billing_policy(p_organization_id),
    'hci_accreditation_number', v_settings.hci_accreditation_number,
    'can_manage', public.is_superadmin() or public.has_organization_role(p_organization_id, array['admin', 'owner'])
  );
end;
$$;

create or replace function public.set_organization_billing_profile(
  p_organization_id uuid,
  p_facility_type text,
  p_ownership text,
  p_balance_billing_policy text,
  p_hci_accreditation_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_superadmin() or public.has_organization_role(p_organization_id, array['admin', 'owner'])) then
    raise exception 'Only an administrator of this facility can modify its billing profile.' using errcode = '42501';
  end if;
  if p_balance_billing_policy = 'zbb' and p_ownership <> 'doh_retained' then
    raise exception 'DOH Zero Balance Billing applies only to DOH-retained hospitals.' using errcode = '22023';
  end if;
  if p_balance_billing_policy in ('zbb', 'facility_wide_subsidy') and p_ownership = 'private' then
    raise exception 'Private facilities may use No Balance Billing only under a PhilHealth MOA (policy nbb).' using errcode = '22023';
  end if;

  insert into public.organization_settings (
    organization_id, facility_type, ownership, balance_billing_policy, hci_accreditation_number
  ) values (
    p_organization_id, p_facility_type, p_ownership, p_balance_billing_policy,
    nullif(btrim(p_hci_accreditation_number), '')
  )
  on conflict (organization_id) do update set
    facility_type = excluded.facility_type,
    ownership = excluded.ownership,
    balance_billing_policy = excluded.balance_billing_policy,
    hci_accreditation_number = excluded.hci_accreditation_number,
    updated_at = now();

  -- Keep the legacy payor default consistent for screens that still read it.
  update public.organizations
  set default_payor_type = case
      when p_balance_billing_policy = 'facility_wide_subsidy' then 'philhealth_nbb'::public.payor_type
      when default_payor_type in ('philhealth_nbb', 'government_subsidized') then 'self_pay'::public.payor_type
      else default_payor_type
    end,
    updated_at = now()
  where id = p_organization_id;

  return public.get_organization_billing_profile(p_organization_id);
end;
$$;

-- The legacy two-state toggle now also records the matching billing policy.
create or replace function public.set_organization_facility_classification(
  p_organization_id uuid,
  p_payor_type public.payor_type
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_at timestamptz := now();
begin
  if not (
    public.is_superadmin()
    or public.has_organization_role(p_organization_id, array['admin', 'owner'])
  ) then
    raise exception 'Only an administrator of this facility can modify its facility classification.' using errcode = '42501';
  end if;

  if p_payor_type not in ('self_pay', 'philhealth_nbb', 'government_subsidized', 'hmo') then
    raise exception 'Invalid payor type.' using errcode = '22023';
  end if;

  update public.organizations
  set default_payor_type = p_payor_type,
      updated_at = v_updated_at
  where id = p_organization_id;

  if not found then
    raise exception 'Organization not found.' using errcode = 'P0002';
  end if;

  insert into public.organization_settings (organization_id, fee_model)
  values (p_organization_id, 'fixed_rate')
  on conflict (organization_id) do nothing;

  update public.organization_settings
  set ownership = case
        when p_payor_type in ('philhealth_nbb', 'government_subsidized') and ownership = 'private' then 'other_government'
        else ownership
      end,
      balance_billing_policy = case
        when p_payor_type in ('philhealth_nbb', 'government_subsidized') and balance_billing_policy = 'none' then 'facility_wide_subsidy'
        when p_payor_type in ('self_pay', 'hmo') then 'none'
        else balance_billing_policy
      end
  where organization_id = p_organization_id;

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'default_payor_type', p_payor_type,
    'is_government_no_billing', (p_payor_type = 'philhealth_nbb'),
    'updated_at', v_updated_at
  );
end;
$$;

revoke all on function public.effective_balance_billing_policy(uuid) from public, anon, authenticated;
revoke all on function public.resolve_philhealth_membership(uuid, uuid) from public, anon, authenticated;
revoke all on function public.resolve_billing_mode(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.ensure_encounter_draft_bill(uuid) from public, anon, authenticated;
revoke all on function public.get_organization_billing_profile(uuid) from public, anon;
revoke all on function public.set_organization_billing_profile(uuid, text, text, text, text) from public, anon;
grant execute on function public.get_organization_billing_profile(uuid) to authenticated;
grant execute on function public.set_organization_billing_profile(uuid, text, text, text, text) to authenticated;

comment on function public.resolve_billing_mode(uuid, uuid, uuid, uuid) is
  'Chooses zero-balance (nbb) or standard billing from the facility policy, encounter setting/accommodation and patient PhilHealth category.';
comment on function public.set_organization_billing_profile(uuid, text, text, text, text) is
  'Sets facility type, ownership, balance-billing policy and HCI accreditation. ZBB is DOH-retained only; private facilities may only use NBB (MOA).';
