-- PhilHealth roadmap R1.1: patient identity, dependents' member details,
-- doctor PAN, facility accreditation format and the stricter submit check.
-- Synthetic data only.
begin;
select plan(26);

-- Setup as the database owner: a PhilHealth claim whose patient and doctor
-- lack the details the forms print.
insert into public.coverages (id, organization_id, patient_id, status, coverage_type, payor, philhealth_id, philhealth_category)
values ('f6000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'active', 'philhealth', '{"name":"Philippine Health Insurance Corporation"}'::jsonb, '12-345678901-2', 'employed');
insert into public.appointments (id, organization_id, patient_id, practitioner_role_id, status, start_at, end_at)
values ('f6000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000101', 'booked', now(), now() + interval '30 minutes');
insert into public.encounters (id, organization_id, patient_id, appointment_id, practitioner_role_id, status, period_start)
values ('f6000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f6000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000101', 'finished', now());
insert into public.conditions (organization_id, patient_id, encounter_id, code, code_display, diagnosis_rank)
values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000501',
  'N39.0', 'Urinary tract infection, site not specified', 1);
insert into public.claims (id, organization_id, patient_id, encounter_id, coverage_id, status, use, claim_type,
  payor_type, payer_type, total, claimed_amount_centavos, state)
values ('f6000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f6000000-0000-0000-0000-000000000501', 'f6000000-0000-0000-0000-000000000301', 'active', 'claim', 'institutional',
  'philhealth_nbb', 'philhealth', 650, 65000, 'draft');

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;

select throws_like(
  $$ select public.submit_claim('f6000000-0000-0000-0000-000000000601') $$,
  '%complete the patient''s PhilHealth details%attending doctor''s PhilHealth accreditation number%',
  'a claim is refused until the patient details and the doctor PAN are recorded'
);

-- Patient identity
select throws_like(
  $$ select public.save_patient_philhealth_identity('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    '', 'Maria', null, null, 'unknown', null, null, null, 'Sample City', null, '12') $$,
  '%last name; sex (male or female); birth date; barangay, city/municipality and province; 4-digit ZIP code%',
  'every missing or invalid identity field is listed at once'
);
select lives_ok(
  $$ select public.save_patient_philhealth_identity('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    'Dela Cruz', 'Juan', 'Sipag', 'Jr.', 'male', '1980-01-15', '12 Sample St', 'Poblacion', 'Sample City', 'Cebu', '6000') $$,
  'billing staff record the patient''s structured identity'
);
reset role;
select is(
  (select name ->> 'text' from public.patients where id = '40000000-0000-0000-0000-000000000001'),
  'Juan Sipag Dela Cruz Jr.',
  'the display name is recomposed so existing screens keep working'
);
select is(
  (select family || '|' || given || '|' || middle || '|' || suffix from public.human_name_parts((select name from public.patients where id = '40000000-0000-0000-0000-000000000001'))),
  'Dela Cruz|Juan|Sipag|Jr.',
  'name parts are stored in FHIR HumanName form'
);
select is(
  (select address -> 0 ->> 'city' || '|' || (address -> 0 ->> 'district') || '|' || (address -> 0 ->> 'state') from public.patients where id = '40000000-0000-0000-0000-000000000001'),
  'Sample City|Poblacion|Cebu',
  'the address is stored in FHIR Address form that surveillance can read'
);
set local role authenticated;

-- Dependents need the member's own details
select throws_like(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    '123456789012', 'employed', 'child') $$,
  '%member''s 12-digit PIN%',
  'a dependent needs the member''s PIN'
);
select throws_like(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    '123456789012', 'employed', 'child', null, '987654321098') $$,
  '%member''s last name, first name, birth date and sex%',
  'a dependent needs the member''s name, birth date and sex'
);
select lives_ok(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    '123456789012', 'employed', 'child', 'PBEF-SYN-9', '987654321098', 'Dela Cruz', 'Pedro', null, null, '1955-03-02', 'male') $$,
  'a dependent''s coverage is saved with the member''s details'
);
reset role;
select is(
  (select subscriber_id || '|' || philhealth_id || '|' || member_given_name || '|' || member_sex from public.coverages where id = 'f6000000-0000-0000-0000-000000000301'),
  '98-765432109-8|12-345678901-2|Pedro|male',
  'the member PIN and the dependent''s own PIN are stored separately'
);
set local role authenticated;
select lives_ok(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    '123456789012', 'sponsored', 'self') $$,
  'switching back to the member clears the dependent fields'
);
reset role;
select is(
  (select coalesce(member_given_name, 'none') || '|' || subscriber_id from public.coverages where id = 'f6000000-0000-0000-0000-000000000301'),
  'none|12-345678901-2',
  'a member''s own PIN doubles as the subscriber PIN'
);
set local role authenticated;

-- Doctor PAN and PRC license
select throws_like(
  $$ select public.set_practitioner_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '1234') $$,
  '%has 12 digits%',
  'a professional PAN needs 12 digits'
);
select lives_ok(
  $$ select public.set_practitioner_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '123412345671', '0123456') $$,
  'an administrator records the doctor''s PAN and PRC license'
);
select is(
  (select public.get_practitioner_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101') ->> 'pan'),
  '1234-1234567-1',
  'the PAN is stored in the 4-7-1 format'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}', true);
set local role authenticated;
select throws_like(
  $$ select public.set_practitioner_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '123412345679') $$,
  '%Staff management permission%',
  'a doctor cannot change someone else''s accreditation through the admin function'
);
-- Self-service on the doctor's Profile page
select throws_like(
  $$ select public.set_my_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '99') $$,
  '%has 12 digits%',
  'a self-entered PAN is validated the same way'
);
select is(
  (select public.set_my_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '5678-7654321-0', '7654321') ->> 'pan'),
  '5678-7654321-0',
  'a doctor records their own PAN without a verification step'
);
select is(
  (select public.get_my_philhealth_accreditation('10000000-0000-0000-0000-000000000001') ->> 'prc_license'),
  '7654321',
  'the doctor sees their own PAN and PRC license'
);
reset role;
select ok(
  exists (
    select 1 from public.audit_log audit
    where audit.table_name = 'practitioners'
      and audit.record_id = '20000000-0000-0000-0000-000000000101'
      and audit.actor_id = '00000000-0000-0000-0000-000000000101'
  ),
  'the doctor''s own PAN change is recorded in the audit trail'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}', true);
set local role authenticated;
select throws_like(
  $$ select public.set_my_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '123412345671') $$,
  '%Only doctors and specialists%',
  'a nurse cannot record a professional PAN'
);
select is(
  public.get_my_philhealth_accreditation('10000000-0000-0000-0000-000000000001'),
  null,
  'non-doctors get no PAN card'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;

-- Facility accreditation format
select throws_like(
  $$ select public.set_organization_billing_profile('10000000-0000-0000-0000-000000000001', 'hospital_level_1', 'lgu', 'facility_wide_subsidy', 'ABC') $$,
  '%accreditation format%',
  'the facility accreditation number must follow PhilHealth''s format'
);
select is(
  (select public.set_organization_billing_profile('10000000-0000-0000-0000-000000000001', 'hospital_level_1', 'lgu', 'facility_wide_subsidy', 'h07021036') ->> 'hci_accreditation_number'),
  'H07021036',
  'a valid accreditation number is stored in upper case'
);

-- With every detail recorded the claim goes through, and documents carry the parts
select lives_ok(
  $$ select public.submit_claim('f6000000-0000-0000-0000-000000000601') $$,
  'the claim is submitted once the patient details and the doctor PAN exist'
);
select is(
  (select doc -> 'patient' ->> 'family' || '|' || (doc -> 'encounter' ->> 'attending_accreditation')
   from (select public.get_philhealth_claim_document('f6000000-0000-0000-0000-000000000601') as doc) d),
  'Dela Cruz|5678-7654321-0',
  'claim documents carry the structured name and the doctor PAN'
);
reset role;

select * from finish();
rollback;
