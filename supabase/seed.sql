-- Synthetic development data only. Never add real patient information here.
-- The password below is deliberately public, local-only test data; it is not a
-- deployable credential and must never be used outside a reset local database.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'doctor@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'nurse@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000105', 'authenticated', 'authenticated', 'front-desk@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000106', 'authenticated', 'authenticated', 'admin@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000107', 'authenticated', 'authenticated', 'lab@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000108', 'authenticated', 'authenticated', 'inventory@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000109', 'authenticated', 'authenticated', 'specialist@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated', 'patient@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000104', 'authenticated', 'authenticated', 'other-patient@synthetic.odyssey.test', crypt('LocalOnly-2026!', gen_salt('bf')), now(), '', '', '', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'provider_id'
  ) then
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    select id, id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
    from auth.users user_account
    where user_account.email like '%@synthetic.odyssey.test'
      and not exists (select 1 from auth.identities identity_row where identity_row.user_id = user_account.id);
  else
    insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
    from auth.users user_account
    where user_account.email like '%@synthetic.odyssey.test'
      and not exists (select 1 from auth.identities identity_row where identity_row.user_id = user_account.id);
  end if;
end;
$$;

insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Synthetic Access Control Clinic'),
  ('10000000-0000-0000-0000-000000000002', 'Synthetic Other Clinic')
on conflict (id) do nothing;

insert into public.practitioners (id, organization_id, auth_user_id, name) values
  ('20000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '{"text":"Synthetic Doctor"}'::jsonb),
  ('20000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', '{"text":"Synthetic Nurse"}'::jsonb),
  ('20000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000105', '{"text":"Synthetic Front Desk"}'::jsonb),
  ('20000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000106', '{"text":"Synthetic Administrator"}'::jsonb),
  ('20000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000107', '{"text":"Synthetic Lab Staff"}'::jsonb),
  ('20000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000108', '{"text":"Synthetic Inventory Staff"}'::jsonb),
  ('20000000-0000-0000-0000-000000000109', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000109', '{"text":"Synthetic Specialist"}'::jsonb)
on conflict (id) do nothing;

insert into public.practitioner_roles (id, organization_id, practitioner_id, role_code) values
  ('30000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000101', 'doctor'),
  ('30000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000102', 'nurse'),
  ('30000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000105', 'front_desk'),
  ('30000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000106', 'admin'),
  ('30000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000107', 'lab_staff'),
  ('30000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000108', 'inventory_staff'),
  ('30000000-0000-0000-0000-000000000109', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000109', 'specialist')
on conflict (id) do nothing;

insert into public.patients (id, organization_id, auth_user_id, name) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', '{"text":"Synthetic Registered Patient"}'::jsonb),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000104', '{"text":"Synthetic Other Patient"}'::jsonb)
on conflict (id) do nothing;

insert into public.clinic_services (
  id, organization_id, owner_practitioner_role_id, code, name, description, duration_minutes, base_price, currency, delivery_modes
) values
  (
    '52000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000101',
    'GENERAL-CONSULT',
    'General consultation',
    'Primary care assessment with the clinic doctor.',
    30,
    650.00,
    'PHP',
    array['in_person', 'virtual']::public.appointment_delivery_mode[]
  ),
  (
    '52000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000101',
    'FOLLOW-UP',
    'Follow-up consultation',
    'Review progress and next steps after a previous visit.',
    30,
    450.00,
    'PHP',
    array['in_person', 'virtual']::public.appointment_delivery_mode[]
  )
on conflict (id) do nothing;

insert into public.appointments (id, organization_id, patient_id, practitioner_role_id, status, start_at, end_at) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', 'booked', now(), now() + interval '30 minutes'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', null, 'booked', now(), now() + interval '30 minutes')
on conflict (id) do nothing;

-- Six deterministic synthetic slots starting at the next UTC hour. The relative
-- times keep reset environments bookable without committing a fixed old date.
insert into public.appointment_slots (
  id, organization_id, practitioner_role_id, clinic_service_id, status, service_type, start_at, end_at
) values
  ('51000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000001', 'free', 'General consultation', date_trunc('hour', now()) + interval '1 hour', date_trunc('hour', now()) + interval '1 hour 30 minutes'),
  ('51000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000002', 'free', 'Follow-up consultation', date_trunc('hour', now()) + interval '2 hours', date_trunc('hour', now()) + interval '2 hours 30 minutes'),
  ('51000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000001', 'free', 'General consultation', date_trunc('hour', now()) + interval '3 hours', date_trunc('hour', now()) + interval '3 hours 30 minutes'),
  ('51000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000002', 'free', 'Follow-up consultation', date_trunc('hour', now()) + interval '4 hours', date_trunc('hour', now()) + interval '4 hours 30 minutes'),
  ('51000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000001', 'free', 'General consultation', date_trunc('hour', now()) + interval '5 hours', date_trunc('hour', now()) + interval '5 hours 30 minutes'),
  ('51000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000101', '52000000-0000-0000-0000-000000000002', 'free', 'Follow-up consultation', date_trunc('hour', now()) + interval '6 hours', date_trunc('hour', now()) + interval '6 hours 30 minutes')
on conflict (id) do nothing;

insert into public.encounters (id, organization_id, patient_id, appointment_id, status, period_start) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'in_progress', now()),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'in_progress', now())
on conflict (id) do nothing;

insert into public.observations (id, organization_id, patient_id, encounter_id, status, code, value) values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'final', 'synthetic-observation', '{"value":1}'::jsonb),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'final', 'synthetic-observation', '{"value":2}'::jsonb)
on conflict (id) do nothing;

insert into public.departments (id, organization_id, code, name, description, is_root_supply) values
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'OPD', 'Outpatient Department', 'Synthetic outpatient stock location.', false),
  ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ER', 'Emergency Room', 'Synthetic emergency stock location.', false),
  ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'OPD', 'Other Clinic OPD', 'Tenant-isolation test location.', false),
  ('90000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'SUPPLY', 'Central Supply Department', 'Root warehouse for clinic intake and requisition dispersal.', true),
  ('90000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'PHARM', 'Pharmacy Department', 'Satellite pharmacy department for medication dispensing and POS.', false)
on conflict (id) do nothing;

insert into public.inventory_categories (
  id, organization_id, department_id, name, description
) values
  ('94000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Department stock', 'Synthetic outpatient inventory category.'),
  ('94000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'Department stock', 'Synthetic emergency inventory category.'),
  ('94000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000003', 'Department stock', 'Synthetic tenant-isolation inventory category.')
on conflict (department_id, name) do update
set description = excluded.description,
    active = true;

insert into public.inventory_items (
  id, organization_id, sku, name, description, unit_of_measure,
  unit_cost, selling_price, unit_price, currency
) values
  ('91000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SYR-5ML', 'Syringe 5 mL', 'Single-use sterile syringe.', 'piece', 8.00, 15.00, 15.00, 'PHP'),
  ('91000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'GAUZE-2X2', 'Gauze pad 2x2', 'Sterile gauze pad.', 'piece', 4.50, 8.00, 8.00, 'PHP'),
  ('91000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'SYR-5ML', 'Other Clinic Syringe 5 mL', 'Tenant-isolation test item.', 'piece', 11.00, 20.00, 20.00, 'PHP')
on conflict (id) do nothing;

with stock_fixtures (
  id, organization_id, item_id, department_id, quantity, reorder_level
) as (
  values
    ('92000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '91000000-0000-0000-0000-000000000001'::uuid, '90000000-0000-0000-0000-000000000001'::uuid, 100::numeric, 20::numeric),
    ('92000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '91000000-0000-0000-0000-000000000001'::uuid, '90000000-0000-0000-0000-000000000002'::uuid, 40::numeric, 10::numeric),
    ('92000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '91000000-0000-0000-0000-000000000002'::uuid, '90000000-0000-0000-0000-000000000001'::uuid, 75::numeric, 15::numeric),
    ('92000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '91000000-0000-0000-0000-000000000003'::uuid, '90000000-0000-0000-0000-000000000003'::uuid, 500::numeric, 25::numeric)
)
insert into public.department_stock (
  id, organization_id, item_id, department_id, category_id, quantity, reorder_level
)
select
  fixture.id,
  fixture.organization_id,
  fixture.item_id,
  fixture.department_id,
  category.id,
  fixture.quantity,
  fixture.reorder_level
from stock_fixtures fixture
join public.inventory_categories category
  on category.organization_id = fixture.organization_id
 and category.department_id = fixture.department_id
 and category.name = 'Department stock'
 and category.active
on conflict (id) do nothing;

insert into public.inventory_stock_movements (
  id, organization_id, stock_id, item_id, department_id,
  movement_type, quantity_delta, reason
) values
  ('93000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'opening', 100, 'Synthetic opening stock'),
  ('93000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'opening', 40, 'Synthetic opening stock'),
  ('93000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 'opening', 75, 'Synthetic opening stock'),
  ('93000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000004', '91000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000003', 'opening', 500, 'Synthetic opening stock')
on conflict (id) do nothing;

insert into public.medication_requests (id, organization_id, patient_id, encounter_id, status, medication_code) values
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'active', 'synthetic-medication')
on conflict (id) do nothing;

insert into public.hello_world (message) values ('Odyssey Healthcare OS foundation is connected.');

-- ──────────────────────────────────────────────────────────────────────
-- Loop 5: Financial Seed Data
-- ──────────────────────────────────────────────────────────────────────

-- Organization default payor types
update public.organizations
set default_payor_type = 'self_pay'
where id = '10000000-0000-0000-0000-000000000001';

update public.organizations
set default_payor_type = 'philhealth_nbb'
where id = '10000000-0000-0000-0000-000000000002';

-- Coverages
insert into public.coverages (
  id, organization_id, patient_id, status, coverage_type, payor,
  payor_type, hmo_provider_name, hmo_member_number, max_benefit_limit, remaining_benefit
) values (
  'a4000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'active', 'hmo',
  '{"name": "Maxicare Healthcare"}'::jsonb,
  'hmo', 'Maxicare Healthcare', 'MAX-99281-PH', 100000.00, 95000.00
) on conflict (id) do nothing;

insert into public.coverages (
  id, organization_id, patient_id, status, coverage_type, payor,
  payor_type, philhealth_id, philhealth_category
) values (
  'a4000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  'active', 'public_health',
  '{"name": "Philippine Health Insurance Corporation"}'::jsonb,
  'philhealth_nbb', '12-345678901-2', 'employed'
) on conflict (id) do nothing;

-- Clinic 1: Self-Pay Billing Event & Paid Invoice
insert into public.billing_events (
  id, organization_id, encounter_id, patient_id, payor_type,
  billing_mode, billing_mode_source, status, finalized_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'self_pay', 'standard'::public.billing_mode, 'historical_payor',
  'finalized', now()
) on conflict (id) do nothing;

insert into public.billing_line_items (
  id, organization_id, billing_event_id, source_type, description, quantity, unit_price, currency
) values (
  'a5000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'clinic_service', 'General Medical Consultation', 1, 500.00, 'PHP'
), (
  'a5000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'inventory_usage', 'Syringe 5 mL', 1, 15.00, 'PHP'
) on conflict (id) do nothing;

insert into public.invoices (
  id, organization_id, billing_event_id, patient_id, invoice_number,
  status, subtotal, total_due, amount_paid, balance_due, issued_at, paid_at,
  qr_payment_token
) values (
  'a1000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'INV-20260903-00001',
  'paid', 515.00, 515.00, 515.00, 0.00, now(), now(),
  'tok_synthetic_paid_001'
) on conflict (id) do nothing;

insert into public.payments (
  id, organization_id, invoice_id, amount, currency, method, status,
  reference_number, confirmed_at
) values (
  'a2000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  515.00, 'PHP', 'cash', 'confirmed',
  'CSH-20260903-01', now()
) on conflict (id) do nothing;

-- Clinic 2: PhilHealth NBB Billing Event & Claim (Zero Balance for Patient)
insert into public.billing_events (
  id, organization_id, encounter_id, patient_id, payor_type,
  billing_mode, billing_mode_source, status, coverage_id, finalized_at
) values (
  'a0000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  'philhealth_nbb', 'nbb'::public.billing_mode, 'historical_payor', 'finalized',
  'a4000000-0000-0000-0000-000000000002', now()
) on conflict (id) do nothing;

insert into public.billing_line_items (
  id, organization_id, billing_event_id, source_type, description, quantity, unit_price, currency
) values (
  'a5000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'clinic_service', 'Government Hospital OPD Visit', 1, 600.00, 'PHP'
), (
  'a5000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'inventory_usage', 'Other Clinic Syringe 5 mL', 1, 20.00, 'PHP'
) on conflict (id) do nothing;

insert into public.claims (
  id, organization_id, patient_id, encounter_id, coverage_id,
  status, use, claim_type, billing_event_id, payor_type,
  billable_period_start, billable_period_end,
  provider_organization_id, total, philhealth_claim_number, submitted_at,
  payer_type, state, claimed_amount_centavos, items
) values (
  'a3000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000002',
  'a4000000-0000-0000-0000-000000000002',
  'active', 'claim', 'institutional',
  'a0000000-0000-0000-0000-000000000002', 'philhealth_nbb',
  current_date, current_date,
  '10000000-0000-0000-0000-000000000002', 620.00, 'PH-NBB-2026-0001', now(),
  'philhealth', 'submitted', 62000,
  '[{"description":"Government Hospital OPD Visit","quantity":1,"unit_price":600.00,"line_total":600.00},{"description":"Other Clinic Syringe 5 mL","quantity":1,"unit_price":20.00,"line_total":20.00}]'::jsonb
) on conflict (id) do nothing;

insert into public.invoices (
  id, organization_id, billing_event_id, patient_id, invoice_number,
  status, subtotal, total_due, amount_paid, balance_due, issued_at, paid_at
) values (
  'a1000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  'INV-20260903-00002',
  'paid', 620.00, 0.00, 0.00, 0.00, now(), now()
) on conflict (id) do nothing;

insert into public.platform_admins (user_id, granted_by)
select user_account.id, user_account.id
from auth.users user_account
where user_account.email = 'superadmin@odc.com'
on conflict (user_id) do nothing;

-- Published Clinical Document Templates (Prescriptions and Medical Certificates)
insert into public.document_templates (
  id, organization_id, code, name, category, description, body, structured_body,
  is_default, status, active, condition_system, condition_code, condition_display
) values
  (
    'e0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'TPL-RX-URI-01',
    'Acute Respiratory Infection Prescription',
    'prescription',
    'Standard protocol for acute upper respiratory infection',
    '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Take prescribed medications as directed with meals. Complete the full antibiotic course if indicated.</p>',
    jsonb_build_object(
      'html', '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Take prescribed medications as directed with meals. Complete the full antibiotic course if indicated.</p>',
      'medications', jsonb_build_array(
        jsonb_build_object('name', 'Amoxicillin 500 mg Capsule', 'dosage', '500 mg', 'frequency', 'every 8 hours', 'duration', '7 days', 'notes', 'Take after meals. Complete the entire 7-day course.'),
        jsonb_build_object('name', 'Paracetamol 500 mg Tablet', 'dosage', '500 mg', 'frequency', 'every 4 to 6 hours as needed for fever or pain', 'duration', '5 days', 'notes', 'Do not exceed 4,000 mg in 24 hours.')
      ),
      'branding', jsonb_build_object('source', 'none')
    ),
    true, 'published', true, 'ICD-10', 'J06.9', 'Acute upper respiratory infection, unspecified'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'TPL-RX-GEN-01',
    'Standard General Prescription',
    'prescription',
    'Standard general outpatient prescription',
    '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Follow dosage and instructions carefully. Return for follow-up if symptoms persist or worsen.</p>',
    jsonb_build_object(
      'html', '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Follow dosage and instructions carefully. Return for follow-up if symptoms persist or worsen.</p>',
      'medications', jsonb_build_array(
        jsonb_build_object('name', 'Cetirizine 10 mg Tablet', 'dosage', '10 mg', 'frequency', 'once daily at bedtime', 'duration', '7 days', 'notes', 'May cause drowsiness.')
      ),
      'branding', jsonb_build_object('source', 'none')
    ),
    false, 'published', true, null, null, null
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'TPL-MC-GEN-01',
    'General Medical Certificate',
    'medical_certificate',
    'Standard clinical medical certificate with rest recommendation',
    '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>The patient has been advised to rest for <strong>{{rest_days}}</strong> day(s) from the date of examination.</p><p>This certification is issued upon the request of the patient for whatever medical or legal purpose it may serve, except for medico-legal cases.</p>',
    jsonb_build_object(
      'html', '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>The patient has been advised to rest for <strong>{{rest_days}}</strong> day(s) from the date of examination.</p><p>This certification is issued upon the request of the patient for whatever medical or legal purpose it may serve, except for medico-legal cases.</p>',
      'medications', '[]'::jsonb,
      'branding', jsonb_build_object('source', 'none'),
      'certificate', jsonb_build_object('variant', 'general', 'remarks', 'Excused from physical exertion and strenuous activity.', 'restDays', '3')
    ),
    true, 'published', true, null, null, null
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'TPL-MC-FIT-01',
    'Fitness to Work Certificate',
    'medical_certificate',
    'Medical clearance certificate for returning to work duties',
    '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>After clinical evaluation, the patient is deemed <strong>FIT TO RESUME WORK</strong> with no physical limitations.</p><p>This certification is issued upon the request of the patient for employment / work clearance purposes.</p>',
    jsonb_build_object(
      'html', '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>After clinical evaluation, the patient is deemed <strong>FIT TO RESUME WORK</strong> with no physical limitations.</p><p>This certification is issued upon the request of the patient for employment / work clearance purposes.</p>',
      'medications', '[]'::jsonb,
      'branding', jsonb_build_object('source', 'none'),
      'certificate', jsonb_build_object('variant', 'fitness_to_work', 'remarks', 'Cleared to return to work duties.', 'restDays', '0')
    ),
    false, 'published', true, null, null, null
  )
on conflict (id) do nothing;

insert into public.document_template_versions (
  template_id, organization_id, version, title, type, structured_body
) values
  (
    'e0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1,
    'Acute Respiratory Infection Prescription', 'prescription',
    jsonb_build_object(
      'html', '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Take prescribed medications as directed with meals. Complete the full antibiotic course if indicated.</p>',
      'medications', jsonb_build_array(
        jsonb_build_object('name', 'Amoxicillin 500 mg Capsule', 'dosage', '500 mg', 'frequency', 'every 8 hours', 'duration', '7 days', 'notes', 'Take after meals. Complete the entire 7-day course.'),
        jsonb_build_object('name', 'Paracetamol 500 mg Tablet', 'dosage', '500 mg', 'frequency', 'every 4 to 6 hours as needed for fever or pain', 'duration', '5 days', 'notes', 'Do not exceed 4,000 mg in 24 hours.')
      ),
      'branding', jsonb_build_object('source', 'none')
    )
  ),
  (
    'e0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1,
    'Standard General Prescription', 'prescription',
    jsonb_build_object(
      'html', '<p>Rx for <strong>{{patient.name}}</strong></p><p>Diagnosis: {{diagnosis.summary}}</p><p>Follow dosage and instructions carefully. Return for follow-up if symptoms persist or worsen.</p>',
      'medications', jsonb_build_array(
        jsonb_build_object('name', 'Cetirizine 10 mg Tablet', 'dosage', '10 mg', 'frequency', 'once daily at bedtime', 'duration', '7 days', 'notes', 'May cause drowsiness.')
      ),
      'branding', jsonb_build_object('source', 'none')
    )
  ),
  (
    'e0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 1,
    'General Medical Certificate', 'medical_certificate',
    jsonb_build_object(
      'html', '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>The patient has been advised to rest for <strong>{{rest_days}}</strong> day(s) from the date of examination.</p><p>This certification is issued upon the request of the patient for whatever medical or legal purpose it may serve, except for medico-legal cases.</p>',
      'medications', '[]'::jsonb,
      'branding', jsonb_build_object('source', 'none'),
      'certificate', jsonb_build_object('variant', 'general', 'remarks', 'Excused from physical exertion and strenuous activity.', 'restDays', '3')
    )
  ),
  (
    'e0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 1,
    'Fitness to Work Certificate', 'medical_certificate',
    jsonb_build_object(
      'html', '<p>This is to certify that <strong>{{patient.name}}</strong>, {{patient.age}} years old, was clinically evaluated on {{encounter.date}}.</p><p><strong>Diagnosis:</strong> {{diagnosis.summary}}</p><p>After clinical evaluation, the patient is deemed <strong>FIT TO RESUME WORK</strong> with no physical limitations.</p><p>This certification is issued upon the request of the patient for employment / work clearance purposes.</p>',
      'medications', '[]'::jsonb,
      'branding', jsonb_build_object('source', 'none'),
      'certificate', jsonb_build_object('variant', 'fitness_to_work', 'remarks', 'Cleared to return to work duties.', 'restDays', '0')
    )
  )
on conflict (template_id, version) do nothing;
