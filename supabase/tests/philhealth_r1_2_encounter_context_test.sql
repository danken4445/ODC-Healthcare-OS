-- PhilHealth roadmap R1.2: visit setting and referral at check-in, triage
-- level and core presentation, discharge outcome at finish, and the stricter
-- submit check. Synthetic data only.
begin;
select plan(27);
-- Use the default role permissions; local clinics may carry CMS overrides.
delete from public.clinic_role_permission_overrides;

-- Setup as the database owner: a PhilHealth patient with a booked visit, and
-- a patient without PhilHealth.
insert into public.coverages (id, organization_id, patient_id, status, coverage_type, payor, philhealth_id, philhealth_category)
values ('f7000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'active', 'philhealth', '{"name":"Philippine Health Insurance Corporation"}'::jsonb, '12-345678901-2', 'employed');
insert into public.patients (id, organization_id, walk_in_id, name)
values ('f7000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'WALKIN-SYN-R12', '{"text":"Synthetic Cash Patient"}'::jsonb);
insert into public.appointments (id, organization_id, patient_id, practitioner_role_id, status, start_at, end_at) values
  ('f7000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000101', 'booked', now(), now() + interval '30 minutes'),
  ('f7000000-0000-0000-0000-000000000402', '10000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000101',
   '30000000-0000-0000-0000-000000000101', 'booked', now(), now() + interval '30 minutes');

-- Front desk check-in
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000105', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000105"}', true);
set local role authenticated;

select throws_like(
  $$ select public.check_in_appointment('f7000000-0000-0000-0000-000000000401') $$,
  '%choose the visit setting for this PhilHealth patient%',
  'a PhilHealth patient cannot be checked in without a visit setting'
);
select throws_like(
  $$ select public.check_in_appointment('f7000000-0000-0000-0000-000000000401', 'inpatient') $$,
  '%ward or private room%',
  'an inpatient stay needs a room type'
);
select throws_like(
  $$ select public.check_in_appointment('f7000000-0000-0000-0000-000000000401', 'emergency', 'private', null, 'Needs observation') $$,
  '%room type applies only to inpatient stays; name the referring facility%',
  'every check-in problem is listed at once'
);
select lives_ok(
  $$ select public.check_in_appointment('f7000000-0000-0000-0000-000000000401', 'emergency', null, 'Synthetic Rural Health Unit', 'Needs observation') $$,
  'front desk checks in an emergency visit with its referring facility'
);
select is(
  public.check_in_appointment('f7000000-0000-0000-0000-000000000402'),
  null,
  'a patient without PhilHealth is checked in with one click and no encounter'
);
reset role;
select is(
  (select status::text || '|' || encounter_setting || '|' || class_code || '|' || referred_from_facility
   from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'),
  'arrived|emergency|EMER|Synthetic Rural Health Unit',
  'check-in opens the encounter with its setting, class and referral'
);
select is(
  (select status::text from public.appointments where id = 'f7000000-0000-0000-0000-000000000401'),
  'arrived',
  'the appointment is checked in'
);
select is(
  (select count(*)::int from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000402'),
  0,
  'no encounter is opened for a plain check-in'
);

-- Nurse triage
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}', true);
set local role authenticated;
select throws_like(
  $$ select public.record_triage_vital_signs('f7000000-0000-0000-0000-000000000401', 130, 85, 96, 20, 37.2, 97) $$,
  '%triage level and core presentation for this PhilHealth emergency visit%',
  'a PhilHealth emergency visit needs the triage level and core presentation'
);
select throws_like(
  $$ select public.record_triage_vital_signs('f7000000-0000-0000-0000-000000000401', 130, 85, 96, 20, 37.2, 97,
    p_triage_level => 2::smallint, p_core_presentation_code => 'not_a_presentation') $$,
  '%invalid%',
  'an unknown core presentation is rejected'
);
select throws_like(
  $$ select public.record_triage_vital_signs('f7000000-0000-0000-0000-000000000401', 130, 85, 96, 20, 37.2, 97,
    p_triage_level => 6::smallint, p_core_presentation_code => 'chest_pain') $$,
  '%invalid%',
  'triage levels run from 1 to 5'
);
select lives_ok(
  $$ select public.record_triage_vital_signs('f7000000-0000-0000-0000-000000000401', 130, 85, 96, 20, 37.2, 97,
    p_acuity => 'emergency', p_chief_complaint => 'Chest heaviness',
    p_triage_level => 2::smallint, p_core_presentation_code => 'Chest_Pain') $$,
  'the nurse records the triage level and core presentation'
);
select is(
  (select triage_level::text || '|' || core_presentation_code from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'),
  '2|chest_pain',
  'the triage level and core presentation are stored on the encounter'
);
select is(
  (select value ->> 'core_presentation_code' from public.observations
   where code = 'TRIAGE-VITALS' and encounter_id = (select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401')),
  'chest_pain',
  'the triage record keeps them too, so a correction starts from them'
);
reset role;

-- Doctor consultation and finish
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}', true);
set local role authenticated;
select lives_ok(
  $$ select public.start_appointment_encounter('f7000000-0000-0000-0000-000000000401') $$,
  'the doctor starts the consultation on the encounter opened at check-in'
);
select throws_like(
  $$ select public.finish_clinical_encounter((select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'), null) $$,
  '%discharge outcome for this PhilHealth visit%',
  'a PhilHealth visit cannot be finished without a discharge outcome'
);
select throws_like(
  $$ select public.finish_clinical_encounter((select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'), null, 'transferred') $$,
  '%facility the patient is transferred to%',
  'a transfer needs the receiving facility'
);
select lives_ok(
  $$ select public.finish_clinical_encounter((select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'), null,
    'transferred', 'Synthetic Provincial Hospital', 'Needs CT scan') $$,
  'the doctor finishes the visit with its outcome and transfer'
);
select is(
  (select status::text || '|' || discharge_outcome || '|' || referred_to_facility from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'),
  'finished|transferred|Synthetic Provincial Hospital',
  'the outcome and receiving facility are stored'
);
select lives_ok(
  $$ select public.record_encounter_discharge((select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'), 'improved') $$,
  'the doctor corrects the outcome after finishing'
);
select is(
  (select discharge_outcome || '|' || coalesce(referred_to_facility, 'none') from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'),
  'improved|none',
  'the correction replaces the transfer details'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}', true);
set local role authenticated;
select throws_like(
  $$ select public.record_encounter_discharge((select id from public.encounters where appointment_id = 'f7000000-0000-0000-0000-000000000401'), 'expired') $$,
  '%Only a doctor%',
  'a nurse cannot record the discharge outcome'
);
reset role;

-- Claims check the visit context and their documents print it.
insert into public.conditions (organization_id, patient_id, encounter_id, code, code_display, diagnosis_rank)
select '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', encounter.id,
  'I20.9', 'Angina pectoris, unspecified', 1
from public.encounters encounter where encounter.appointment_id = 'f7000000-0000-0000-0000-000000000401';
insert into public.claims (id, organization_id, patient_id, encounter_id, coverage_id, status, use, claim_type,
  payor_type, payer_type, total, claimed_amount_centavos, state)
select 'f7000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  encounter.id, 'f7000000-0000-0000-0000-000000000301', 'active', 'claim', 'institutional',
  'philhealth_nbb', 'philhealth', 650, 65000, 'draft'
from public.encounters encounter where encounter.appointment_id = 'f7000000-0000-0000-0000-000000000401';
insert into public.encounters (id, organization_id, patient_id, practitioner_role_id, status, period_start)
values ('f7000000-0000-0000-0000-000000000502', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000101', 'finished', now());
insert into public.claims (id, organization_id, patient_id, encounter_id, coverage_id, status, use, claim_type,
  payor_type, payer_type, total, claimed_amount_centavos, state)
values ('f7000000-0000-0000-0000-000000000602', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000301', 'active', 'claim', 'institutional',
  'philhealth_nbb', 'philhealth', 650, 65000, 'draft');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;
select throws_like(
  $$ select public.submit_claim('f7000000-0000-0000-0000-000000000602') $$,
  '%record the visit setting (outpatient, emergency or inpatient); record the discharge outcome%',
  'a claim for a visit without its setting and outcome is refused'
);
select is(
  (select doc -> 'encounter' ->> 'core_presentation' || '|' || (doc -> 'encounter' ->> 'triage_level') || '|'
     || (doc -> 'encounter' ->> 'discharge_outcome') || '|' || (doc -> 'encounter' ->> 'referred_from_facility')
   from (select public.get_philhealth_claim_document('f7000000-0000-0000-0000-000000000601') as doc) d),
  'Chest pain|2|improved|Synthetic Rural Health Unit',
  'claim documents carry the visit context'
);
select is(
  (select public.get_philhealth_claim_document('f7000000-0000-0000-0000-000000000601') -> 'encounter' ->> 'setting'),
  'emergency',
  'the R1.1 document fields are still there'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000105', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000105"}', true);
set local role authenticated;
select throws_like(
  $$ select public.check_in_appointment('f7000000-0000-0000-0000-000000000401', 'outpatient') $$,
  '%booked or checked-in appointment%',
  'a finished visit cannot be checked in again'
);
select is(
  (select count(*)::int from public.philhealth_core_presentations where active),
  27,
  'the 27 Annex A core presentations are available to staff'
);
reset role;

select * from finish();
rollback;
