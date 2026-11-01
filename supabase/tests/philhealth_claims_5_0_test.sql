-- PhilHealth slice 5.0: facility billing policy, claim creation, claim guards,
-- encounter ICD-10 diagnoses and supplemental re-billing. Synthetic data only.
begin;
select plan(40);

-- Structure and privileges
select ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'organization_settings' and column_name = 'balance_billing_policy'), 'organizations carry a balance-billing policy');
select ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'claims' and column_name = 'state'), 'claims carry a lifecycle state');
select ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conditions' and column_name = 'diagnosis_rank'), 'conditions carry a diagnosis rank');
select ok(not has_function_privilege('authenticated', 'public.issue_billing_invoice(uuid)', 'execute'), 'invoice issuing stays RPC-internal');
select ok(not has_function_privilege('authenticated', 'public.refresh_philhealth_claim_for_encounter(uuid)', 'execute'), 'claim refresh is not directly callable');
select ok(not has_function_privilege('authenticated', 'public.resolve_billing_mode(uuid,uuid,uuid,uuid)', 'execute'), 'billing-mode resolution is not directly callable');
select ok(has_function_privilege('authenticated', 'public.record_encounter_condition(uuid,text,smallint,text)', 'execute'), 'doctors record diagnoses through an RPC');

-- Legacy Government No-Billing facilities keep zero-balance visits
select is(public.effective_balance_billing_policy('10000000-0000-0000-0000-000000000002'), 'facility_wide_subsidy', 'a facility toggled to Government No-Billing resolves to the facility-wide subsidy policy');
select is((select billing_mode::text from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002')), 'nbb', 'facility-wide subsidy still zeroes the patient balance');

-- NBB: only NBB-category members, only for ward admissions or NBB packages
insert into public.encounters (id, organization_id, patient_id, status, period_start, encounter_setting, accommodation_type) values
  ('f5000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'in_progress', now(), 'inpatient', 'ward_basic'),
  ('f5000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'in_progress', now(), 'inpatient', 'private'),
  ('f5000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'in_progress', now(), 'emergency', null);
update public.organization_settings set ownership = 'other_government', balance_billing_policy = 'nbb'
where organization_id = '10000000-0000-0000-0000-000000000002';

select is((select billing_mode::text from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000201')), 'standard', 'NBB does not apply to an employed member');
update public.coverages set philhealth_category = 'indigent' where id = 'a4000000-0000-0000-0000-000000000002';
select is((select resolution_source from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000201')), 'nbb_member_ward', 'NBB applies to an indigent member in a ward');
select is((select billing_mode::text from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000202')), 'standard', 'choosing a private room voids NBB');
select is((select billing_mode::text from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000203')), 'standard', 'an ER visit is not an NBB admission');

-- ZBB: every patient in basic accommodation at a DOH-retained hospital
update public.organization_settings set ownership = 'doh_retained', balance_billing_policy = 'zbb'
where organization_id = '10000000-0000-0000-0000-000000000002';
update public.coverages set philhealth_category = 'employed' where id = 'a4000000-0000-0000-0000-000000000002';
select is((select resolution_source from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000201')), 'zbb_basic_accommodation', 'ZBB covers any member in basic accommodation');
select is((select billing_mode::text from public.resolve_billing_mode('10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'f5000000-0000-0000-0000-000000000203')), 'standard', 'ZBB excludes the emergency room');

-- Clinic 1 becomes a subsidized government facility with a PhilHealth member
update public.organization_settings set ownership = 'other_government', balance_billing_policy = 'facility_wide_subsidy'
where organization_id = '10000000-0000-0000-0000-000000000001';
insert into public.coverages (id, organization_id, patient_id, status, coverage_type, payor, philhealth_id, philhealth_category)
values ('f5000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'active', 'philhealth', '{"name":"Philippine Health Insurance Corporation"}'::jsonb, '12-345678901-3', 'employed');
insert into public.appointments (id, organization_id, patient_id, practitioner_role_id, status, start_at, end_at)
values ('f5000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000101', 'booked', now(), now() + interval '30 minutes');
insert into public.encounters (id, organization_id, patient_id, appointment_id, practitioner_role_id, status, period_start)
values ('f5000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000101', 'in_progress', now());
insert into public.laboratory_services (id, organization_id, code, name, lab_cost) values
  ('f5000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-000000000001', '', 'Synthetic CBC', 185),
  ('f5000000-0000-0000-0000-000000000602', '10000000-0000-0000-0000-000000000001', '', 'Synthetic Urinalysis', 95);
insert into public.service_requests (id, organization_id, patient_id, encounter_id, status, category, priority, code, code_display)
select 'f5000000-0000-0000-0000-000000000701', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000501', 'active', 'laboratory', 'routine', service.code, service.name
from public.laboratory_services service where service.id = 'f5000000-0000-0000-0000-000000000601';
select public.sync_laboratory_request_to_billing('f5000000-0000-0000-0000-000000000701');

select is(
  (select billing_mode::text || '/' || payor_type::text from public.billing_events where encounter_id = 'f5000000-0000-0000-0000-000000000501' and status = 'draft'),
  'nbb/philhealth_nbb',
  'a PhilHealth member at a subsidized facility gets a zero-balance PhilHealth bill'
);
select ok(
  (select public.issue_billing_invoice(id) ? 'claim_id' from public.billing_events where encounter_id = 'f5000000-0000-0000-0000-000000000501' and status = 'draft'),
  'issuing the zero-balance bill returns a claim'
);
select is(
  (select state::text || '/' || payer_type || '/' || claimed_amount_centavos::text from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'),
  'draft/philhealth/18500',
  'the visit has one draft PhilHealth claim for the billed amount'
);
select is(
  (select coverage_id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'),
  'f5000000-0000-0000-0000-000000000301'::uuid,
  'the claim is linked to the patient''s PhilHealth coverage'
);

-- Supplemental bill: a lab ordered after finalization is the only new charge
insert into public.service_requests (id, organization_id, patient_id, encounter_id, status, category, priority, code, code_display)
select 'f5000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000501', 'active', 'laboratory', 'routine', service.code, service.name
from public.laboratory_services service where service.id = 'f5000000-0000-0000-0000-000000000602';
select public.sync_laboratory_request_to_billing('f5000000-0000-0000-0000-000000000702');
select public.sync_laboratory_request_to_billing('f5000000-0000-0000-0000-000000000701');
select is(
  (select count(*)::integer from public.billing_line_items line join public.billing_events event on event.id = line.billing_event_id
   where event.encounter_id = 'f5000000-0000-0000-0000-000000000501' and event.status = 'draft'),
  1,
  'a supplemental bill does not re-charge a lab already on the finalized bill'
);

-- Submission guards
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;
select throws_like(
  $$ select public.submit_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) $$,
  '%final ICD-10 diagnosis%',
  'a claim without a final diagnosis cannot be submitted'
);
reset role;

-- The doctor finished the visit without coding it and codes it afterwards.
update public.encounters set status = 'finished', period_end = now()
where id = 'f5000000-0000-0000-0000-000000000501';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}', true);
set local role authenticated;
select throws_like(
  $$ select public.record_encounter_condition('f5000000-0000-0000-0000-000000000501', 'NOT-A-CODE') $$,
  '%not in the PhilHealth reference list%',
  'unknown ICD-10 codes are rejected'
);
select lives_ok(
  $$ select public.record_encounter_condition('f5000000-0000-0000-0000-000000000501', 'n39.0') $$,
  'the assigned doctor records the final ICD-10 diagnosis'
);
select is(
  (select code || '/' || diagnosis_rank::text from public.list_encounter_conditions('f5000000-0000-0000-0000-000000000501')),
  'N39.0/1',
  'the diagnosis is stored as the rank-1 Annex A code'
);
reset role;
select is(
  (select primary_icd10_code from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'),
  'N39.0',
  'coding a finished visit updates its draft claim'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;
-- R1 identity details the claim forms print (covered in philhealth_r1_identity_test.sql).
select public.save_patient_philhealth_identity('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  'Santos', 'Maria', 'Test', null, 'female', '1976-07-11', '12 Sample St', 'Poblacion', 'Sample City', 'Cebu', '6000');
select public.set_practitioner_philhealth_accreditation('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '123412345671');
select lives_ok(
  $$ select public.submit_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) $$,
  'a claim with a PIN, diagnosis and charges is submitted'
);
select throws_like(
  $$ select public.submit_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) $$,
  '%already been submitted%',
  'a submitted claim cannot be submitted twice'
);
select throws_like(
  $$ select public.adjudicate_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'), 'denied') $$,
  '%denial reason%',
  'a denial needs a reason'
);
select throws_like(
  $$ select public.adjudicate_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'), 'partial', 185) $$,
  '%below the claimed amount%',
  'a partial approval must be below the claimed amount'
);
select lives_ok(
  $$ select public.adjudicate_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'), 'partial', 120.50) $$,
  'a valid partial approval is recorded'
);
select throws_like(
  $$ select public.adjudicate_claim((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'), 'approved') $$,
  '%has not been adjudicated%',
  'an adjudicated claim cannot be adjudicated again'
);
select throws_like(
  $$ select public.set_organization_billing_profile('10000000-0000-0000-0000-000000000001', 'clinic', 'private', 'zbb') $$,
  '%DOH-retained%',
  'only DOH-retained hospitals can use Zero Balance Billing'
);
select throws_like(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '1234', 'indigent') $$,
  '%12 digits%',
  'a PhilHealth PIN must have 12 digits'
);
select lives_ok(
  $$ select public.save_patient_philhealth_coverage('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '123456789014', 'indigent', 'self', 'PBEF-SYNTHETIC-1') $$,
  'billing staff update the PhilHealth category and eligibility reference'
);
reset role;
select is(
  (select philhealth_id || '/' || philhealth_category from public.coverages where id = 'f5000000-0000-0000-0000-000000000301'),
  '12-345678901-4/indigent',
  'the existing PhilHealth coverage is updated with a formatted PIN'
);

select is(
  (select state::text || '/' || approved_amount_centavos::text from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501'),
  'adjudicated/12050',
  'the partial approval is stored in centavos'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}', true);
set local role authenticated;
select throws_like(
  $$ select public.record_encounter_condition('f5000000-0000-0000-0000-000000000501', 'A90') $$,
  '%diagnoses are locked%',
  'diagnoses are locked after the claim is submitted'
);
reset role;

-- Claim documents (slice 5.3)
select throws_like(
  $$ select public.get_philhealth_claim_document((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) $$,
  '%Claims view permission%',
  'a doctor without claims access cannot read the claim documents'
);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}', true);
set local role authenticated;
select is(
  (select doc -> 'member' ->> 'pin' || '/' || (doc -> 'diagnoses' -> 0 ->> 'code') || '/' || (doc ->> 'phic_basis')
   from (select public.get_philhealth_claim_document((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) as doc) d),
  '12-345678901-4/N39.0/claimed_charges',
  'claim documents carry the PIN, final diagnosis and PHIC basis'
);
select is(
  (select string_agg(line ->> 'soa_category' || ':' || (line ->> 'phic_centavos') || ':' || (line ->> 'excess_centavos'), ',')
   from jsonb_array_elements(public.get_philhealth_claim_document((select id from public.claims where encounter_id = 'f5000000-0000-0000-0000-000000000501')) -> 'lines') line),
  'laboratory:18500:0',
  'only finalized charges appear, with the claimed amount in the PHIC column'
);
reset role;

select * from finish();
rollback;
