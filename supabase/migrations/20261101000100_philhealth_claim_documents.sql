-- PhilHealth slice 5.3: data for the claim documents (PHIC Statement of
-- Account, Itemized Charges, Claim Signature Form).
-- One read-only RPC assembles the facility, patient, member, encounter,
-- diagnoses and every charge of the visit with Actual / PHIC / Excess split in
-- centavos. Until the fee-schedule engine (slice 5.2) exists, the PHIC amount
-- of a charge on the claim is its billed amount and `phic_basis` says so.
-- Rollback: drop public.get_philhealth_claim_document(uuid).

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
  select organization.* into v_organization from public.organizations organization where organization.id = v_claim.organization_id;
  select settings.* into v_settings from public.organization_settings settings where settings.organization_id = v_claim.organization_id;
  select coverage.* into v_coverage from public.coverages coverage where coverage.id = v_claim.coverage_id;

  select practitioner.name ->> 'text',
    (select identifier ->> 'value'
     from jsonb_array_elements(case when jsonb_typeof(practitioner.identifier) = 'array' then practitioner.identifier else '[]'::jsonb end) identifier
     where identifier ->> 'system' ilike '%philhealth%'
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
      'name', coalesce(v_patient.name ->> 'text', trim(concat_ws(' ', v_patient.name -> 'given' ->> 0, v_patient.name ->> 'family'))),
      'sex', v_patient.gender,
      'birth_date', v_patient.birth_date,
      'address', (select address_item ->> 'text' from jsonb_array_elements(case when jsonb_typeof(v_patient.address) = 'array' then v_patient.address else '[]'::jsonb end) address_item limit 1)
    ),
    'member', jsonb_build_object(
      'pin', v_coverage.philhealth_id,
      'category', v_coverage.philhealth_category,
      'relationship', coalesce(v_coverage.beneficiary_relationship, 'self'),
      'eligibility_reference', v_coverage.philhealth_eligibility_reference
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

revoke all on function public.get_philhealth_claim_document(uuid) from public, anon;
grant execute on function public.get_philhealth_claim_document(uuid) to authenticated;

comment on function public.get_philhealth_claim_document(uuid) is
  'Read-only data for the PHIC Statement of Account, Itemized Charges and Claim Signature Form of one claim. Money is in centavos; phic_basis tells how the PHIC column was derived.';
