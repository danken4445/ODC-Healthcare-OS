-- PhilHealth roadmap R1.2: visit context the claim forms need.
-- CF2 and CF4 print the visit setting and room, the referring and receiving
-- facilities, and the discharge outcome. Facility-Based Emergency claims
-- (PC 2025-0020) also need the triage level and the Annex A core
-- presentation. Each field is entered by the person who knows it:
--   * Front desk at check-in: setting (outpatient / emergency / inpatient),
--     room type for inpatient stays, referring facility. Check-in now opens the
--     encounter (status 'arrived'), so the ED entry time is the check-in time.
--   * Nurse at triage: triage level 1-5 and core presentation.
--   * Doctor at finish: discharge outcome and, for transfers, the receiving
--     facility. A doctor can still record it after finishing, until the claim
--     is submitted.
-- The fields are required only for PhilHealth patients at in-person visits,
-- so other visits are not slowed down. submit_claim checks them too.
-- Rollback: restore record_triage_vital_signs from 20260902000200,
-- finish_clinical_encounter(uuid, integer) from 20261002111835, submit_claim
-- and get_philhealth_claim_document from 20261101000200; drop the functions
-- created here, the encounter columns and philhealth_core_presentations.

-- PC 2025-0020 Annex A: core presentations covered by the emergency benefit.
create table if not exists public.philhealth_core_presentations (
  code text primary key check (code ~ '^[a-z_]+$'),
  display text not null,
  sort_order smallint not null unique,
  active boolean not null default true
);

alter table public.philhealth_core_presentations enable row level security;
drop policy if exists philhealth_core_presentations_read on public.philhealth_core_presentations;
create policy philhealth_core_presentations_read on public.philhealth_core_presentations
  for select to authenticated using (true);
revoke all on table public.philhealth_core_presentations from public, anon, authenticated;
grant select on table public.philhealth_core_presentations to authenticated;

insert into public.philhealth_core_presentations (code, display, sort_order) values
  ('changes_in_vision', 'Changes in vision', 1),
  ('changes_in_hearing', 'Changes in hearing', 2),
  ('generalized_weakness', 'Generalized weakness / lethargy', 3),
  ('dizziness', 'Dizziness', 4),
  ('palpitations', 'Palpitations', 5),
  ('persistent_vomiting', 'Persistent vomiting', 6),
  ('diarrhea', 'Diarrhea', 7),
  ('foreign_body', 'Foreign body', 8),
  ('difficulty_swallowing', 'Difficulty swallowing', 9),
  ('fever_chills', 'Fever / chills', 10),
  ('burns', 'Burns', 11),
  ('rashes', 'Rashes', 12),
  ('mental_health_concerns', 'Mental health concerns', 13),
  ('non_traumatic_bleeding', 'Non-traumatic bleeding', 14),
  ('changes_in_sensorium', 'Changes in sensorium', 15),
  ('changes_in_gait', 'Changes in gait', 16),
  ('elevated_blood_pressure', 'Elevated blood pressure', 17),
  ('seizures', 'Seizures', 18),
  ('severe_headache', 'Severe headache', 19),
  ('chest_pain', 'Chest pain', 20),
  ('difficulty_breathing', 'Difficulty breathing', 21),
  ('ingestion_substance_abuse', 'Ingestion / substance abuse', 22),
  ('abdominal_pain', 'Abdominal pain / enlargement', 23),
  ('severe_pain_others', 'Severe pain (others)', 24),
  ('inconsolable_child', 'Incessant crying / inconsolable child', 25),
  ('obstetric_gynecologic', 'Obstetric and gynecologic conditions', 26),
  ('sexual_assault', 'Sexual assault', 27)
on conflict (code) do update set display = excluded.display, sort_order = excluded.sort_order;

alter table public.encounters
  add column if not exists triage_level smallint
    check (triage_level is null or triage_level between 1 and 5),
  add column if not exists core_presentation_code text
    references public.philhealth_core_presentations (code),
  add column if not exists discharge_outcome text
    check (discharge_outcome is null or discharge_outcome in (
      'improved', 'recovered', 'transferred', 'home_against_advice', 'absconded', 'expired'
    )),
  add column if not exists referred_from_facility text
    check (referred_from_facility is null or length(referred_from_facility) <= 200),
  add column if not exists referred_from_reason text
    check (referred_from_reason is null or length(referred_from_reason) <= 1000),
  add column if not exists referred_to_facility text
    check (referred_to_facility is null or length(referred_to_facility) <= 200),
  add column if not exists referred_to_reason text
    check (referred_to_reason is null or length(referred_to_reason) <= 1000);

comment on column public.encounters.triage_level is
  'Emergency triage level: 1 resuscitation, 2 emergent, 3 urgent, 4 less urgent, 5 non-urgent.';
comment on column public.encounters.core_presentation_code is
  'PC 2025-0020 Annex A core presentation, printed with the chief complaint on CF4.';
comment on column public.encounters.discharge_outcome is
  'CF2 patient disposition: improved, recovered, transferred, home against medical advice, absconded, expired.';

create or replace function public.patient_has_philhealth_coverage(p_organization_id uuid, p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.resolve_philhealth_membership(p_organization_id, p_patient_id) membership
    where membership.coverage_id is not null
  );
$$;

-- A PhilHealth visit is an in-person visit (setting recorded at check-in) for
-- a patient with PhilHealth coverage. Only these require the new fields.
create or replace function public.is_philhealth_visit(p_encounter public.encounters)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_encounter.encounter_setting is not null
    and public.patient_has_philhealth_coverage(p_encounter.organization_id, p_encounter.patient_id);
$$;

-- Front-desk check-in with the visit context. Without a setting or referral
-- it behaves like the old one-click check-in and opens no encounter.
create or replace function public.check_in_appointment(
  p_appointment_id uuid,
  p_encounter_setting text default null,
  p_accommodation_type text default null,
  p_referred_from_facility text default null,
  p_referred_from_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_encounter public.encounters%rowtype;
  v_setting text := nullif(lower(btrim(p_encounter_setting)), '');
  v_accommodation text := nullif(lower(btrim(p_accommodation_type)), '');
  v_from text := nullif(btrim(p_referred_from_facility), '');
  v_reason text := nullif(btrim(p_referred_from_reason), '');
  v_problems text[] := array[]::text[];
begin
  select appointment.* into v_appointment
  from public.appointments appointment
  where appointment.id = p_appointment_id
  for update;
  if not found or not public.has_organization_permission(v_appointment.organization_id, 'can_manage_appointments') then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;
  if v_appointment.status not in ('booked', 'arrived') then
    raise exception 'Only a booked or checked-in appointment can be checked in.' using errcode = '23514';
  end if;

  if v_appointment.delivery_mode = 'virtual' and (v_setting is not null or v_accommodation is not null) then
    v_problems := array_append(v_problems, 'a visit setting applies only to in-person visits');
  elsif v_setting is not null and v_setting not in ('outpatient', 'emergency', 'inpatient') then
    v_problems := array_append(v_problems, 'choose outpatient, emergency or inpatient');
  elsif v_setting is null and v_appointment.delivery_mode is distinct from 'virtual'
    and public.patient_has_philhealth_coverage(v_appointment.organization_id, v_appointment.patient_id) then
    v_problems := array_append(v_problems, 'choose the visit setting for this PhilHealth patient');
  end if;
  if v_setting = 'inpatient' and v_accommodation is distinct from 'ward_basic' and v_accommodation is distinct from 'private' then
    v_problems := array_append(v_problems, 'choose a ward or private room for an inpatient stay');
  elsif v_setting is distinct from 'inpatient' and v_accommodation is not null then
    v_problems := array_append(v_problems, 'a room type applies only to inpatient stays');
  end if;
  if v_reason is not null and v_from is null then
    v_problems := array_append(v_problems, 'name the referring facility');
  end if;
  if length(v_from) > 200 or length(v_reason) > 1000 then
    v_problems := array_append(v_problems, 'shorten the referral details');
  end if;
  if cardinality(v_problems) > 0 then
    raise exception 'Check-in details are incomplete: %.', array_to_string(v_problems, '; ') using errcode = '22023';
  end if;

  perform public.update_appointment_status(p_appointment_id, 'arrived');
  if v_setting is null and v_from is null then
    return null;
  end if;

  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.appointment_id = v_appointment.id
  for update;

  if v_encounter.id is null then
    insert into public.encounters (
      organization_id, patient_id, appointment_id, practitioner_role_id,
      status, class_code, service_type, period_start,
      encounter_setting, accommodation_type, referred_from_facility, referred_from_reason
    ) values (
      v_appointment.organization_id, v_appointment.patient_id, v_appointment.id,
      v_appointment.practitioner_role_id, 'arrived',
      case v_setting when 'emergency' then 'EMER' when 'inpatient' then 'IMP' else 'AMB' end,
      v_appointment.service_type, now(),
      v_setting, v_accommodation, v_from, v_reason
    ) returning * into v_encounter;
  elsif v_encounter.status in ('arrived', 'in_progress') then
    update public.encounters
    set encounter_setting = coalesce(v_setting, encounter_setting),
        accommodation_type = case when v_setting is null then accommodation_type else v_accommodation end,
        class_code = case v_setting when 'emergency' then 'EMER' when 'inpatient' then 'IMP' when 'outpatient' then 'AMB' else class_code end,
        referred_from_facility = v_from,
        referred_from_reason = v_reason
    where id = v_encounter.id;
  else
    raise exception 'This visit is already closed.' using errcode = '22023';
  end if;
  return v_encounter.id;
end;
$$;

-- Triage now also records the triage level and core presentation, required
-- for PhilHealth emergency visits.
drop function if exists public.record_triage_vital_signs(uuid, integer, integer, integer, integer, numeric, integer, numeric, numeric, integer, text, text, text, uuid);

create function public.record_triage_vital_signs(
  p_appointment_id uuid,
  p_systolic_bp integer,
  p_diastolic_bp integer,
  p_pulse_bpm integer,
  p_respiratory_rate integer,
  p_temperature_c numeric,
  p_oxygen_saturation integer,
  p_weight_kg numeric default null,
  p_height_cm numeric default null,
  p_pain_score integer default null,
  p_acuity text default 'routine',
  p_chief_complaint text default null,
  p_notes text default null,
  p_supersedes_id uuid default null,
  p_triage_level smallint default null,
  p_core_presentation_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_appointment public.appointments%rowtype;
  selected_encounter public.encounters%rowtype;
  nurse_id uuid;
  latest_observation_id uuid;
  new_observation_id uuid;
  normalized_acuity text := lower(btrim(p_acuity));
  normalized_complaint text := nullif(btrim(p_chief_complaint), '');
  normalized_notes text := nullif(btrim(p_notes), '');
  normalized_presentation text := nullif(lower(btrim(p_core_presentation_code)), '');
begin
  select appointment.* into selected_appointment
  from public.appointments appointment
  where appointment.id = p_appointment_id
  for update;

  if selected_appointment.id is null or selected_appointment.status <> 'arrived' then
    raise exception 'Only checked-in appointments can be triaged.' using errcode = '22023';
  end if;

  nurse_id := public.get_current_practitioner(
    selected_appointment.organization_id, array['nurse']
  );
  if nurse_id is null then
    raise exception 'An active nurse role is required to record triage.' using errcode = '42501';
  end if;

  if p_systolic_bp not between 40 and 300
    or p_diastolic_bp not between 20 and 200
    or p_diastolic_bp >= p_systolic_bp
    or p_pulse_bpm not between 20 and 300
    or p_respiratory_rate not between 4 and 100
    or p_temperature_c not between 25 and 45
    or p_oxygen_saturation not between 0 and 100
    or (p_weight_kg is not null and p_weight_kg not between 0.1 and 700)
    or (p_height_cm is not null and p_height_cm not between 20 and 300)
    or (p_pain_score is not null and p_pain_score not between 0 and 10)
    or normalized_acuity not in ('routine', 'urgent', 'emergency')
    or (normalized_complaint is not null and length(normalized_complaint) > 2000)
    or (normalized_notes is not null and length(normalized_notes) > 5000)
    or (p_triage_level is not null and p_triage_level not between 1 and 5)
    or (normalized_presentation is not null and not exists (
      select 1 from public.philhealth_core_presentations presentation
      where presentation.code = normalized_presentation and presentation.active
    ))
  then
    raise exception 'Triage vital signs or assessment details are invalid.' using errcode = '22023';
  end if;

  select * into selected_encounter
  from public.encounters encounter
  where encounter.appointment_id = selected_appointment.id
  for update;

  if selected_encounter.id is null then
    insert into public.encounters (
      organization_id, patient_id, appointment_id, practitioner_role_id,
      status, class_code, service_type, period_start
    ) values (
      selected_appointment.organization_id, selected_appointment.patient_id,
      selected_appointment.id, selected_appointment.practitioner_role_id,
      'arrived', 'AMB', selected_appointment.service_type, now()
    ) returning * into selected_encounter;
  elsif selected_encounter.status <> 'arrived' then
    raise exception 'Triage cannot be changed after the consultation has started.' using errcode = '22023';
  end if;

  if selected_encounter.encounter_setting = 'emergency'
    and (p_triage_level is null or normalized_presentation is null)
    and public.is_philhealth_visit(selected_encounter) then
    raise exception 'Record the triage level and core presentation for this PhilHealth emergency visit.' using errcode = '22023';
  end if;

  select observation.id into latest_observation_id
  from public.observations observation
  where observation.encounter_id = selected_encounter.id
    and observation.code = 'TRIAGE-VITALS'
  order by observation.created_at desc
  limit 1;

  if latest_observation_id is distinct from p_supersedes_id then
    raise exception 'A triage correction must supersede the latest vital-sign record.' using errcode = '40001';
  end if;

  insert into public.observations (
    organization_id, patient_id, encounter_id, performer_practitioner_id,
    status, category_codes, code_system, code, code_display, effective_at,
    issued_at, value, supersedes_id
  ) values (
    selected_encounter.organization_id, selected_encounter.patient_id,
    selected_encounter.id, nurse_id, 'final',
    '[{"coding":[{"code":"vital-signs","display":"Vital Signs"}]}]'::jsonb,
    'urn:odyssey:triage', 'TRIAGE-VITALS', 'Triage vital signs', now(), now(),
    jsonb_build_object(
      'blood_pressure', jsonb_build_object('systolic', p_systolic_bp, 'diastolic', p_diastolic_bp, 'unit', 'mmHg'),
      'pulse_bpm', p_pulse_bpm,
      'respiratory_rate', p_respiratory_rate,
      'temperature_c', p_temperature_c,
      'oxygen_saturation_percent', p_oxygen_saturation,
      'weight_kg', p_weight_kg,
      'height_cm', p_height_cm,
      'pain_score', p_pain_score,
      'acuity', normalized_acuity,
      'chief_complaint', normalized_complaint,
      'notes', normalized_notes,
      'triage_level', p_triage_level,
      'core_presentation_code', normalized_presentation
    ), p_supersedes_id
  ) returning id into new_observation_id;

  update public.encounters
  set triage_level = p_triage_level,
      core_presentation_code = normalized_presentation
  where id = selected_encounter.id;

  return new_observation_id;
end;
$$;

-- Problems with a discharge outcome, shared by finish and later recording.
create or replace function public.discharge_details_problems(
  p_encounter public.encounters,
  p_outcome text,
  p_to_facility text,
  p_to_reason text
)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_problems text[] := array[]::text[];
begin
  if p_outcome is not null and p_outcome not in (
    'improved', 'recovered', 'transferred', 'home_against_advice', 'absconded', 'expired'
  ) then
    v_problems := array_append(v_problems, 'choose a valid discharge outcome');
  end if;
  if p_outcome is null and public.is_philhealth_visit(p_encounter) then
    v_problems := array_append(v_problems, 'record the discharge outcome for this PhilHealth visit');
  end if;
  if p_outcome = 'transferred' and p_to_facility is null then
    v_problems := array_append(v_problems, 'name the facility the patient is transferred to');
  end if;
  if p_to_reason is not null and p_to_facility is null then
    v_problems := array_append(v_problems, 'name the receiving facility');
  end if;
  if length(p_to_facility) > 200 or length(p_to_reason) > 1000 then
    v_problems := array_append(v_problems, 'shorten the transfer details');
  end if;
  return v_problems;
end;
$$;

-- Finishing a visit now records the discharge outcome and any transfer.
drop function if exists public.finish_clinical_encounter(uuid, integer);
create function public.finish_clinical_encounter(
  p_encounter_id uuid,
  p_expected_version integer,
  p_discharge_outcome text default null,
  p_referred_to_facility text default null,
  p_referred_to_reason text default null
)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_encounter public.encounters%rowtype;
  v_caller_role_id uuid;
  v_event_id uuid;
  v_new_version integer;
  v_outcome text := nullif(lower(btrim(p_discharge_outcome)), '');
  v_to text := nullif(btrim(p_referred_to_facility), '');
  v_to_reason text := nullif(btrim(p_referred_to_reason), '');
  v_problems text[];
begin
  if auth.uid() is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  select encounter.* into v_encounter from public.encounters encounter where encounter.id = p_encounter_id for update;
  if not found or v_encounter.status <> 'in_progress' then raise exception 'An in-progress encounter is required.' using errcode = '22023'; end if;
  if p_expected_version is not null and p_expected_version <> v_encounter.version then perform public.raise_encounter_version_conflict(v_encounter.version); end if;
  select role.id into v_caller_role_id from public.practitioner_roles role join public.practitioners practitioner on practitioner.id = role.practitioner_id
  where practitioner.auth_user_id = auth.uid() and practitioner.active and role.active and role.organization_id = v_encounter.organization_id and role.role_code in ('doctor', 'specialist');
  if v_caller_role_id is null then raise exception 'Only a doctor may complete an encounter.' using errcode = '42501'; end if;
  perform public.assert_encounter_writer(v_encounter, v_caller_role_id);
  v_problems := public.discharge_details_problems(v_encounter, v_outcome, v_to, v_to_reason);
  if cardinality(v_problems) > 0 then
    raise exception 'Discharge details are incomplete: %.', array_to_string(v_problems, '; ') using errcode = '22023';
  end if;
  update public.encounters
  set status = 'finished', period_end = now(), version = version + 1,
      discharge_outcome = v_outcome,
      referred_to_facility = v_to,
      referred_to_reason = v_to_reason
  where id = v_encounter.id returning version into v_new_version;
  update public.appointments set status = 'fulfilled' where id = v_encounter.appointment_id and organization_id = v_encounter.organization_id;
  select billing_event.id into v_event_id from public.billing_events billing_event where billing_event.encounter_id = v_encounter.id and billing_event.organization_id = v_encounter.organization_id and billing_event.status = 'draft' order by billing_event.created_at desc limit 1;
  if v_event_id is not null then perform public.issue_billing_invoice(v_event_id); end if;
  return v_new_version;
end;
$$;

-- A doctor can record or correct the discharge details after finishing,
-- until the claim is submitted (same rule as diagnoses).
create or replace function public.record_encounter_discharge(
  p_encounter_id uuid,
  p_discharge_outcome text,
  p_referred_to_facility text default null,
  p_referred_to_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_encounter public.encounters%rowtype;
  v_outcome text := nullif(lower(btrim(p_discharge_outcome)), '');
  v_to text := nullif(btrim(p_referred_to_facility), '');
  v_to_reason text := nullif(btrim(p_referred_to_reason), '');
  v_problems text[];
begin
  select encounter.* into v_encounter from public.encounters encounter where encounter.id = p_encounter_id for update;
  if not found then raise exception 'Encounter not found.' using errcode = 'P0002'; end if;
  if v_encounter.status <> 'finished' then
    raise exception 'Record discharge details when finishing the visit.' using errcode = '22023';
  end if;
  perform public.assert_encounter_condition_writer(v_encounter);
  if v_outcome is null then
    raise exception 'Choose the discharge outcome.' using errcode = '22023';
  end if;
  v_problems := public.discharge_details_problems(v_encounter, v_outcome, v_to, v_to_reason);
  if cardinality(v_problems) > 0 then
    raise exception 'Discharge details are incomplete: %.', array_to_string(v_problems, '; ') using errcode = '22023';
  end if;
  update public.encounters
  set discharge_outcome = v_outcome,
      referred_to_facility = v_to,
      referred_to_reason = v_to_reason
  where id = v_encounter.id;
end;
$$;

-- What a PhilHealth claim still needs from the visit itself.
create or replace function public.philhealth_visit_context_problems(p_encounter public.encounters)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_problems text[] := array[]::text[];
begin
  if p_encounter.encounter_setting is null then
    v_problems := array_append(v_problems, 'record the visit setting (outpatient, emergency or inpatient)');
  elsif p_encounter.encounter_setting = 'inpatient' and p_encounter.accommodation_type is null then
    v_problems := array_append(v_problems, 'record the room type for this inpatient stay');
  end if;
  if p_encounter.encounter_setting = 'emergency'
    and (p_encounter.triage_level is null or p_encounter.core_presentation_code is null) then
    v_problems := array_append(v_problems, 'record the triage level and core presentation');
  end if;
  if p_encounter.discharge_outcome is null then
    v_problems := array_append(v_problems, 'record the discharge outcome');
  end if;
  return v_problems;
end;
$$;

-- Submission now also needs the visit context.
create or replace function public.submit_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_coverage public.coverages%rowtype;
  v_patient public.patients%rowtype;
  v_encounter public.encounters%rowtype;
  v_parts record;
  v_primary_code text;
  v_attending_pan text;
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
    if v_claim.coverage_id is not null then
      select coverage.* into v_coverage from public.coverages coverage where coverage.id = v_claim.coverage_id;
    else
      select coverage.* into v_coverage
      from public.coverages coverage
      where coverage.id = (
        select membership.coverage_id
        from public.resolve_philhealth_membership(v_claim.organization_id, v_claim.patient_id) membership
      );
    end if;
    if v_coverage.philhealth_id is null or regexp_replace(v_coverage.philhealth_id, '[^0-9]', '', 'g') !~ '^[0-9]{12}$' then
      v_problems := array_append(v_problems, 'record the patient''s 12-digit PhilHealth PIN');
    elsif coalesce(v_coverage.beneficiary_relationship, 'self') <> 'self'
      and (v_coverage.subscriber_id is null or v_coverage.member_family_name is null or v_coverage.member_birth_date is null) then
      v_problems := array_append(v_problems, 'record the member''s PIN, name and birth date for this dependent');
    end if;

    select patient.* into v_patient from public.patients patient where patient.id = v_claim.patient_id;
    select * into v_parts from public.human_name_parts(v_patient.name);
    if v_parts.family is null or v_parts.given is null or v_patient.birth_date is null
      or coalesce(v_patient.gender, '') not in ('male', 'female')
      or not exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(v_patient.address) = 'array' then v_patient.address else '[]'::jsonb end) item
        where item ? 'city' and item ? 'state'
      ) then
      v_problems := array_append(v_problems, 'complete the patient''s PhilHealth details (last and first name, sex, birth date, address)');
    end if;

    select encounter.* into v_encounter from public.encounters encounter where encounter.id = v_claim.encounter_id;
    if v_encounter.id is not null then
      v_problems := v_problems || public.philhealth_visit_context_problems(v_encounter);
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

    select (
      select item ->> 'value'
      from jsonb_array_elements(case when jsonb_typeof(practitioner.identifier) = 'array' then practitioner.identifier else '[]'::jsonb end) item
      where item ->> 'system' = 'urn:philhealth:pan'
      limit 1
    ) into v_attending_pan
    from public.encounters encounter
    join public.practitioner_roles role on role.id = encounter.practitioner_role_id
    join public.practitioners practitioner on practitioner.id = role.practitioner_id
    where encounter.id = v_claim.encounter_id;
    if v_attending_pan is null then
      v_problems := array_append(v_problems, 'record the attending doctor''s PhilHealth accreditation number');
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
      coverage_id = coalesce(v_coverage.id, coverage_id),
      primary_icd10_code = coalesce(v_primary_code, primary_icd10_code)
  where id = v_claim.id;
  perform public.log_billing_transition(v_claim.organization_id, 'claim', v_claim.id, v_claim.state::text, 'submitted', 'Claim submitted');
end;
$$;

-- Claim document data gains the visit context. The R1.1 builder is kept as the
-- base and its encounter block is extended here.
alter function public.get_philhealth_claim_document(uuid) rename to get_philhealth_claim_document_base;
revoke all on function public.get_philhealth_claim_document_base(uuid) from public, anon, authenticated;

create function public.get_philhealth_claim_document(p_claim_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_document jsonb := public.get_philhealth_claim_document_base(p_claim_id);
  v_encounter public.encounters%rowtype;
  v_presentation text;
begin
  select encounter.* into v_encounter
  from public.encounters encounter
  where encounter.id = (v_document -> 'encounter' ->> 'id')::uuid;
  select presentation.display into v_presentation
  from public.philhealth_core_presentations presentation
  where presentation.code = v_encounter.core_presentation_code;
  return jsonb_set(v_document, '{encounter}', (v_document -> 'encounter') || jsonb_build_object(
    'accommodation_type', v_encounter.accommodation_type,
    'triage_level', v_encounter.triage_level,
    'core_presentation_code', v_encounter.core_presentation_code,
    'core_presentation', v_presentation,
    'discharge_outcome', v_encounter.discharge_outcome,
    'referred_from_facility', v_encounter.referred_from_facility,
    'referred_from_reason', v_encounter.referred_from_reason,
    'referred_to_facility', v_encounter.referred_to_facility,
    'referred_to_reason', v_encounter.referred_to_reason
  ));
end;
$$;

revoke all on function public.patient_has_philhealth_coverage(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_philhealth_visit(public.encounters) from public, anon, authenticated;
revoke all on function public.discharge_details_problems(public.encounters, text, text, text) from public, anon, authenticated;
revoke all on function public.philhealth_visit_context_problems(public.encounters) from public, anon, authenticated;
revoke all on function public.check_in_appointment(uuid, text, text, text, text) from public, anon;
revoke all on function public.record_triage_vital_signs(uuid, integer, integer, integer, integer, numeric, integer, numeric, numeric, integer, text, text, text, uuid, smallint, text) from public, anon;
revoke all on function public.finish_clinical_encounter(uuid, integer, text, text, text) from public, anon, authenticated;
revoke all on function public.record_encounter_discharge(uuid, text, text, text) from public, anon;
revoke all on function public.submit_claim(uuid) from public, anon;
revoke all on function public.get_philhealth_claim_document(uuid) from public, anon;
grant execute on function public.check_in_appointment(uuid, text, text, text, text) to authenticated;
grant execute on function public.record_triage_vital_signs(uuid, integer, integer, integer, integer, numeric, integer, numeric, numeric, integer, text, text, text, uuid, smallint, text) to authenticated;
grant execute on function public.finish_clinical_encounter(uuid, integer, text, text, text) to authenticated;
grant execute on function public.record_encounter_discharge(uuid, text, text, text) to authenticated;
grant execute on function public.submit_claim(uuid) to authenticated;
grant execute on function public.get_philhealth_claim_document(uuid) to authenticated;

comment on function public.check_in_appointment(uuid, text, text, text, text) is
  'Front-desk check-in with visit setting, inpatient room type and referring facility. Required for PhilHealth patients at in-person visits.';
comment on function public.record_encounter_discharge(uuid, text, text, text) is
  'Doctor records or corrects the discharge outcome and transfer after finishing, until the claim is submitted.';
