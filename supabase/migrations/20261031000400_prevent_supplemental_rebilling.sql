-- PhilHealth slice 5.0: stop supplemental bills from re-charging billed items.
-- A lab ordered on a finished encounter opens a supplemental draft bill.
-- Finalizing it calls generate_billing_event, which re-syncs every usage and
-- lab request of the encounter into the new draft; the line uniqueness key
-- includes billing_event_id, so items already invoiced were charged again.
-- Each sync now returns early when its source is already on a finalized bill.
-- The lab sync also stops failing with a tenant-integrity error when the
-- encounter has no open draft yet.
-- Rollback: restore sync_inventory_usage_to_billing from 20261002161603 and
-- sync_laboratory_request_to_billing from 20260927180000.

create or replace function public.billed_on_finalized_event(p_source_type text, p_source_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select line.billing_event_id
  from public.billing_line_items line
  join public.billing_events event on event.id = line.billing_event_id
  where line.source_type = p_source_type
    and line.source_id = p_source_id
    and event.status = 'finalized'
  limit 1;
$$;

create or replace function public.sync_inventory_usage_to_billing(p_usage_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_usage public.inventory_usages%rowtype;
  v_item public.inventory_items%rowtype;
  v_event public.billing_events%rowtype;
  v_event_id uuid;
  v_line_id uuid;
begin
  select * into v_usage
  from public.inventory_usages
  where id = p_usage_id;
  if not found then
    raise exception 'Inventory usage not found.' using errcode = 'P0002';
  end if;

  v_event_id := public.billed_on_finalized_event('inventory_usage', v_usage.id);
  if v_event_id is not null then
    return v_event_id;
  end if;

  select * into v_item
  from public.inventory_items
  where id = v_usage.item_id
    and organization_id = v_usage.organization_id;

  v_event_id := public.ensure_encounter_draft_bill(v_usage.encounter_id);
  select * into v_event
  from public.billing_events
  where id = v_event_id;
  if not found or v_event.organization_id is distinct from v_usage.organization_id then
    raise exception 'Encounter billing event is missing or belongs to another organization.'
      using errcode = '23514';
  end if;

  insert into public.billing_line_items (
    organization_id, billing_event_id, source_type, source_id, description,
    quantity, unit_price, unit_cost, currency, billing_mode, payor_type,
    payment_status, tagged_by, tagged_at
  ) values (
    v_usage.organization_id, v_event.id, 'inventory_usage', v_usage.id, v_item.name,
    v_usage.quantity, v_usage.unit_price, v_usage.unit_cost, v_usage.currency,
    v_event.billing_mode, v_event.payor_type, 'unpaid', v_usage.tagged_by, v_usage.used_at
  ) on conflict (billing_event_id, source_type, source_id) where source_id is not null
  do update set description = excluded.description
  returning id into v_line_id;

  insert into public.inventory_usage_financial_ledger (
    organization_id, usage_id, billing_line_item_id, state, quantity,
    unbilled_qty, paid_qty, tagged_by, tagged_at
  ) values (
    v_usage.organization_id, v_usage.id, v_line_id, 'tagged', v_usage.quantity,
    v_usage.quantity, 0, v_usage.tagged_by, v_usage.used_at
  ) on conflict (usage_id) do nothing;
  return v_event.id;
end;
$$;

create or replace function public.sync_laboratory_request_to_billing(p_service_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request public.service_requests%rowtype;
  v_service public.laboratory_services%rowtype;
  v_event public.billing_events%rowtype;
  v_billed_event_id uuid;
begin
  select * into v_request from public.service_requests where id = p_service_request_id;
  if not found or v_request.category <> 'laboratory' then raise exception 'Laboratory request not found.' using errcode = 'P0002'; end if;

  v_billed_event_id := public.billed_on_finalized_event('laboratory_service', v_request.id);
  if v_billed_event_id is not null then
    return v_billed_event_id;
  end if;

  select * into v_service from public.laboratory_services
  where organization_id = v_request.organization_id and code = v_request.code;
  if not found then raise exception 'Laboratory catalog service not found.' using errcode = 'P0002'; end if;
  -- Materialize the draft id first: calling the creator inside the SELECT
  -- predicate uses the statement snapshot and cannot see the new draft row
  -- (same defect fixed for inventory in 20261002161603).
  v_billed_event_id := public.ensure_encounter_draft_bill(v_request.encounter_id);
  select * into v_event from public.billing_events where id = v_billed_event_id;
  insert into public.billing_line_items (
    organization_id, billing_event_id, source_type, source_id, description,
    quantity, unit_price, currency, billing_mode, payor_type, payment_status,
    tagged_by, tagged_at
  ) values (
    v_request.organization_id, v_event.id, 'laboratory_service', v_request.id,
    v_service.name, 1, v_service.lab_cost, 'PHP', v_event.billing_mode,
    v_event.payor_type, 'unpaid', auth.uid(), now()
  ) on conflict (billing_event_id, source_type, source_id) where source_id is not null
  do update set description = excluded.description;
  return v_event.id;
end;
$$;

revoke all on function public.billed_on_finalized_event(text, uuid) from public, anon, authenticated;
revoke all on function public.sync_inventory_usage_to_billing(uuid) from public, anon, authenticated;
revoke all on function public.sync_laboratory_request_to_billing(uuid) from public, anon, authenticated;
