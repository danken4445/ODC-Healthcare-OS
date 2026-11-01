-- PhilHealth slice 5.0: record a patient's PhilHealth PIN and member category.
-- Zero-balance rules (resolve_billing_mode) and claim submission both read the
-- active PhilHealth coverage, so billing staff need a validated way to record it.
-- Rollback: drop public.save_patient_philhealth_coverage.

create or replace function public.save_patient_philhealth_coverage(
  p_organization_id uuid,
  p_patient_id uuid,
  p_philhealth_id text,
  p_category text,
  p_beneficiary_relationship text default 'self',
  p_eligibility_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_digits text := regexp_replace(coalesce(p_philhealth_id, ''), '[^0-9]', '', 'g');
  v_pin text;
  v_reference text := nullif(btrim(p_eligibility_reference), '');
  v_coverage_id uuid;
begin
  if not (
    public.is_superadmin()
    or public.has_organization_permission(p_organization_id, 'can_manage_billing')
    or public.has_organization_permission(p_organization_id, 'can_manage_claims')
  ) then
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
  if coalesce(p_beneficiary_relationship, 'self') not in ('self', 'spouse', 'child', 'parent') then
    raise exception 'Relationship to the member must be self, spouse, child or parent.' using errcode = '22023';
  end if;
  v_pin := substr(v_digits, 1, 2) || '-' || substr(v_digits, 3, 9) || '-' || substr(v_digits, 12, 1);

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
      philhealth_category, beneficiary_relationship,
      philhealth_eligibility_reference, philhealth_eligibility_checked_at
    ) values (
      p_organization_id, p_patient_id, 'active', 'philhealth',
      '{"name":"Philippine Health Insurance Corporation"}'::jsonb, v_pin,
      p_category, coalesce(p_beneficiary_relationship, 'self'),
      v_reference, case when v_reference is not null then now() end
    ) returning id into v_coverage_id;
  else
    update public.coverages
    set philhealth_id = v_pin,
        philhealth_category = p_category,
        beneficiary_relationship = coalesce(p_beneficiary_relationship, 'self'),
        philhealth_eligibility_reference = coalesce(v_reference, philhealth_eligibility_reference),
        philhealth_eligibility_checked_at = case when v_reference is not null then now() else philhealth_eligibility_checked_at end
    where id = v_coverage_id;
  end if;

  -- Open drafts pick up the coverage so the claim can be submitted.
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

revoke all on function public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text) from public, anon;
grant execute on function public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text) to authenticated;

comment on function public.save_patient_philhealth_coverage(uuid, uuid, text, text, text, text) is
  'Records or updates the patient''s active PhilHealth coverage (12-digit PIN, member category, relationship, eligibility reference).';
