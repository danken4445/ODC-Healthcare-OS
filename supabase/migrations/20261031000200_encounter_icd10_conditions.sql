-- PhilHealth slice 5.0: encounter ICD-10 diagnoses.
-- Doctors record coded diagnoses as FHIR Condition rows linked to the encounter.
-- Codes are validated against the PhilHealth Annex A reference
-- (public.icd10_reference). Rank 1 is the final/primary diagnosis that a
-- PhilHealth claim needs; the same rows feed the PMR and disease surveillance.
-- Rollback: drop the three functions below, then the added columns.

alter table public.conditions
  add column if not exists code_system text not null default 'http://hl7.org/fhir/sid/icd-10',
  add column if not exists diagnosis_rank smallint
    check (diagnosis_rank is null or diagnosis_rank between 1 and 20),
  add column if not exists recorded_by_practitioner_id uuid references public.practitioners(id);

create index if not exists conditions_encounter_rank_idx
  on public.conditions (encounter_id, diagnosis_rank)
  where encounter_id is not null;

-- Resolves the caller's doctor/specialist role at the encounter's clinic and
-- checks they may document it (assigned or covering doctor).
create or replace function public.assert_encounter_condition_writer(p_encounter public.encounters)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if p_encounter.status not in ('in_progress', 'finished') then
    raise exception 'Diagnoses can only be recorded on an active or finished encounter.' using errcode = '22023';
  end if;
  select role.id into v_role_id
  from public.practitioner_roles role
  join public.practitioners practitioner on practitioner.id = role.practitioner_id
  where practitioner.auth_user_id = auth.uid()
    and practitioner.active and role.active
    and role.organization_id = p_encounter.organization_id
    and role.role_code in ('doctor', 'specialist')
  limit 1;
  if v_role_id is null then
    raise exception 'Only a doctor may record encounter diagnoses.' using errcode = '42501';
  end if;
  perform public.assert_encounter_writer(p_encounter, v_role_id);
  -- Once PhilHealth has the claim, its diagnosis must not silently change.
  if exists (
    select 1 from public.claims claim
    where claim.encounter_id = p_encounter.id
      and claim.status = 'active'
      and claim.submitted_at is not null
  ) then
    raise exception 'The claim for this encounter has been submitted; its diagnoses are locked.' using errcode = '22023';
  end if;
  return v_role_id;
end;
$$;

create or replace function public.record_encounter_condition(
  p_encounter_id uuid,
  p_icd10_code text,
  p_diagnosis_rank smallint default 1,
  p_verification_status text default 'confirmed'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encounter public.encounters%rowtype;
  v_role_id uuid;
  v_reference public.icd10_reference%rowtype;
  v_condition_id uuid;
  v_recorder_id uuid;
  v_recorder_name text;
  v_sensitive_category text;
begin
  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.id = p_encounter_id
  for update;
  if not found then
    raise exception 'Encounter not found.' using errcode = 'P0002';
  end if;
  v_role_id := public.assert_encounter_condition_writer(v_encounter);

  if p_diagnosis_rank is null or p_diagnosis_rank not between 1 and 20 then
    raise exception 'Diagnosis rank must be between 1 and 20.' using errcode = '22023';
  end if;
  if p_verification_status not in ('provisional', 'differential', 'confirmed') then
    raise exception 'Verification status must be provisional, differential or confirmed.' using errcode = '22023';
  end if;

  select reference.* into v_reference
  from public.icd10_reference reference
  where reference.code = upper(btrim(p_icd10_code));
  if not found then
    raise exception 'ICD-10 code % is not in the PhilHealth reference list.', upper(btrim(p_icd10_code)) using errcode = '22023';
  end if;

  select practitioner.id, practitioner.name ->> 'text' into v_recorder_id, v_recorder_name
  from public.practitioner_roles role
  join public.practitioners practitioner on practitioner.id = role.practitioner_id
  where role.id = v_role_id;

  -- Mental health and HIV diagnoses are hidden from aggregate surveillance and
  -- shared records by the existing sensitivity rules.
  v_sensitive_category := case
    when v_reference.code ~ '^F' then 'mental_health'
    when v_reference.code ~ '^(B2[0-4]|Z21)' then 'infectious_disease_hiv'
    else null
  end;

  if p_diagnosis_rank = 1 then
    update public.conditions
    set diagnosis_rank = 2, updated_at = now()
    where encounter_id = v_encounter.id
      and diagnosis_rank = 1
      and code <> v_reference.code;
  end if;

  select condition.id into v_condition_id
  from public.conditions condition
  where condition.encounter_id = v_encounter.id
    and condition.code_system = 'http://hl7.org/fhir/sid/icd-10'
    and condition.code = v_reference.code;

  if v_condition_id is null then
    insert into public.conditions (
      organization_id, patient_id, encounter_id, code, code_display, code_system,
      clinical_status, verification_status, onset_date, is_sensitive, sensitive_category,
      recorded_by_name, recorded_by_practitioner_id, diagnosis_rank
    ) values (
      v_encounter.organization_id, v_encounter.patient_id, v_encounter.id,
      v_reference.code, v_reference.description, 'http://hl7.org/fhir/sid/icd-10',
      'active', p_verification_status,
      (coalesce(v_encounter.period_start, now()) at time zone 'Asia/Manila')::date,
      v_sensitive_category is not null, v_sensitive_category,
      v_recorder_name, v_recorder_id, p_diagnosis_rank
    ) returning id into v_condition_id;
  else
    update public.conditions
    set diagnosis_rank = p_diagnosis_rank,
        verification_status = p_verification_status,
        recorded_by_name = v_recorder_name,
        recorded_by_practitioner_id = v_recorder_id,
        updated_at = now()
    where id = v_condition_id;
  end if;

  return v_condition_id;
end;
$$;

create or replace function public.remove_encounter_condition(p_condition_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_condition public.conditions%rowtype;
  v_encounter public.encounters%rowtype;
begin
  select condition.* into v_condition
  from public.conditions condition
  where condition.id = p_condition_id
  for update;
  if not found or v_condition.encounter_id is null then
    raise exception 'Encounter diagnosis not found.' using errcode = 'P0002';
  end if;
  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.id = v_condition.encounter_id
  for update;
  perform public.assert_encounter_condition_writer(v_encounter);
  delete from public.conditions where id = v_condition.id;
end;
$$;

create or replace function public.list_encounter_conditions(p_encounter_id uuid)
returns table (
  id uuid,
  code text,
  code_display text,
  diagnosis_rank smallint,
  verification_status text,
  case_rate numeric,
  recorded_by_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_encounter public.encounters%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.id = p_encounter_id;
  if not found then
    raise exception 'Encounter not found.' using errcode = 'P0002';
  end if;
  if not (
    public.is_patient_self(v_encounter.patient_id, v_encounter.organization_id)
    or public.has_organization_permission(v_encounter.organization_id, 'can_start_consultation')
    or public.has_organization_permission(v_encounter.organization_id, 'can_view_claims')
    or public.has_organization_permission(v_encounter.organization_id, 'can_manage_billing')
  ) then
    raise exception 'Diagnosis access is not permitted.' using errcode = '42501';
  end if;

  return query
  select condition.id, condition.code, condition.code_display, condition.diagnosis_rank,
    condition.verification_status, reference.case_rate, condition.recorded_by_name,
    condition.created_at
  from public.conditions condition
  left join public.icd10_reference reference on reference.code = condition.code
  where condition.encounter_id = v_encounter.id
  order by coalesce(condition.diagnosis_rank, 99), condition.created_at;
end;
$$;

revoke all on function public.assert_encounter_condition_writer(public.encounters) from public, anon, authenticated;
revoke all on function public.record_encounter_condition(uuid, text, smallint, text) from public, anon;
revoke all on function public.remove_encounter_condition(uuid) from public, anon;
revoke all on function public.list_encounter_conditions(uuid) from public, anon;
grant execute on function public.record_encounter_condition(uuid, text, smallint, text) to authenticated;
grant execute on function public.remove_encounter_condition(uuid) to authenticated;
grant execute on function public.list_encounter_conditions(uuid) to authenticated;

comment on function public.record_encounter_condition(uuid, text, smallint, text) is
  'Records or re-ranks a PhilHealth Annex A ICD-10 diagnosis on an encounter. Rank 1 is the final diagnosis used for claims. Locked once the claim is submitted.';
