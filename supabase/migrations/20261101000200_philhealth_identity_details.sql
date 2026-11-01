-- PhilHealth roadmap R1.1: identity details every claim form needs.
-- PhilHealth forms want names as LAST, FIRST, MIDDLE (+ suffix), a mailing
-- address, the member's own details when the patient is a dependent, and the
-- attending doctor's PhilHealth accreditation number (PAN). These are captured
-- only for PhilHealth patients, through one billing-staff step, so other visits
-- are not slowed down.
--   * Patient name: FHIR HumanName with family, given = [first, middle], suffix.
--     `text` is recomposed so existing screens keep working.
--   * Patient address: FHIR Address (line, district = barangay, city, state =
--     province, postalCode) plus text; disease surveillance already reads
--     city/district.
--   * Practitioner PAN / PRC license: practitioners.identifier entries. Doctors
--     enter their own on their Profile page (no verification step); admins
--     can still correct it. practitioners_audit records every change.
-- Rollback: drop the functions created here, restore
-- save_patient_philhealth_coverage, set_organization_billing_profile,
-- submit_claim and get_philhealth_claim_document from 20261031000500,
-- 20261031000100, 20261031000300 and 20261101000100, then drop the member_*
-- columns.

alter table public.coverages
  add column if not exists member_family_name text
    check (member_family_name is null or length(btrim(member_family_name)) between 1 and 80),
  add column if not exists member_given_name text
    check (member_given_name is null or length(btrim(member_given_name)) between 1 and 80),
  add column if not exists member_middle_name text
    check (member_middle_name is null or length(btrim(member_middle_name)) <= 80),
  add column if not exists member_suffix text
    check (member_suffix is null or length(btrim(member_suffix)) <= 10),
  add column if not exists member_birth_date date,
  add column if not exists member_sex text
    check (member_sex is null or member_sex in ('male', 'female'));

comment on column public.coverages.subscriber_id is
  'For PhilHealth coverage: the member''s PIN (NN-NNNNNNNNN-N). Equals philhealth_id when the patient is the member.';

-- FHIR HumanName parts used across PhilHealth documents.
create or replace function public.human_name_parts(p_name jsonb)
returns table (family text, given text, middle text, suffix text)
language sql
immutable
set search_path = ''
as $$
  select
    nullif(btrim(p_name ->> 'family'), ''),
    nullif(btrim(case when jsonb_typeof(p_name -> 'given') = 'array' then p_name -> 'given' ->> 0 else p_name ->> 'given' end), ''),
    nullif(btrim(case when jsonb_typeof(p_name -> 'given') = 'array' then p_name -> 'given' ->> 1 end), ''),
    nullif(btrim(case when jsonb_typeof(p_name -> 'suffix') = 'array' then p_name -> 'suffix' ->> 0 else p_name ->> 'suffix' end), '');
$$;

create or replace function public.philhealth_staff_can_edit(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_superadmin()
    or public.has_organization_permission(p_organization_id, 'can_manage_billing')
    or public.has_organization_permission(p_organization_id, 'can_manage_claims');
$$;

-- Everything the PhilHealth details dialog shows for one patient.
create or replace function public.get_patient_philhealth_profile(
  p_organization_id uuid,
  p_patient_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_patient public.patients%rowtype;
  v_parts record;
  v_address jsonb;
  v_coverage public.coverages%rowtype;
begin
  if not public.philhealth_staff_can_edit(p_organization_id) then
    raise exception 'Billing or claims management permission is required.' using errcode = '42501';
  end if;
  select patient.* into v_patient
  from public.patients patient
  where patient.id = p_patient_id and patient.organization_id = p_organization_id;
  if not found then
    raise exception 'Patient not found in this organization.' using errcode = 'P0002';
  end if;
  select * into v_parts from public.human_name_parts(v_patient.name);
  v_address := case when jsonb_typeof(v_patient.address) = 'array' then v_patient.address -> 0 else null end;

  select coverage.* into v_coverage
  from public.coverages coverage
  where coverage.organization_id = p_organization_id
    and coverage.patient_id = p_patient_id
    and coverage.status = 'active'
    and (coverage.philhealth_id is not null or lower(coverage.coverage_type) = 'philhealth')
  order by coverage.updated_at desc
  limit 1;

  return jsonb_build_object(
    'patient_id', v_patient.id,
    'display_name', v_patient.name ->> 'text',
    'family', v_parts.family,
    'given', v_parts.given,
    'middle', v_parts.middle,
    'suffix', v_parts.suffix,
    'sex', v_patient.gender,
    'birth_date', v_patient.birth_date,
    'street', v_address -> 'line' ->> 0,
    'barangay', coalesce(v_address ->> 'district', v_address ->> 'barangay'),
    'city', coalesce(v_address ->> 'city', v_address ->> 'municipality'),
    'province', v_address ->> 'state',
    'postal_code', v_address ->> 'postalCode',
    'address_text', v_address ->> 'text',
    'coverage', case when v_coverage.id is null then null else jsonb_build_object(
      'id', v_coverage.id,
      'pin', v_coverage.philhealth_id,
      'category', v_coverage.philhealth_category,
      'relationship', coalesce(v_coverage.beneficiary_relationship, 'self'),
      'eligibility_reference', v_coverage.philhealth_eligibility_reference,
      'member_pin', v_coverage.subscriber_id,
      'member_family_name', v_coverage.member_family_name,
      'member_given_name', v_coverage.member_given_name,
      'member_middle_name', v_coverage.member_middle_name,
      'member_suffix', v_coverage.member_suffix,
      'member_birth_date', v_coverage.member_birth_date,
      'member_sex', v_coverage.member_sex
    ) end
  );
end;
$$;

-- Saves the patient's legal name, sex, birth date and mailing address in the
-- structure PhilHealth forms need.
create or replace function public.save_patient_philhealth_identity(
  p_organization_id uuid,
  p_patient_id uuid,
  p_family_name text,
  p_given_name text,
  p_middle_name text,
  p_suffix text,
  p_sex text,
  p_birth_date date,
  p_street text,
  p_barangay text,
  p_city text,
  p_province text,
  p_postal_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family text := nullif(btrim(p_family_name), '');
  v_given text := nullif(btrim(p_given_name), '');
  v_middle text := nullif(btrim(p_middle_name), '');
  v_suffix text := nullif(btrim(p_suffix), '');
  v_street text := nullif(btrim(p_street), '');
  v_barangay text := nullif(btrim(p_barangay), '');
  v_city text := nullif(btrim(p_city), '');
  v_province text := nullif(btrim(p_province), '');
  v_postal text := nullif(btrim(p_postal_code), '');
  v_problems text[] := array[]::text[];
begin
  if not public.philhealth_staff_can_edit(p_organization_id) then
    raise exception 'Billing or claims management permission is required.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.patients patient
    where patient.id = p_patient_id and patient.organization_id = p_organization_id
  ) then
    raise exception 'Patient not found in this organization.' using errcode = 'P0002';
  end if;

  if v_family is null or length(v_family) > 80 then v_problems := array_append(v_problems, 'last name'); end if;
  if v_given is null or length(v_given) > 80 then v_problems := array_append(v_problems, 'first name'); end if;
  if length(coalesce(v_middle, '')) > 80 or length(coalesce(v_suffix, '')) > 10 then v_problems := array_append(v_problems, 'middle name or suffix'); end if;
  if p_sex is null or p_sex not in ('male', 'female') then v_problems := array_append(v_problems, 'sex (male or female)'); end if;
  if p_birth_date is null or p_birth_date > current_date or p_birth_date < date '1900-01-01' then v_problems := array_append(v_problems, 'birth date'); end if;
  if v_barangay is null or v_city is null or v_province is null then v_problems := array_append(v_problems, 'barangay, city/municipality and province'); end if;
  if v_postal is not null and v_postal !~ '^[0-9]{4}$' then v_problems := array_append(v_problems, '4-digit ZIP code'); end if;
  if cardinality(v_problems) > 0 then
    raise exception 'Check these PhilHealth details: %.', array_to_string(v_problems, '; ') using errcode = '22023';
  end if;

  update public.patients
  set name = jsonb_strip_nulls(jsonb_build_object(
        'use', 'official',
        'text', concat_ws(' ', v_given, v_middle, v_family, v_suffix),
        'family', v_family,
        'given', case when v_middle is null then jsonb_build_array(v_given) else jsonb_build_array(v_given, v_middle) end,
        'suffix', case when v_suffix is null then null else jsonb_build_array(v_suffix) end
      )),
      gender = p_sex,
      birth_date = p_birth_date,
      address = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'use', 'home',
        'text', concat_ws(', ', v_street, v_barangay, v_city, v_province, v_postal),
        'line', case when v_street is null then null else jsonb_build_array(v_street) end,
        'district', v_barangay,
        'city', v_city,
        'state', v_province,
        'postalCode', v_postal,
        'country', 'PH'
      ))),
      updated_at = now()
  where id = p_patient_id;
end;
$$;

-- Coverage now also records the member when the patient is a dependent.
drop function if exists public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text);

create function public.save_patient_philhealth_coverage(
  p_organization_id uuid,
  p_patient_id uuid,
  p_philhealth_id text,
  p_category text,
  p_beneficiary_relationship text default 'self',
  p_eligibility_reference text default null,
  p_member_pin text default null,
  p_member_family_name text default null,
  p_member_given_name text default null,
  p_member_middle_name text default null,
  p_member_suffix text default null,
  p_member_birth_date date default null,
  p_member_sex text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_digits text := regexp_replace(coalesce(p_philhealth_id, ''), '[^0-9]', '', 'g');
  v_member_digits text := regexp_replace(coalesce(p_member_pin, ''), '[^0-9]', '', 'g');
  v_relationship text := coalesce(nullif(btrim(p_beneficiary_relationship), ''), 'self');
  v_pin text;
  v_member_pin text;
  v_reference text := nullif(btrim(p_eligibility_reference), '');
  v_is_member boolean;
  v_coverage_id uuid;
begin
  if not public.philhealth_staff_can_edit(p_organization_id) then
    raise exception 'Billing or claims management permission is required.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.patients patient
    where patient.id = p_patient_id and patient.organization_id = p_organization_id
  ) then
    raise exception 'Patient not found in this organization.' using errcode = 'P0002';
  end if;
  if v_digits !~ '^[0-9]{12}$' then
    raise exception 'A PhilHealth Identification Number has 12 digits.' using errcode = '22023';
  end if;
  if p_category is null or p_category not in ('employed', 'voluntary', 'indigent', 'senior', 'sponsored', 'lifetime', 'kasambahay') then
    raise exception 'Choose a valid PhilHealth member category.' using errcode = '22023';
  end if;
  if v_relationship not in ('self', 'spouse', 'child', 'parent') then
    raise exception 'Relationship to the member must be self, spouse, child or parent.' using errcode = '22023';
  end if;
  v_is_member := v_relationship = 'self';
  if not v_is_member then
    if v_member_digits !~ '^[0-9]{12}$' then
      raise exception 'Enter the member''s 12-digit PIN for a dependent.' using errcode = '22023';
    end if;
    if nullif(btrim(p_member_family_name), '') is null or nullif(btrim(p_member_given_name), '') is null
      or p_member_birth_date is null or p_member_birth_date > current_date
      or coalesce(p_member_sex, '') not in ('male', 'female') then
      raise exception 'Enter the member''s last name, first name, birth date and sex for a dependent.' using errcode = '22023';
    end if;
  end if;
  v_pin := substr(v_digits, 1, 2) || '-' || substr(v_digits, 3, 9) || '-' || substr(v_digits, 12, 1);
  v_member_pin := case when v_is_member then v_pin
    else substr(v_member_digits, 1, 2) || '-' || substr(v_member_digits, 3, 9) || '-' || substr(v_member_digits, 12, 1) end;

  select coverage.id into v_coverage_id
  from public.coverages coverage
  where coverage.organization_id = p_organization_id
    and coverage.patient_id = p_patient_id
    and coverage.status = 'active'
    and (coverage.philhealth_id is not null or lower(coverage.coverage_type) = 'philhealth')
  order by coverage.updated_at desc
  limit 1
  for update;

  if v_coverage_id is null then
    insert into public.coverages (
      organization_id, patient_id, status, coverage_type, payor, philhealth_id,
      philhealth_category, beneficiary_relationship, subscriber_id,
      philhealth_eligibility_reference, philhealth_eligibility_checked_at
    ) values (
      p_organization_id, p_patient_id, 'active', 'philhealth',
      '{"name":"Philippine Health Insurance Corporation"}'::jsonb, v_pin,
      p_category, v_relationship, v_member_pin,
      v_reference, case when v_reference is not null then now() end
    ) returning id into v_coverage_id;
  else
    update public.coverages
    set philhealth_id = v_pin,
        philhealth_category = p_category,
        beneficiary_relationship = v_relationship,
        subscriber_id = v_member_pin,
        philhealth_eligibility_reference = coalesce(v_reference, philhealth_eligibility_reference),
        philhealth_eligibility_checked_at = case when v_reference is not null then now() else philhealth_eligibility_checked_at end
    where id = v_coverage_id;
  end if;

  update public.coverages
  set member_family_name = case when v_is_member then null else nullif(btrim(p_member_family_name), '') end,
      member_given_name = case when v_is_member then null else nullif(btrim(p_member_given_name), '') end,
      member_middle_name = case when v_is_member then null else nullif(btrim(p_member_middle_name), '') end,
      member_suffix = case when v_is_member then null else nullif(btrim(p_member_suffix), '') end,
      member_birth_date = case when v_is_member then null else p_member_birth_date end,
      member_sex = case when v_is_member then null else p_member_sex end
  where id = v_coverage_id;

  update public.claims claim
  set coverage_id = v_coverage_id
  where claim.organization_id = p_organization_id
    and claim.patient_id = p_patient_id
    and claim.payer_type = 'philhealth'
    and claim.status = 'active'
    and claim.state in ('draft', 'clean_validated', 'returned')
    and claim.coverage_id is null;

  return v_coverage_id;
end;
$$;

-- Doctor's PhilHealth accreditation (PAN, 1234-1234567-1) and PRC license.
create or replace function public.get_practitioner_philhealth_accreditation(
  p_organization_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_practitioner public.practitioners%rowtype;
begin
  if not (public.is_superadmin() or public.can_access_organization(p_organization_id)) then
    raise exception 'Organization access is required.' using errcode = '42501';
  end if;
  select practitioner.* into v_practitioner
  from public.practitioners practitioner
  where practitioner.auth_user_id = p_user_id and practitioner.organization_id = p_organization_id;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'practitioner_id', v_practitioner.id,
    'pan', (select item ->> 'value' from jsonb_array_elements(case when jsonb_typeof(v_practitioner.identifier) = 'array' then v_practitioner.identifier else '[]'::jsonb end) item where item ->> 'system' = 'urn:philhealth:pan' limit 1),
    'prc_license', (select item ->> 'value' from jsonb_array_elements(case when jsonb_typeof(v_practitioner.identifier) = 'array' then v_practitioner.identifier else '[]'::jsonb end) item where item ->> 'system' = 'urn:ph:prc-license' limit 1)
  );
end;
$$;

-- Shared PAN / PRC validation and write. Internal: callers check who may edit.
-- Self-edits and admin corrections are both recorded by practitioners_audit.
create or replace function public.apply_practitioner_philhealth_accreditation(
  p_practitioner_id uuid,
  p_pan text,
  p_prc_license text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pan_digits text := regexp_replace(coalesce(p_pan, ''), '[^0-9]', '', 'g');
  v_prc text := nullif(regexp_replace(coalesce(p_prc_license, ''), '[^0-9]', '', 'g'), '');
  v_identifiers jsonb;
begin
  if v_pan_digits !~ '^[0-9]{12}$' then
    raise exception 'A PhilHealth accreditation number for a professional has 12 digits (1234-1234567-1).' using errcode = '22023';
  end if;
  if v_prc is not null and v_prc !~ '^[0-9]{5,8}$' then
    raise exception 'A PRC license number has 5 to 8 digits.' using errcode = '22023';
  end if;

  select coalesce((
      select jsonb_agg(item)
      from jsonb_array_elements(case when jsonb_typeof(practitioner.identifier) = 'array' then practitioner.identifier else '[]'::jsonb end) item
      where item ->> 'system' not in ('urn:philhealth:pan', 'urn:ph:prc-license')
    ), '[]'::jsonb)
  into v_identifiers
  from public.practitioners practitioner
  where practitioner.id = p_practitioner_id
  for update;

  v_identifiers := v_identifiers || jsonb_build_array(jsonb_build_object(
    'system', 'urn:philhealth:pan',
    'value', substr(v_pan_digits, 1, 4) || '-' || substr(v_pan_digits, 5, 7) || '-' || substr(v_pan_digits, 12, 1)
  ));
  if v_prc is not null then
    v_identifiers := v_identifiers || jsonb_build_array(jsonb_build_object('system', 'urn:ph:prc-license', 'value', v_prc));
  end if;
  update public.practitioners set identifier = v_identifiers, updated_at = now() where id = p_practitioner_id;
end;
$$;

-- Admins (or staff managers) can still correct a doctor's accreditation.
create or replace function public.set_practitioner_philhealth_accreditation(
  p_organization_id uuid,
  p_user_id uuid,
  p_pan text,
  p_prc_license text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_practitioner_id uuid;
begin
  if not (
    public.is_superadmin()
    or public.has_organization_role(p_organization_id, array['admin', 'owner'])
    or public.has_organization_permission(p_organization_id, 'can_manage_staff_roles')
  ) then
    raise exception 'Staff management permission is required.' using errcode = '42501';
  end if;
  select practitioner.id into v_practitioner_id
  from public.practitioners practitioner
  where practitioner.auth_user_id = p_user_id and practitioner.organization_id = p_organization_id;
  if v_practitioner_id is null then
    raise exception 'This staff member has no practitioner record at this clinic.' using errcode = 'P0002';
  end if;
  perform public.apply_practitioner_philhealth_accreditation(v_practitioner_id, p_pan, p_prc_license);
end;
$$;

-- Doctors and specialists record their own PAN on their Profile page. There is
-- no verification step: the doctor is responsible for its accuracy, and
-- changing it never alters claims already submitted.
create or replace function public.current_doctor_practitioner_id(p_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practitioner.id
  from public.practitioners practitioner
  join public.practitioner_roles role on role.practitioner_id = practitioner.id
  where practitioner.auth_user_id = auth.uid()
    and practitioner.organization_id = p_organization_id
    and practitioner.active
    and role.active
    and role.organization_id = p_organization_id
    and role.role_code in ('doctor', 'specialist')
  limit 1;
$$;

create or replace function public.get_my_philhealth_accreditation(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_practitioner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  v_practitioner_id := public.current_doctor_practitioner_id(p_organization_id);
  if v_practitioner_id is null then
    return null;
  end if;
  return public.get_practitioner_philhealth_accreditation(p_organization_id, auth.uid());
end;
$$;

create or replace function public.set_my_philhealth_accreditation(
  p_organization_id uuid,
  p_pan text,
  p_prc_license text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_practitioner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  v_practitioner_id := public.current_doctor_practitioner_id(p_organization_id);
  if v_practitioner_id is null then
    raise exception 'Only doctors and specialists can record their own PhilHealth accreditation.' using errcode = '42501';
  end if;
  perform public.apply_practitioner_philhealth_accreditation(v_practitioner_id, p_pan, p_prc_license);
  return public.get_practitioner_philhealth_accreditation(p_organization_id, auth.uid());
end;
$$;

-- Facility accreditation formats: hospitals H12345678, ASC A12345678,
-- MCP M12345, TB-DOTS T12345, dialysis D12345.
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
declare
  v_accreditation text := upper(nullif(btrim(p_hci_accreditation_number), ''));
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
  if v_accreditation is not null and v_accreditation !~ '^([HA][0-9]{8}|[MTD][0-9]{5})$' then
    raise exception 'Use the PhilHealth accreditation format, e.g. H12345678 for hospitals.' using errcode = '22023';
  end if;

  insert into public.organization_settings (
    organization_id, facility_type, ownership, balance_billing_policy, hci_accreditation_number
  ) values (
    p_organization_id, p_facility_type, p_ownership, p_balance_billing_policy, v_accreditation
  )
  on conflict (organization_id) do update set
    facility_type = excluded.facility_type,
    ownership = excluded.ownership,
    balance_billing_policy = excluded.balance_billing_policy,
    hci_accreditation_number = excluded.hci_accreditation_number,
    updated_at = now();

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

-- Submission now also needs the identity details the forms print.
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

-- Document data now carries name parts, the structured address, the member
-- for dependents, and the doctor's PAN by its exact identifier system.
create or replace function public.get_philhealth_claim_document(p_claim_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_claim public.claims%rowtype;
  v_encounter public.encounters%rowtype;
  v_patient public.patients%rowtype;
  v_parts record;
  v_address jsonb;
  v_coverage public.coverages%rowtype;
  v_organization public.organizations%rowtype;
  v_settings public.organization_settings%rowtype;
  v_attending_name text;
  v_attending_accreditation text;
  v_prepared_by text;
  v_claimed_line_ids uuid[];
  v_lines jsonb;
  v_payments_centavos bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  select claim.* into v_claim from public.claims claim where claim.id = p_claim_id;
  if not found then
    raise exception 'Claim not found.' using errcode = 'P0002';
  end if;
  if not (
    public.has_organization_permission(v_claim.organization_id, 'can_view_claims')
    or public.has_organization_permission(v_claim.organization_id, 'can_manage_claims')
  ) then
    raise exception 'Claims view permission is required.' using errcode = '42501';
  end if;

  select encounter.* into v_encounter from public.encounters encounter where encounter.id = v_claim.encounter_id;
  select patient.* into v_patient from public.patients patient where patient.id = v_claim.patient_id;
  select * into v_parts from public.human_name_parts(v_patient.name);
  v_address := case when jsonb_typeof(v_patient.address) = 'array' then v_patient.address -> 0 else null end;
  select organization.* into v_organization from public.organizations organization where organization.id = v_claim.organization_id;
  select settings.* into v_settings from public.organization_settings settings where settings.organization_id = v_claim.organization_id;
  select coverage.* into v_coverage from public.coverages coverage where coverage.id = v_claim.coverage_id;

  select practitioner.name ->> 'text',
    (select pan_item ->> 'value'
     from jsonb_array_elements(case when jsonb_typeof(practitioner.identifier) = 'array' then practitioner.identifier else '[]'::jsonb end) pan_item
     where pan_item ->> 'system' = 'urn:philhealth:pan'
     limit 1)
  into v_attending_name, v_attending_accreditation
  from public.practitioner_roles role
  join public.practitioners practitioner on practitioner.id = role.practitioner_id
  where role.id = v_encounter.practitioner_role_id;

  select practitioner.name ->> 'text' into v_prepared_by
  from public.practitioners practitioner
  where practitioner.auth_user_id = auth.uid()
    and practitioner.organization_id = v_claim.organization_id
  limit 1;

  select coalesce(array_agg((item ->> 'billing_line_item_id')::uuid), array[]::uuid[])
  into v_claimed_line_ids
  from jsonb_array_elements(case when jsonb_typeof(v_claim.items) = 'array' then v_claim.items else '[]'::jsonb end) item
  where item ? 'billing_line_item_id';

  with visit_events as (
    select event.id, event.billing_mode
    from public.billing_events event
    where event.organization_id = v_claim.organization_id
      and event.status = 'finalized'
      and (
        event.encounter_id = v_encounter.id
        or (v_encounter.appointment_id is not null
          and event.appointment_id = v_encounter.appointment_id
          and event.encounter_id is null)
      )
  ), visit_lines as (
    select line.*, event.billing_mode as event_billing_mode,
      round(line.line_total * 100)::bigint as line_total_centavos,
      line.id = any(v_claimed_line_ids) as on_claim
    from public.billing_line_items line
    join visit_events event on event.id = line.billing_event_id
    where line.payment_status <> 'voided'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', line.id,
      'service_date', (coalesce(line.tagged_at, line.created_at) at time zone 'Asia/Manila')::date,
      'item_code', coalesce(item.sku, lab.code, service.code),
      'description', line.description,
      'unit', coalesce(item.unit_of_measure, 'per use'),
      'quantity', line.quantity,
      'unit_price_centavos', round(line.unit_price * 100)::bigint,
      'line_total_centavos', line.line_total_centavos,
      'soa_category', case
        when line.source_type = 'professional_fee' then 'professional_fee'
        when line.source_type = 'laboratory_service' then 'laboratory'
        when line.source_type in ('inventory_usage', 'pos_item')
          and category.name ~* '(medic|drug|pharma)' then 'medicines'
        when line.source_type in ('inventory_usage', 'pos_item') then 'supplies'
        else 'other_services'
      end,
      'on_claim', line.on_claim,
      'discount_centavos', 0,
      'phic_centavos', case when line.on_claim then line.line_total_centavos else 0 end,
      'excess_centavos', case
        when line.on_claim then 0
        when line.event_billing_mode = 'nbb' then 0
        else line.line_total_centavos
      end
    ) order by coalesce(line.tagged_at, line.created_at), line.created_at), '[]'::jsonb)
  into v_lines
  from visit_lines line
  left join public.inventory_usages usage_row
    on line.source_type = 'inventory_usage' and usage_row.id = line.source_id
  left join public.department_stock stock on stock.id = usage_row.stock_id
  left join public.inventory_categories category on category.id = stock.category_id
  left join public.inventory_items item
    on item.id = coalesce(usage_row.item_id, case when line.source_type = 'pos_item' then line.source_id end)
  left join public.service_requests request
    on line.source_type = 'laboratory_service' and request.id = line.source_id
  left join public.laboratory_services lab
    on lab.organization_id = request.organization_id and lab.code = request.code
  left join public.clinic_services service
    on line.source_type in ('clinic_service', 'professional_fee') and service.id = line.source_id;

  select coalesce(sum(round(invoice.amount_paid * 100)), 0)::bigint into v_payments_centavos
  from public.invoices invoice
  join public.billing_events event on event.id = invoice.billing_event_id
  where event.organization_id = v_claim.organization_id
    and event.status = 'finalized'
    and (
      event.encounter_id = v_encounter.id
      or (v_encounter.appointment_id is not null
        and event.appointment_id = v_encounter.appointment_id
        and event.encounter_id is null)
    );

  return jsonb_build_object(
    'soa_number', 'SOA-' || to_char(v_claim.created_at at time zone 'Asia/Manila', 'YYYYMMDD') || '-' || upper(substr(replace(v_claim.id::text, '-', ''), 1, 6)),
    'phic_basis', 'claimed_charges',
    'facility', jsonb_build_object(
      'name', v_organization.name,
      'address', (select address_item ->> 'text' from jsonb_array_elements(case when jsonb_typeof(v_organization.address) = 'array' then v_organization.address else '[]'::jsonb end) address_item limit 1),
      'hci_accreditation_number', v_settings.hci_accreditation_number,
      'facility_type', v_settings.facility_type,
      'ownership', v_settings.ownership
    ),
    'patient', jsonb_build_object(
      'id', v_patient.id,
      'number', coalesce(v_patient.walk_in_id, upper(substr(replace(v_patient.id::text, '-', ''), 1, 8))),
      'name', coalesce(v_patient.name ->> 'text', trim(concat_ws(' ', v_parts.given, v_parts.middle, v_parts.family))),
      'family', v_parts.family,
      'given', v_parts.given,
      'middle', v_parts.middle,
      'suffix', v_parts.suffix,
      'sex', v_patient.gender,
      'birth_date', v_patient.birth_date,
      'address', v_address ->> 'text'
    ),
    'member', jsonb_build_object(
      'pin', v_coverage.philhealth_id,
      'member_pin', coalesce(v_coverage.subscriber_id, v_coverage.philhealth_id),
      'category', v_coverage.philhealth_category,
      'relationship', coalesce(v_coverage.beneficiary_relationship, 'self'),
      'eligibility_reference', v_coverage.philhealth_eligibility_reference,
      'family', v_coverage.member_family_name,
      'given', v_coverage.member_given_name,
      'middle', v_coverage.member_middle_name,
      'suffix', v_coverage.member_suffix,
      'birth_date', v_coverage.member_birth_date,
      'sex', v_coverage.member_sex
    ),
    'encounter', jsonb_build_object(
      'id', v_encounter.id,
      'transaction_number', upper(coalesce(v_encounter.encounter_setting, 'opd')) || '-' || upper(substr(replace(v_encounter.id::text, '-', ''), 1, 8)),
      'setting', v_encounter.encounter_setting,
      'admitted_at', v_encounter.period_start,
      'discharged_at', v_encounter.period_end,
      'attending_name', v_attending_name,
      'attending_accreditation', v_attending_accreditation
    ),
    'diagnoses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', condition.code,
        'description', condition.code_display,
        'rank', condition.diagnosis_rank
      ) order by coalesce(condition.diagnosis_rank, 99), condition.created_at)
      from public.conditions condition
      where condition.encounter_id = v_encounter.id
    ), '[]'::jsonb),
    'claim', jsonb_build_object(
      'id', v_claim.id,
      'state', v_claim.state,
      'payer_type', v_claim.payer_type,
      'primary_icd10_code', v_claim.primary_icd10_code,
      'claimed_amount_centavos', v_claim.claimed_amount_centavos,
      'approved_amount_centavos', v_claim.approved_amount_centavos,
      'adjudication_result', v_claim.adjudication_result,
      'submitted_at', v_claim.submitted_at,
      'philhealth_claim_number', v_claim.philhealth_claim_number
    ),
    'lines', v_lines,
    'payments_centavos', v_payments_centavos,
    'prepared_by', v_prepared_by,
    'generated_at', now()
  );
end;
$$;

revoke all on function public.human_name_parts(jsonb) from public, anon;
revoke all on function public.philhealth_staff_can_edit(uuid) from public, anon, authenticated;
revoke all on function public.get_patient_philhealth_profile(uuid, uuid) from public, anon;
revoke all on function public.save_patient_philhealth_identity(uuid, uuid, text, text, text, text, text, date, text, text, text, text, text) from public, anon;
revoke all on function public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text, text, text, text, text, text, date, text) from public, anon;
revoke all on function public.get_practitioner_philhealth_accreditation(uuid, uuid) from public, anon;
revoke all on function public.set_practitioner_philhealth_accreditation(uuid, uuid, text, text) from public, anon;
revoke all on function public.apply_practitioner_philhealth_accreditation(uuid, text, text) from public, anon, authenticated;
revoke all on function public.current_doctor_practitioner_id(uuid) from public, anon, authenticated;
revoke all on function public.get_my_philhealth_accreditation(uuid) from public, anon;
revoke all on function public.set_my_philhealth_accreditation(uuid, text, text) from public, anon;
revoke all on function public.submit_claim(uuid) from public, anon;
revoke all on function public.get_philhealth_claim_document(uuid) from public, anon;
grant execute on function public.human_name_parts(jsonb) to authenticated;
grant execute on function public.get_patient_philhealth_profile(uuid, uuid) to authenticated;
grant execute on function public.save_patient_philhealth_identity(uuid, uuid, text, text, text, text, text, date, text, text, text, text, text) to authenticated;
grant execute on function public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text, text, text, text, text, text, date, text) to authenticated;
grant execute on function public.get_practitioner_philhealth_accreditation(uuid, uuid) to authenticated;
grant execute on function public.set_practitioner_philhealth_accreditation(uuid, uuid, text, text) to authenticated;
grant execute on function public.get_my_philhealth_accreditation(uuid) to authenticated;
grant execute on function public.set_my_philhealth_accreditation(uuid, text, text) to authenticated;
grant execute on function public.submit_claim(uuid) to authenticated;
grant execute on function public.get_philhealth_claim_document(uuid) to authenticated;

comment on function public.save_patient_philhealth_identity(uuid, uuid, text, text, text, text, text, date, text, text, text, text, text) is
  'Stores the patient''s legal name (FHIR family/given/suffix), sex, birth date and mailing address in the structure PhilHealth claim forms print.';
comment on function public.set_practitioner_philhealth_accreditation(uuid, uuid, text, text) is
  'Records a doctor''s PhilHealth accreditation number (urn:philhealth:pan) and PRC license (urn:ph:prc-license).';
