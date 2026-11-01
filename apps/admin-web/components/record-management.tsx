"use client";

import {
  adjudicateClaim,
  assignStaffDepartment,
  assignStaffRole,
  bookAppointmentSlot,
  createClinicAccount,
  createPosSale,
  deleteClinicRoleDefinition,
  finalizeBillingEvent,
  generateBillingEvent,
  getAvailableAppointmentSlots,
  getBillableEncounters,
  getClinicRoleDefinitions,
  getGovernancePatients,
  getPhilhealthClaimDocument,
  getStaffAdministration,
  recordPayment,
  resetClinicRolePermissions,
  saveAdminClinicService,
  saveClinicRoleDefinition,
  saveCompanyCoverage,
  savePatientPhilhealthCoverage,
  saveDocumentTemplate,
  saveStaffDepartment,
  setClinicUserActive,
  setGovernancePatientActive,
  setOrganizationModule,
  submitClaim,
  updateAppointmentStatus,
} from "@odyssey/supabase-client";
import type {
  AppointmentDeliveryMode,
  AppointmentSlotSummary,
  BillableEncounter,
  ClinicRoleDefinition,
  DocumentTemplateCategory,
  GovernancePatientSummary,
  InventoryItemSummary,
  OrganizationModuleKey,
  PaymentMethod,
  PhilhealthMemberCategory,
} from "@odyssey/types";
import { Edit3, ExternalLink, FileText, Plus, Power, ReceiptText, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  featurePermissions,
  permissionOptions,
  portalPermissions,
  type AdminDataset,
} from "../lib/admin-data";
import { useAdminData } from "./admin-data-context";
import { buildClaimSignatureFormDocument, buildStatementOfAccountDocument } from "./philhealth-claim-documents";
import type { DataRow } from "./data-table";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";

type ManagementProps = {
  dataset: AdminDataset;
  label?: string;
  onChanged: () => void;
  row?: DataRow;
};

type SelectOption = { id: string; label: string };
type PosItem = Pick<InventoryItemSummary, "id" | "name" | "sku" | "selling_price"> & { stock: number };

const permissionByDataset = {
  patients: "can_manage_patients",
  appointments: "can_manage_appointments",
  billing: "can_manage_billing",
  claims: "can_manage_claims",
  companies: "can_manage_billing",
  pos: "can_manage_pos",
  staff: "can_manage_staff_roles",
  departments: "can_manage_staff_roles",
  roles: "can_manage_staff_roles",
  services: "can_manage_service_catalog",
  templates: "can_manage_document_templates",
  features: "can_manage_feature_modules",
} as const;

const editableDatasets = new Set<AdminDataset>([
  "appointments",
  "billing",
  "companies",
  "pos",
  "staff",
  "departments",
  "roles",
  "services",
  "templates",
  "admins",
  "clinics",
]);

function value(row: DataRow | undefined, key: string, fallback = "") {
  const candidate = row?.[key];
  return typeof candidate === "string" || typeof candidate === "number" ? String(candidate) : fallback;
}

function checked(row: DataRow | undefined, key: string, fallback: boolean) {
  return typeof row?.[key] === "boolean" ? Boolean(row[key]) : fallback;
}

function formatSlot(slot: AppointmentSlotSummary) {
  const start = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(slot.start_at));
  return `${start} · ${slot.service_type}`;
}

function Field({ children, label, span = false }: { children: React.ReactNode; label: string; span?: boolean }) {
  return <label className={`field-label${span ? " field-span" : ""}`}>{label}{children}</label>;
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ui-input" {...props}>{children}</select>;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="ui-input ui-textarea" {...props} />;
}

function useCanManage(dataset: AdminDataset) {
  const { isSuperadmin, permissions } = useAdminData();
  if (dataset === "companies") return isSuperadmin || permissions.includes("can_manage_billing") || permissions.includes("can_manage_claims");
  const permission = permissionByDataset[dataset as keyof typeof permissionByDataset];
  return isSuperadmin || Boolean(permission && permissions.includes(permission));
}

function RecordEditorDialog({ dataset, label, onChanged, row }: ManagementProps) {
  const { assignedDepartmentId, client, isItAdmin, isSuperadmin, organization } = useAdminData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<GovernancePatientSummary[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotSummary[]>([]);
  const [encounters, setEncounters] = useState<BillableEncounter[]>([]);
  const [roles, setRoles] = useState<ClinicRoleDefinition[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [posItems, setPosItems] = useState<PosItem[]>([]);
  const editing = Boolean(row);

  const loadOptions = useCallback(async () => {
    if (!organization) return;
    setLoadingOptions(true);
    setError(null);
    if (dataset === "appointments" || dataset === "companies") {
      const patientResult = await getGovernancePatients(client, organization.id);
      if (patientResult.error) setError(patientResult.error.message);
      else setPatients(patientResult.data);
      if (dataset === "appointments") {
        const slotResult = await getAvailableAppointmentSlots(client, organization.id);
        if (slotResult.error) setError(slotResult.error.message);
        else setSlots(slotResult.data);
      }
    } else if (dataset === "billing") {
      const result = await getBillableEncounters(client, organization.id);
      if (result.error) setError(result.error.message);
      else setEncounters(result.data);
    } else if (dataset === "staff") {
      const [roleResult, staffResult] = await Promise.all([
        getClinicRoleDefinitions(client, organization.id),
        getStaffAdministration(client, organization.id),
      ]);
      if (roleResult.error) setError(roleResult.error.message);
      else {
        let roleList = roleResult.data;
        if (isItAdmin) {
          roleList = roleList.filter((r) => r.code !== "admin" && r.code !== "owner");
        }
        setRoles(roleList);
      }
      if (staffResult.error) setError(staffResult.error.message);
      else {
        let depts = staffResult.data.departments.filter((department) => department.active);
        if (assignedDepartmentId && !isSuperadmin && !isItAdmin) {
          depts = depts.filter((d) => d.id === assignedDepartmentId);
        }
        setDepartments(depts.map((department) => ({ id: department.id, label: department.name })));
      }
    } else if (dataset === "pos") {
      const [itemResult, stockResult] = await Promise.all([
        client.from("inventory_items").select("id, name, sku, selling_price").eq("organization_id", organization.id).eq("active", true).order("name"),
        client.from("department_stock").select("item_id, quantity").eq("organization_id", organization.id),
      ]);
      if (itemResult.error || stockResult.error) setError(itemResult.error?.message ?? stockResult.error?.message ?? "Inventory could not be loaded.");
      else {
        const stock = new Map<string, number>();
        for (const item of stockResult.data ?? []) stock.set(item.item_id, (stock.get(item.item_id) ?? 0) + Number(item.quantity));
        setPosItems((itemResult.data ?? []).map((item) => ({ ...item, stock: stock.get(item.id) ?? 0 })));
      }
    }
    setLoadingOptions(false);
  }, [assignedDepartmentId, client, dataset, isItAdmin, isSuperadmin, organization]);

  useEffect(() => {
    if (open) void loadOptions();
  }, [loadOptions, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    let result: { error: { message: string } | null } = { error: { message: "This operation is not available." } };

    if (dataset === "services") {
      const deliveryModes = [form.get("inPerson") ? "in_person" : null, form.get("virtual") ? "virtual" : null].filter(Boolean) as AppointmentDeliveryMode[];
      result = await saveAdminClinicService(client, organization.id, {
        id: row ? value(row, "id") : undefined,
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        durationMinutes: Number(form.get("durationMinutes")),
        basePrice: Number(form.get("basePrice")),
        currency: String(form.get("currency") ?? "PHP"),
        bookingEnabled: Boolean(form.get("bookingEnabled")),
        active: Boolean(form.get("active")),
        deliveryModes,
      });
    } else if (dataset === "templates") {
      result = await saveDocumentTemplate(client, organization.id, {
        id: row ? value(row, "id") : undefined,
        name: String(form.get("name") ?? "").trim(),
        category: String(form.get("category")) as DocumentTemplateCategory,
        description: String(form.get("description") ?? "").trim(),
        body: String(form.get("body") ?? ""),
        active: Boolean(form.get("active")),
      });
    } else if (dataset === "staff" && !editing) {
      const isDeptLocked = Boolean(assignedDepartmentId && !isSuperadmin && !isItAdmin);
      const targetDeptId = isDeptLocked ? assignedDepartmentId : (String(form.get("departmentId") || "") || null);
      const selectedRoleCode = String(form.get("roleCode") ?? "front_desk");
      if (isItAdmin && (selectedRoleCode === "admin" || selectedRoleCode === "owner")) {
        setError("IT administrators cannot create admin or owner accounts.");
        setSaving(false);
        return;
      }
      const accountResult = await createClinicAccount(client, {
        organizationId: organization.id,
        displayName: String(form.get("displayName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        roleCode: selectedRoleCode,
      });
      result = accountResult;
      if (!accountResult.error && accountResult.data && targetDeptId) {
        result = await assignStaffDepartment(client, { organizationId: organization.id, userId: accountResult.data.id, departmentId: targetDeptId });
      }
    } else if (dataset === "staff" && editing) {
      const isDeptLocked = Boolean(assignedDepartmentId && !isSuperadmin && !isItAdmin);
      const targetDeptId = isDeptLocked ? assignedDepartmentId : (String(form.get("departmentId") || "") || null);
      const targetRoleCode = String(form.get("roleCode") || "");
      if (isItAdmin && (targetRoleCode === "admin" || targetRoleCode === "owner")) {
        setError("IT administrators cannot assign admin or owner roles.");
        setSaving(false);
        return;
      }
      result = await assignStaffDepartment(client, { organizationId: organization.id, userId: value(row, "id"), departmentId: targetDeptId });
      if (!result.error && targetRoleCode && targetRoleCode !== value(row, "roleCode")) {
        result = await assignStaffRole(client, { organizationId: organization.id, userId: value(row, "id"), roleCode: targetRoleCode });
      }
    } else if (dataset === "appointments") {
      result = await bookAppointmentSlot(client, String(form.get("slotId")), String(form.get("patientId")), String(form.get("deliveryMode")) as AppointmentDeliveryMode, organization.id);
    } else if (dataset === "billing") {
      const generated = await generateBillingEvent(client, organization.id, String(form.get("encounterId")), (String(form.get("payorType")) || undefined) as "self_pay" | "hmo" | "philhealth_nbb" | "government_subsidized" | undefined);
      result = generated;
      if (!generated.error && generated.data) result = await finalizeBillingEvent(client, generated.data);
    } else if (dataset === "companies") {
      result = await saveCompanyCoverage(client, {
        organizationId: organization.id,
        id: row ? value(row, "id") : undefined,
        patientId: String(form.get("patientId")),
        coverageType: String(form.get("coverageType")),
        subscriberId: String(form.get("subscriberId") || "") || undefined,
        payorName: String(form.get("company") ?? "").trim(),
        periodStart: String(form.get("periodStart") || "") || undefined,
        periodEnd: String(form.get("periodEnd") || "") || undefined,
        status: String(form.get("status")),
      });
    } else if (dataset === "pos") {
      result = await createPosSale(client, organization.id, [{ item_id: String(form.get("itemId")), quantity: Number(form.get("quantity")) }], String(form.get("customerName") || "") || undefined, String(form.get("paymentMethod")) as PaymentMethod);
    } else if (dataset === "admins") {
      result = await createClinicAccount(client, {
        organizationId: organization.id,
        displayName: String(form.get("displayName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        roleCode: "admin",
      });
    } else if (dataset === "clinics" && row) {
      const response = await client.from("organizations").update({ name: String(form.get("name") ?? "").trim(), active: Boolean(form.get("active")) }).eq("id", value(row, "id"));
      result = { error: response.error };
    }

    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onChanged();
  }

  const title = editing ? `Edit ${label?.toLowerCase() ?? "record"}` : label ?? "Create record";
  return (
    <>
      <Button size={editing ? "sm" : "md"} variant={editing ? "outline" : "primary"} onClick={() => setOpen(true)}>
        {editing ? <Edit3 aria-hidden="true" size={14} /> : dataset === "billing" ? <ReceiptText aria-hidden="true" size={16} /> : <Plus aria-hidden="true" size={16} />}
        {editing ? "Edit" : label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={title} description="Changes are saved to the selected organization and remain subject to database permissions and audit logging.">
        <form className="dialog-body" onSubmit={submit}>
          {loadingOptions ? <p className="form-status" aria-live="polite">Loading available records…</p> : null}
          {dataset === "services" ? <div className="form-grid">
            <Field label="Service name"><Input name="name" defaultValue={value(row, "name")} required /></Field>
            <Field label="Duration (minutes)"><Input name="durationMinutes" type="number" min="5" defaultValue={value(row, "durationMinutes", "30")} required /></Field>
            <Field label="Base price"><Input name="basePrice" type="number" min="0" step="0.01" defaultValue={value(row, "basePrice", "0")} required /></Field>
            <Field label="Currency"><Input name="currency" defaultValue={value(row, "currency", "PHP")} maxLength={3} required /></Field>
            <Field label="Description" span><Textarea name="description" defaultValue={value(row, "description")} /></Field>
            <label className="check-option"><input name="inPerson" type="checkbox" defaultChecked={!row || value(row, "deliveryModes").includes("in_person")} /> In-person</label>
            <label className="check-option"><input name="virtual" type="checkbox" defaultChecked={value(row, "deliveryModes").includes("virtual")} /> Virtual</label>
            <label className="check-option"><input name="bookingEnabled" type="checkbox" defaultChecked={checked(row, "bookingEnabled", true)} /> Available for booking</label>
            <label className="check-option"><input name="active" type="checkbox" defaultChecked={checked(row, "active", true)} /> Active</label>
          </div> : null}

          {dataset === "templates" ? <div className="form-grid">
            <Field label="Template name"><Input name="name" defaultValue={value(row, "name")} required /></Field>
            <Field label="Category"><Select name="category" defaultValue={value(row, "categoryCode", "general")}><option value="medical_certificate">Medical certificate</option><option value="prescription">Prescription</option><option value="referral">Referral</option><option value="laboratory">Laboratory</option><option value="invoice">Invoice</option><option value="general">General</option></Select></Field>
            <Field label="Description" span><Input name="description" defaultValue={value(row, "description")} /></Field>
            <Field label="Template body" span><Textarea name="body" defaultValue={value(row, "body")} required /></Field>
            <label className="check-option field-span"><input name="active" type="checkbox" defaultChecked={checked(row, "active", true)} /> Active and available to staff</label>
          </div> : null}

          {dataset === "staff" ? <div className="form-grid">
            {!editing ? <><Field label="Full name"><Input name="displayName" required /></Field><Field label="Work email"><Input name="email" type="email" required /></Field><Field label="Temporary password"><Input name="password" type="password" minLength={8} required /></Field><Field label="Role"><Select name="roleCode" defaultValue="front_desk">{roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</Select></Field></> : <div className="confirmation-summary field-span"><span>Staff member</span><strong>{value(row, "name")}</strong> <small style={{ color: "var(--color-text-secondary, #64748b)" }}>{value(row, "email")}</small></div>}
            {editing ? (
              <Field label="Role" span>
                <Select name="roleCode" defaultValue={value(row, "roleCode") || "front_desk"}>
                  {roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                </Select>
              </Field>
            ) : null}
            <Field label="Department" span>
              <Select
                name="departmentId"
                defaultValue={value(row, "departmentId") || (assignedDepartmentId && !isSuperadmin && !isItAdmin ? assignedDepartmentId : "")}
                disabled={Boolean(assignedDepartmentId && !isSuperadmin && !isItAdmin)}
              >
                {!(assignedDepartmentId && !isSuperadmin && !isItAdmin) && <option value="">Not assigned</option>}
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div> : null}

          {dataset === "appointments" ? <div className="form-grid">
            <Field label="Patient"><Select name="patientId" required><option value="">Select patient</option>{patients.filter((patient) => patient.active).map((patient) => <option key={patient.patientId} value={patient.patientId}>{patient.displayName}</option>)}</Select></Field>
            <Field label="Delivery mode"><Select name="deliveryMode" defaultValue="in_person"><option value="in_person">In-person</option><option value="virtual">Virtual</option></Select></Field>
            <Field label="Available slot" span><Select name="slotId" required><option value="">Select date and time</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{formatSlot(slot)}</option>)}</Select></Field>
          </div> : null}

          {dataset === "billing" ? <div className="form-grid">
            <Field label="Completed encounter" span><Select name="encounterId" required><option value="">Select encounter</option>{encounters.map((encounter) => <option key={encounter.id} value={encounter.id}>{encounter.patient_name} · {encounter.service_name ?? encounter.service_type ?? "Encounter"}</option>)}</Select></Field>
            <Field label="Payor route" span><Select name="payorType" defaultValue=""><option value="">Use recorded coverage</option><option value="self_pay">Self-pay invoice</option><option value="hmo">HMO claim</option><option value="philhealth_nbb">PhilHealth NBB claim</option><option value="government_subsidized">Government-subsidized claim</option></Select></Field>
          </div> : null}

          {dataset === "companies" ? <div className="form-grid">
            <Field label="Company / payor"><Input name="company" defaultValue={value(row, "company")} required /></Field>
            <Field label="Subscriber ID"><Input name="subscriberId" defaultValue={value(row, "subscriberId")} /></Field>
            <Field label="Covered patient"><Select name="patientId" defaultValue={value(row, "patientId")} required><option value="">Select patient</option>{patients.map((patient) => <option key={patient.patientId} value={patient.patientId}>{patient.displayName}</option>)}</Select></Field>
            <Field label="Coverage type"><Select name="coverageType" defaultValue={value(row, "coverageTypeCode", "employer_sponsored")}><option value="employer_sponsored">Employer sponsored</option><option value="company">Company</option><option value="corporate">Corporate</option><option value="employer">Employer</option></Select></Field>
            <Field label="Start date"><Input name="periodStart" type="date" defaultValue={value(row, "periodStart")} /></Field>
            <Field label="End date"><Input name="periodEnd" type="date" defaultValue={value(row, "periodEnd")} /></Field>
            <Field label="Status" span><Select name="status" defaultValue={value(row, "statusCode", "active")}><option value="active">Active</option><option value="draft">Draft</option><option value="cancelled">Cancelled</option><option value="entered_in_error">Entered in error</option></Select></Field>
          </div> : null}

          {dataset === "pos" ? <div className="form-grid">
            <Field label="Inventory item" span><Select name="itemId" required><option value="">Select item</option>{posItems.filter((item) => item.stock > 0).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku}) · {item.stock} available · ₱{Number(item.selling_price).toFixed(2)}</option>)}</Select></Field>
            <Field label="Quantity"><Input name="quantity" type="number" min="1" step="1" defaultValue="1" required /></Field>
            <Field label="Payment method"><Select name="paymentMethod" defaultValue="cash"><option value="cash">Cash</option><option value="card">Card</option><option value="qr_ewallet">QR / e-wallet</option><option value="bank_transfer">Bank transfer</option><option value="check">Check</option></Select></Field>
            <Field label="Customer name" span><Input name="customerName" placeholder="Walk-in customer" /></Field>
          </div> : null}

          {dataset === "admins" ? <div className="form-grid">
            <div className="confirmation-summary field-span"><span>Organization scope</span><strong>{organization?.name ?? "Select an organization"}</strong></div>
            <Field label="Full name"><Input name="displayName" required /></Field>
            <Field label="Work email"><Input name="email" type="email" required /></Field>
            <Field label="Temporary password" span><Input name="password" type="password" minLength={8} required /></Field>
          </div> : null}

          {dataset === "clinics" ? <div className="form-grid">
            <Field label="Organization name" span><Input name="name" defaultValue={value(row, "name")} required /></Field>
            <label className="check-option field-span"><input name="active" type="checkbox" defaultChecked={checked(row, "active", true)} /> Organization is active</label>
          </div> : null}

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving || loadingOptions}>{saving ? "Saving…" : editing ? "Save changes" : dataset === "billing" ? "Create and finalize" : "Create record"}</Button></div>
        </form>
      </Dialog>
    </>
  );
}

function PaymentDialog({ onChanged, row }: Pick<ManagementProps, "onChanged" | "row">) {
  const { client } = useAdminData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await recordPayment(client, value(row, "id"), Number(form.get("amount")), String(form.get("method")) as PaymentMethod, String(form.get("reference") || "") || undefined);
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onChanged();
  }
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}>Record payment</Button><Dialog open={open} onOpenChange={setOpen} title="Record invoice payment" description={`${value(row, "invoice")} has an outstanding balance of ₱${Number(row?.balance ?? 0).toFixed(2)}.`}><form className="dialog-body" onSubmit={submit}><Field label="Amount"><Input name="amount" type="number" min="0.01" max={Number(row?.balance ?? 0)} step="0.01" defaultValue={value(row, "balance")} required /></Field><Field label="Payment method"><Select name="method"><option value="cash">Cash</option><option value="card">Card</option><option value="qr_ewallet">QR / e-wallet</option><option value="bank_transfer">Bank transfer</option><option value="check">Check</option></Select></Field><Field label="Reference"><Input name="reference" /></Field>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="dialog-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Record payment"}</Button></div></form></Dialog></>;
}

function ClaimDocumentButtons({ claimId }: { claimId: string }) {
  const { client } = useAdminData();
  const [busy, setBusy] = useState<"soa" | "csf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function openDocument(kind: "soa" | "csf") {
    // Open the window during the click so pop-up blockers allow it, then fill it.
    const preview = window.open("", "_blank");
    if (!preview) return setError("Allow pop-ups for this site to open claim documents.");
    preview.document.write("<p style=\"font:14px Arial;padding:24px\">Preparing document…</p>");
    setBusy(kind);
    setError(null);
    const result = await getPhilhealthClaimDocument(client, claimId);
    setBusy(null);
    if (result.error) {
      preview.close();
      return setError(result.error.message);
    }
    const html = kind === "soa" ? buildStatementOfAccountDocument(result.data) : buildClaimSignatureFormDocument(result.data);
    preview.document.open();
    preview.document.write(html);
    preview.document.close();
  }
  return <>
    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void openDocument("soa")} title="PHIC Statement of Account and Itemized Charges"><FileText aria-hidden="true" size={14} />{busy === "soa" ? "Preparing…" : "SOA"}</Button>
    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void openDocument("csf")} title="Pre-filled Claim Signature Form"><FileText aria-hidden="true" size={14} />{busy === "csf" ? "Preparing…" : "CSF"}</Button>
    {error ? <span className="form-error" role="alert">{error}</span> : null}
  </>;
}

function ClaimActions({ onChanged, row }: Pick<ManagementProps, "onChanged" | "row">) {
  const { client } = useAdminData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = Boolean(row?.submitted);
  const adjudicated = Boolean(row?.adjudicated);
  const documents = row?.philhealth ? <ClaimDocumentButtons claimId={value(row, "id")} /> : null;
  async function send() {
    setSaving(true);
    const result = await submitClaim(client, value(row, "id"));
    setSaving(false);
    if (result.error) return setError(result.error.message);
    onChanged();
  }
  async function adjudicate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await adjudicateClaim(client, value(row, "id"), String(form.get("result")) as "approved" | "denied" | "partial", Number(form.get("amount")) || undefined, String(form.get("reason") || "") || undefined);
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onChanged();
  }
  if (!submitted) return <div className="record-actions">{documents}<Button size="sm" disabled={saving} onClick={() => void send()}>{saving ? "Submitting…" : "Submit claim"}</Button>{error ? <span className="form-error" role="alert">{error}</span> : null}</div>;
  if (adjudicated) return documents ? <div className="record-actions">{documents}</div> : null;
  return <><div className="record-actions">{documents}<Button size="sm" variant="outline" onClick={() => setOpen(true)}>Adjudicate</Button></div><Dialog open={open} onOpenChange={setOpen} title="Adjudicate claim" description="Record the payor decision and approved amount."><form className="dialog-body" onSubmit={adjudicate}><Field label="Decision"><Select name="result"><option value="approved">Approved</option><option value="partial">Partially approved</option><option value="denied">Denied</option></Select></Field><Field label="Approved amount"><Input name="amount" type="number" min="0" step="0.01" defaultValue={value(row, "amount")} /></Field><Field label="Reason"><Textarea name="reason" /></Field>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="dialog-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Record decision"}</Button></div></form></Dialog></>;
}

function AppointmentActions({ onChanged, row }: Pick<ManagementProps, "onChanged" | "row">) {
  const { client, organization } = useAdminData();
  const [saving, setSaving] = useState(false);
  const status = value(row, "statusCode");
  async function change(next: "arrived" | "cancelled" | "noshow") {
    setSaving(true);
    await updateAppointmentStatus(client, value(row, "id"), next, organization?.id);
    setSaving(false);
    onChanged();
  }
  if (!['booked', 'arrived'].includes(status)) return null;
  return <div className="record-actions">{status === "booked" ? <Button size="sm" disabled={saving} onClick={() => void change("arrived")}>Check in</Button> : null}{status === "booked" ? <Button size="sm" variant="outline" disabled={saving} onClick={() => void change("noshow")}>No-show</Button> : null}<Button size="sm" variant="danger" disabled={saving} onClick={() => void change("cancelled")}>Cancel</Button></div>;
}

function PhilhealthCoverageAction({ row }: Pick<ManagementProps, "row">) {
  const { client, isSuperadmin, organization, permissions } = useAdminData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  if (!isSuperadmin && !permissions.includes("can_manage_billing") && !permissions.includes("can_manage_claims")) return null;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const result = await savePatientPhilhealthCoverage(client, {
      organizationId: organization.id,
      patientId: value(row, "id"),
      philhealthId: String(form.get("pin") ?? ""),
      category: String(form.get("category")) as PhilhealthMemberCategory,
      relationship: String(form.get("relationship")) as "self" | "spouse" | "child" | "parent",
      eligibilityReference: String(form.get("reference") ?? "").trim() || null,
    });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setSaved(true);
    setOpen(false);
  }
  return <>
    <Button size="sm" variant="outline" onClick={() => { setSaved(false); setOpen(true); }}>{saved ? "PhilHealth saved" : "PhilHealth"}</Button>
    <Dialog open={open} onOpenChange={setOpen} title="PhilHealth coverage" description="Record the patient's PIN and member category. Indigent, sponsored, kasambahay, senior and lifetime members qualify for No Balance Billing.">
      <form className="dialog-body" onSubmit={save}>
        <div className="form-grid">
          <Field label="PhilHealth PIN (12 digits)"><Input name="pin" inputMode="numeric" placeholder="12-345678901-2" required /></Field>
          <Field label="Member category"><Select name="category" defaultValue="employed"><option value="employed">Employed</option><option value="voluntary">Voluntary / self-earning</option><option value="indigent">Indigent</option><option value="sponsored">Sponsored</option><option value="kasambahay">Kasambahay</option><option value="senior">Senior citizen</option><option value="lifetime">Lifetime</option></Select></Field>
          <Field label="Patient is the member's"><Select name="relationship" defaultValue="self"><option value="self">Member (self)</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="parent">Parent</option></Select></Field>
          <Field label="Eligibility reference (PBEF / tracking no.)"><Input name="reference" placeholder="Optional" /></Field>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="dialog-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save coverage"}</Button></div>
      </form>
    </Dialog>
  </>;
}

function PatientStatusAction({ onChanged, row }: Pick<ManagementProps, "onChanged" | "row">) {
  const { client, organization } = useAdminData();
  const [saving, setSaving] = useState(false);
  const active = Boolean(row?.active);
  async function toggle() {
    if (!organization) return;
    setSaving(true);
    const result = await setGovernancePatientActive(client, organization.id, value(row, "id"), !active);
    setSaving(false);
    if (result.error) return;
    onChanged();
  }
  return <Button size="sm" variant="outline" disabled={saving} onClick={() => void toggle()}><Power aria-hidden="true" size={14} />{active ? "Archive" : "Restore"}</Button>;
}

export function DepartmentDialog({
  department,
  onChanged,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger = true,
}: {
  department?: DataRow;
  onChanged: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: boolean;
}) {
  const { client, organization } = useAdminData();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    const form = new FormData(event.currentTarget);
    const isRootSupply = Boolean(form.get("is_root_supply"));
    setSaving(true);
    setError(null);
    const result = await saveStaffDepartment(client, {
      organizationId: organization.id,
      id: department?.id ? String(department.id) : undefined,
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      active: Boolean(form.get("active")),
      isRootSupply,
    });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onChanged();
  }

  return (
    <>
      {trigger ? (
        <Button size={department ? "sm" : "md"} variant={department ? "outline" : "primary"} onClick={() => setOpen(true)}>
          {department ? <Edit3 aria-hidden="true" size={14} /> : <Plus aria-hidden="true" size={16} />}
          {department ? "Edit" : "Add department"}
        </Button>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={department ? "Edit department" : "Add department"}
        description="Department codes are generated and preserved by the system. Deactivated departments remain in historical inventory and audit records."
      >
        <form className="dialog-body" onSubmit={submit}>
          <Field label="Department name">
            <Input name="name" defaultValue={value(department, "name")} minLength={2} maxLength={120} required />
          </Field>
          <Field label="Description">
            <Textarea name="description" defaultValue={value(department, "description") === "—" ? "" : value(department, "description")} maxLength={500} />
          </Field>
          <label className="check-option">
            <input name="active" type="checkbox" defaultChecked={checked(department, "active", true)} /> Active and available for assignment
          </label>
          <label className="check-option" style={{ marginTop: "0.25rem" }}>
            <input
              name="is_root_supply"
              type="checkbox"
              defaultChecked={checked(department, "is_root_supply", false)}
            />
            <span>
              <strong>Root Inventory / Central Supply Room</strong>
              <small style={{ display: "block", color: "#64748b", marginTop: "0.15rem", fontWeight: 400 }}>
                Designates this department as the organization&apos;s root intake warehouse for inbound municipal/GSO manifests and inter-department requisitions.
              </small>
            </span>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save department"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function RoleDialog({
  onChanged,
  role,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger = true,
}: {
  onChanged: () => void;
  role?: DataRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: boolean;
}) {
  const { client, isItAdmin, organization } = useAdminData();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    const form = new FormData(event.currentTarget);
    const permissions = permissionOptions
      .filter((permission) => form.get(permission.value))
      .map((permission) => permission.value);
    setSaving(true);
    setError(null);
    const isCustom = role ? Boolean(role.isCustom) : true;
    const roleCode = role ? String(role.code ?? "") : String(form.get("code") ?? "").trim().toLowerCase();
    if (isItAdmin && (roleCode === "admin" || roleCode === "owner")) {
      setError("IT administrators cannot modify admin or owner role permissions.");
      setSaving(false);
      return;
    }
    const result = await saveClinicRoleDefinition(client, {
      organizationId: organization.id,
      code: roleCode,
      name: !isCustom && role ? String(role.name) : String(form.get("name") ?? "").trim(),
      permissions,
    });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onChanged();
  }

  const rolePermissions: string[] = Array.isArray(role?.permissions) ? (role.permissions as string[]) : [];

  const permissionGroup = (title: string, options: typeof permissionOptions) => (
    <fieldset className="permission-group">
      <legend>{title}</legend>
      <div className="check-grid">
        {options.map((permission) => (
          <label key={permission.value}>
            <input
              type="checkbox"
              name={permission.value}
              defaultChecked={
                role
                  ? rolePermissions.includes(permission.value)
                  : permission.value === "can_view_inventory" || permission.value === "can_access_admin_portal"
              }
            />
            <span>
              <strong>{permission.label}</strong>
              <small>{permission.hint}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const isCustom = role ? Boolean(role.isCustom) : true;

  return (
    <>
      {trigger ? (
        <Button size={role ? "sm" : "md"} variant={role ? "outline" : "primary"} onClick={() => setOpen(true)}>
          {role ? <Edit3 aria-hidden="true" size={14} /> : <Plus aria-hidden="true" size={16} />}
          {role ? "Edit access" : "Create role"}
        </Button>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={role ? `Edit ${value(role, "name")}` : "Create clinic role"}
        description="The selected permissions become the complete effective access set for this role in the current clinic."
      >
        <form className="dialog-body role-editor" onSubmit={submit}>
          <Field label="Role name">
            <Input
              name="name"
              defaultValue={value(role, "name")}
              disabled={!isCustom}
              minLength={2}
              maxLength={80}
              placeholder="e.g. IT Administrator, Reception Lead, Triage Nurse"
              required
            />
          </Field>
          {!role ? (
            <Field label="Role code (optional)">
              <Input
                name="code"
                pattern="^[a-z][a-z0-9_]{1,39}$"
                placeholder="e.g. it_lead (leave empty to auto-generate)"
              />
            </Field>
          ) : null}
          {permissionGroup("Portal access", portalPermissions)}
          {permissionGroup("Feature permissions", featurePermissions)}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            {!isCustom && role ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  if (!organization || !role) return;
                  setSaving(true);
                  setError(null);
                  const resetResult = await resetClinicRolePermissions(client, {
                    organizationId: organization.id,
                    code: String(role.code),
                  });
                  setSaving(false);
                  if (resetResult.error) return setError(resetResult.error.message);
                  setOpen(false);
                  onChanged();
                }}
              >
                <RotateCcw aria-hidden="true" size={14} />
                Reset to defaults
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save role access"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function DeleteRoleDialog({
  onChanged,
  role,
}: {
  onChanged: () => void;
  role: DataRow;
}) {
  const { client, organization } = useAdminData();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedCount = Number(role.assigned ?? 0);
  const roleName = String(role.name ?? "Role");
  const roleCode = String(role.code ?? "");

  async function handleDelete() {
    if (!organization) return;
    setDeleting(true);
    setError(null);
    const result = await deleteClinicRoleDefinition(client, {
      organizationId: organization.id,
      code: roleCode,
    });
    setDeleting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOpen(false);
    onChanged();
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        title={`Delete ${roleName}`}
      >
        <Trash2 aria-hidden="true" size={14} />
        Delete
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete custom role "${roleName}"`}
        description={
          assignedCount > 0
            ? "This custom role cannot be deleted while staff accounts are assigned to it."
            : "Are you sure you want to delete this custom role? This cannot be undone."
        }
      >
        <div className="dialog-body">
          {assignedCount > 0 ? (
            <div className="confirmation-summary field-span" role="alert">
              <span>Active staff assignments</span>
              <strong>{assignedCount} staff member(s) assigned</strong>
              <p style={{ marginTop: "0.5rem", color: "var(--color-text-secondary, #64748b)", fontSize: "0.875rem" }}>
                To delete this role, please go to the <strong>Staff</strong> tab and edit the assigned staff member(s) to reassign them to another role first.
              </p>
            </div>
          ) : (
            <div className="confirmation-summary field-span">
              <span>Role code</span>
              <strong>{roleCode}</strong>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                All clinic-specific permissions configured for this custom role will be permanently removed.
              </p>
            </div>
          )}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {assignedCount > 0 ? "Close" : "Cancel"}
            </Button>
            {assignedCount === 0 ? (
              <Button
                type="button"
                style={{ backgroundColor: "#dc2626", borderColor: "#dc2626", color: "#ffffff" }}
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? "Deleting…" : "Delete role"}
              </Button>
            ) : null}
          </div>
        </div>
      </Dialog>
    </>
  );
}

export function CreateRecordAction({ actionHref, dataset, label, onChanged }: ManagementProps & { actionHref?: string }) {
  const router = useRouter();
  const canManage = useCanManage(dataset);
  if (!canManage || !label) return null;
  if (actionHref) return <Button onClick={() => router.push(actionHref)}><Plus aria-hidden="true" size={16} />{label}</Button>;
  if (dataset === "claims") return <Button onClick={() => router.push("/billing")}><ExternalLink aria-hidden="true" size={16} />Create from billing</Button>;
  if (dataset === "departments") return <DepartmentDialog onChanged={onChanged} />;
  if (dataset === "roles") return <RoleDialog onChanged={onChanged} />;
  if (!editableDatasets.has(dataset)) return null;
  return <RecordEditorDialog dataset={dataset} label={label} onChanged={onChanged} />;
}

export function RecordRowActions({ dataset, onChanged, row }: ManagementProps) {
  const router = useRouter();
  const { client, isItAdmin, organization } = useAdminData();
  const canManage = useCanManage(dataset);
  if (dataset === "clinics") return <div className="record-actions"><Button size="sm" variant="outline" onClick={() => router.push(`/superadmin/clinics/${value(row, "code")}`)}>Open</Button>{canManage ? <RecordEditorDialog dataset="clinics" label="clinic" onChanged={onChanged} row={row} /> : null}</div>;
  if (!canManage) return null;
  if (dataset === "departments" && row) {
    const active = checked(row, "active", true);
    return (
      <div className="record-actions">
        <DepartmentDialog department={row} onChanged={onChanged} />
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            if (!organization) return;
            await saveStaffDepartment(client, {
              organizationId: organization.id,
              id: String(row.id),
              name: String(row.name),
              description: value(row, "description") === "—" ? "" : value(row, "description"),
              active: !active,
            });
            onChanged();
          }}
        >
          <Power aria-hidden="true" size={14} />
          {active ? "Deactivate" : "Restore"}
        </Button>
      </div>
    );
  }
  if (dataset === "roles" && row) {
    const roleCode = String(row?.code ?? "");
    if (isItAdmin && (roleCode === "admin" || roleCode === "owner")) return null;
    const isCustom = Boolean(row.isCustom);
    return (
      <div className="record-actions">
        <RoleDialog onChanged={onChanged} role={row} />
        {isCustom ? <DeleteRoleDialog onChanged={onChanged} role={row} /> : null}
      </div>
    );
  }
  if (dataset === "staff" && row) {
    const roleCode = value(row, "roleCode");
    if (isItAdmin && (roleCode === "admin" || roleCode === "owner")) return null;
    return (
      <div className="record-actions">
        <RecordEditorDialog dataset="staff" label="staff assignment" onChanged={onChanged} row={row} />
        <Button size="sm" variant="outline" onClick={async () => { if (!organization) return; await setClinicUserActive(client, organization.id, value(row, "id"), !Boolean(row?.active)); onChanged(); }}>
          <Power aria-hidden="true" size={14} />{row?.active ? "Disable" : "Enable"}
        </Button>
      </div>
    );
  }
  if (dataset === "services" || dataset === "templates" || dataset === "companies") return <div className="record-actions"><RecordEditorDialog dataset={dataset} label={dataset.slice(0, -1)} onChanged={onChanged} row={row} /></div>;
  if (dataset === "features") return <Button size="sm" variant="outline" onClick={async () => { if (!organization) return; await setOrganizationModule(client, organization.id, value(row, "key") as OrganizationModuleKey, !Boolean(row?.enabled)); onChanged(); }}><Power aria-hidden="true" size={14} />{row?.enabled ? "Disable" : "Enable"}</Button>;
  if (dataset === "patients") return <div className="record-actions"><PhilhealthCoverageAction row={row} /><PatientStatusAction onChanged={onChanged} row={row} /></div>;
  if (dataset === "appointments") return <AppointmentActions onChanged={onChanged} row={row} />;
  if (dataset === "billing" && Number(row?.balance ?? 0) > 0) return <PaymentDialog onChanged={onChanged} row={row} />;
  if (dataset === "claims") return <ClaimActions onChanged={onChanged} row={row} />;
  if (dataset === "admins" && row?.organizationId) {
    if (isItAdmin) return null;
    return <Button size="sm" variant="outline" onClick={async () => { await setClinicUserActive(client, value(row, "organizationId"), value(row, "id"), !Boolean(row.active)); onChanged(); }}><Power aria-hidden="true" size={14} />{row.active ? "Disable" : "Enable"}</Button>;
  }
  return null;
}
