import type { ClinicRolePermission } from "@odyssey/types";
import { StatusBadge } from "../components/status-badge";
import type { DataColumn, DataRow } from "../components/data-table";

export const php = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
export type AdminDataset = "patients" | "patient-audit" | "appointments" | "billing" | "claims" | "companies" | "pos" | "staff" | "departments" | "roles" | "services" | "templates" | "features" | "clinics" | "admins" | "global-audit" | "break-glass";

export const permissionOptions: Array<{
  value: ClinicRolePermission;
  label: string;
  hint: string;
}> = [
  { value: "can_access_admin_portal", label: "Administrative workspace", hint: "Open the clinic operations workspace." },
  { value: "can_access_provider_portal", label: "Clinical workspace", hint: "Open the provider and triage workspace." },
  { value: "can_manage_appointments", label: "Appointments", hint: "Schedule, check in, cancel, and mark no-shows." },
  { value: "can_record_triage", label: "Triage", hint: "Record vital signs and complete triage." },
  { value: "can_start_consultation", label: "Consultations", hint: "Start assigned, triage-complete consultations." },
  { value: "can_manage_provider_schedule", label: "Provider schedule", hint: "Maintain bookable availability and services." },
  { value: "can_manage_staff_roles", label: "Staff and roles", hint: "Create staff accounts and manage role access." },
  { value: "can_view_inventory", label: "View inventory", hint: "Open stock visibility screens." },
  { value: "can_manage_inventory", label: "Manage inventory", hint: "Adjust stock and departments." },
  { value: "can_tag_inventory_usage", label: "Tag consumables", hint: "Record consumables against encounters." },
  { value: "can_encode_pharmacy_prescriptions", label: "Encode pharmacy prescriptions", hint: "Transcribe physical prescriptions and view Pharmacy availability." },
  { value: "can_dispense_pharmacy_prescriptions", label: "Dispense pharmacy prescriptions", hint: "Review and complete Pharmacy prescription queue items." },
  { value: "can_order_diagnostics", label: "Order diagnostics", hint: "Place lab orders and specialist referrals." },
  { value: "can_view_diagnostics", label: "View diagnostics", hint: "Review diagnostic requests and reports." },
  { value: "can_view_lab_worklist", label: "Lab worklist", hint: "See active laboratory orders." },
  { value: "can_record_lab_results", label: "Record lab results", hint: "Publish final reports and observations." },
  { value: "can_view_referrals", label: "Specialist referrals", hint: "See referrals routed to specialists." },
  { value: "can_update_referrals", label: "Update referrals", hint: "Progress or complete routed referrals." },
  { value: "can_manage_laboratory_services", label: "Laboratory services", hint: "Maintain the laboratory service catalog." },
  { value: "can_view_billing", label: "View billing", hint: "Review invoices, payments, and POS sales." },
  { value: "can_manage_billing", label: "Manage billing", hint: "Generate bills and record invoice payments." },
  { value: "can_manage_pos", label: "Point of sale", hint: "Complete over-the-counter sales." },
  { value: "can_view_claims", label: "View claims", hint: "Review HMO and PhilHealth claims." },
  { value: "can_manage_claims", label: "Manage claims", hint: "Submit and adjudicate claims." },
  { value: "can_view_payouts", label: "View doctor payouts", hint: "Review doctor payout entitlements." },
  { value: "can_manage_payouts", label: "Manage doctor payouts", hint: "Configure shares and settle payouts." },
  { value: "can_view_analytics", label: "Analytics", hint: "View operational and financial summaries." },
  { value: "can_manage_patients", label: "Patient administration", hint: "Search charts and import patient records." },
  { value: "can_view_audit_log", label: "Patient audit trail", hint: "Review patient activity events." },
  { value: "can_identify_patients", label: "Patient QR identification", hint: "Identify an active patient from a clinic QR code." },
  { value: "can_manage_clinic_branding", label: "Clinic branding", hint: "Maintain clinic identity and support details." },
  { value: "can_manage_service_catalog", label: "Services and pricing", hint: "Maintain services, prices, and booking rules." },
  { value: "can_manage_services", label: "Service and fee administration", hint: "Maintain service assignments, professional-fee models, and fee limits." },
  { value: "can_manage_professional_fees", label: "Professional fees", hint: "Use the provider Fees tab to declare fees for assigned services." },
  { value: "can_view_clinic_queue", label: "Clinic calendar and queue", hint: "Read the organization-wide doctor calendar and queue projection." },
  { value: "can_manage_rooms", label: "Clinic rooms", hint: "Create rooms and manage doctor room assignments." },
  { value: "can_reassign_appointments", label: "Appointment reassignment and coverage", hint: "Reassign appointments and record doctor coverage arrangements." },
  { value: "can_manage_document_templates", label: "Document templates", hint: "Maintain reusable document definitions." },
  { value: "can_manage_feature_modules", label: "Feature modules", hint: "Control staged module availability." },
];

export const permissionLabels = new Map(permissionOptions.map((permission) => [permission.value, permission.label]));
export const portalPermissions = permissionOptions.filter((permission) => permission.value.startsWith("can_access_"));
export const featurePermissions = permissionOptions.filter((permission) => !permission.value.startsWith("can_access_"));

const status = (row: DataRow) => <StatusBadge label={String(row.status)} />;
const money = (key: string) => (row: DataRow) => <span className="money">{php.format(Number(row[key] ?? 0))}</span>;
const departmentName = (row: DataRow) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
    <span style={{ fontWeight: 600 }}>{String(row.name)}</span>
    {row.is_root_supply ? (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: "0.68rem",
          fontWeight: 700,
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          background: "#ecfdf5",
          color: "#065f46",
          border: "1px solid #a7f3d0",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Root Supply
      </span>
    ) : null}
  </span>
);

export interface RecordsConfig {
  actionLabel?: string;
  columns: DataColumn[];
  dataset: AdminDataset;
  description: string;
  emptyMessage: string;
  eyebrow: string;
  title: string;
}

export const patientsConfig: RecordsConfig = { dataset: "patients", title: "Patient records", eyebrow: "Clinical administration", actionLabel: "Import patient file", description: "Search and review the clinic patient index. Sensitive record access is logged automatically.", emptyMessage: "No patient records match the current filters.", columns: [
  { key: "patient", label: "Patient" }, { key: "mrn", label: "Record identifier" }, { key: "dob", label: "Date of birth" }, { key: "gender", label: "Gender" }, { key: "appointments", label: "Appointments", numeric: true }, { key: "lastVisit", label: "Last activity" }, { key: "status", label: "Record status", render: status },
] };

export const auditConfig: RecordsConfig = { dataset: "patient-audit", title: "Patient activity audit trail", eyebrow: "Compliance", actionLabel: "Export audit package", description: "Immutable record of access to patient information, changes, exports, and administrative actions.", emptyMessage: "No patient audit events were recorded for this period.", columns: [
  { key: "timestamp", label: "Timestamp" }, { key: "actor", label: "Actor" }, { key: "actorType", label: "Actor type" }, { key: "action", label: "Action" }, { key: "resource", label: "Resource" }, { key: "record", label: "Record identifier" },
] };

export const appointmentsConfig: RecordsConfig = { dataset: "appointments", title: "Appointment schedule", eyebrow: "Clinic operations", actionLabel: "Schedule appointment", description: "Coordinate scheduled, walk-in, and teleconsult appointments across clinic resources.", emptyMessage: "No appointments are scheduled for today.", columns: [
  { key: "time", label: "Time" }, { key: "patient", label: "Patient" }, { key: "service", label: "Service" }, { key: "mode", label: "Mode" }, { key: "queue", label: "Queue" }, { key: "status", label: "Status", render: status },
] };

export const billingConfig: RecordsConfig = { dataset: "billing", title: "Billing and payments", eyebrow: "Revenue operations", actionLabel: "Create invoice", description: "Review invoice balances, payment allocation, and unsettled patient accounts.", emptyMessage: "No invoices were issued for this organization.", columns: [
  { key: "invoice", label: "Invoice" }, { key: "patient", label: "Patient / account" }, { key: "issued", label: "Issued" }, { key: "total", label: "Total", numeric: true, render: money("total") }, { key: "paid", label: "Paid", numeric: true, render: money("paid") }, { key: "balance", label: "Balance", numeric: true, render: money("balance") }, { key: "status", label: "Status", render: status },
] };

export const claimsConfig: RecordsConfig = { dataset: "claims", title: "HMO claims and authorizations", eyebrow: "Revenue operations", actionLabel: "File claim", description: "Track eligibility, authorization, submissions, adjudication, and remittance.", emptyMessage: "No claims were filed for this organization.", columns: [
  { key: "claim", label: "Claim" }, { key: "patient", label: "Patient" }, { key: "payor", label: "Payor type" }, { key: "diagnosis", label: "Final diagnosis" }, { key: "filed", label: "Submitted" }, { key: "amount", label: "Claimed", numeric: true, render: money("amount") }, { key: "approved", label: "Approved", numeric: true, render: money("approved") }, { key: "status", label: "Status", render: status },
] };

export const companiesConfig: RecordsConfig = { dataset: "companies", title: "Company accounts", eyebrow: "B2B oversight", actionLabel: "Add coverage", description: "Maintain employer-sponsored patient coverage for the selected organization.", emptyMessage: "No employer-sponsored coverage records exist for this organization.", columns: [
  { key: "company", label: "Company / payor" }, { key: "patient", label: "Covered patient" }, { key: "subscriberId", label: "Subscriber ID" }, { key: "coverageType", label: "Coverage type" }, { key: "period", label: "Coverage period" }, { key: "status", label: "Account status", render: status },
] };

export const posConfig: RecordsConfig = { dataset: "pos", title: "Point of sale", eyebrow: "Retail operations", actionLabel: "Open sale", description: "Process clinic retail sales and reconcile receipts, payment methods, and inventory movement.", emptyMessage: "No retail transactions were recorded for this organization.", columns: [
  { key: "receipt", label: "Receipt" }, { key: "completed", label: "Completed" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Total", numeric: true, render: money("amount") }, { key: "status", label: "Status", render: status },
] };

export const staffConfig: RecordsConfig = { dataset: "staff", title: "Staff accounts", eyebrow: "Identity administration", actionLabel: "Invite staff member", description: "Review who can access clinic operations and require an explicit confirmation for every permission change.", emptyMessage: "No staff accounts are assigned to this organization.", columns: [
  { key: "name", label: "Staff member" }, { key: "email", label: "Account" }, { key: "role", label: "Role" }, { key: "department", label: "Department" }, { key: "status", label: "Status", render: status },
] };

export const departmentsConfig: RecordsConfig = { dataset: "departments", title: "Departments", eyebrow: "Operational structure", actionLabel: "Add department", description: "Maintain clinic departments, stock locations, and staff defaults while preserving historical inventory references.", emptyMessage: "No departments are configured for this clinic.", columns: [
  { key: "name", label: "Department", render: departmentName }, { key: "code", label: "System code" }, { key: "description", label: "Description" }, { key: "staffCount", label: "Assigned staff", numeric: true }, { key: "status", label: "Status", render: status },
] };

export const rolesConfig: RecordsConfig = { dataset: "roles", title: "Roles and permissions", eyebrow: "Access governance", actionLabel: "Create role", description: "Built-in role codes remain stable; permission changes apply only to the selected clinic.", emptyMessage: "No roles are configured for this clinic.", columns: [
  { key: "name", label: "Role" }, { key: "code", label: "Role code" }, { key: "scope", label: "Type" }, { key: "assigned", label: "Assigned staff", numeric: true }, { key: "permissionCount", label: "Permissions", numeric: true }, { key: "access", label: "Access summary" },
] };

export const servicesConfig: RecordsConfig = { dataset: "services", title: "Service catalog", eyebrow: "Clinic configuration", actionLabel: "Add service", description: "Maintain billable clinical services, standard pricing, duration, and scheduling availability.", emptyMessage: "No clinical services are configured for this organization.", columns: [
  { key: "code", label: "Code" }, { key: "service", label: "Service" }, { key: "duration", label: "Duration" }, { key: "price", label: "Clinic price", numeric: true }, { key: "modes", label: "Delivery modes" }, { key: "status", label: "Status", render: status },
] };

export const templatesConfig: RecordsConfig = { dataset: "templates", title: "Document templates", eyebrow: "Clinic configuration", actionLabel: "Create template", description: "Control approved clinical and administrative document templates with version history.", emptyMessage: "No document templates are configured for this organization.", columns: [
  { key: "template", label: "Template" }, { key: "code", label: "Code" }, { key: "category", label: "Category" }, { key: "version", label: "Version" }, { key: "updated", label: "Last updated" }, { key: "status", label: "Status", render: status },
] };

export const featureFlagsConfig: RecordsConfig = { dataset: "features", title: "Feature flags", eyebrow: "Clinic control panel", description: "Explicit module controls for this organization. Changes are audited and take effect immediately after confirmation.", emptyMessage: "No feature flags are configured for this organization.", columns: [
  { key: "module", label: "Module" }, { key: "key", label: "Flag key" }, { key: "changed", label: "Last changed" }, { key: "status", label: "State", render: status },
] };

export const clinicsConfig: RecordsConfig = { dataset: "clinics", title: "Clinics", eyebrow: "Platform oversight", actionLabel: "Onboard new clinic", description: "Network-wide directory of organizations and their operational state.", emptyMessage: "No clinic organizations are visible to this account.", columns: [
  { key: "clinic", label: "Clinic" }, { key: "classification", label: "Classification" }, { key: "code", label: "Organization ID" }, { key: "created", label: "Created" }, { key: "updated", label: "Last updated" }, { key: "status", label: "Status", render: status },
] };

export const adminsConfig: RecordsConfig = { dataset: "admins", title: "Administrator directory", eyebrow: "Platform oversight", actionLabel: "Invite administrator", description: "Network-wide view of privileged accounts and organization scope.", emptyMessage: "No administrator assignments are visible to this account.", columns: [
  { key: "name", label: "Administrator" }, { key: "account", label: "Account identifier" }, { key: "role", label: "Role" }, { key: "scope", label: "Organization scope" }, { key: "status", label: "Status", render: status },
] };

export const globalAuditConfig: RecordsConfig = { dataset: "global-audit", title: "Global audit log", eyebrow: "Platform compliance", actionLabel: "Export audit package", description: "Network-wide administrative and clinical access events. Timestamps use Philippine Standard Time (UTC+8).", emptyMessage: "No audit events were recorded for the current scope.", columns: [
  { key: "timestamp", label: "Timestamp" }, { key: "organization", label: "Organization" }, { key: "actor", label: "Actor identifier" }, { key: "actorType", label: "Actor type" }, { key: "action", label: "Action" }, { key: "resource", label: "Resource" }, { key: "record", label: "Record identifier" },
] };

export const breakGlassConfig: RecordsConfig = { dataset: "break-glass", title: "Break-glass access log", eyebrow: "Privileged access", actionLabel: "Export signed log", description: "Emergency access to restricted patient information. Every event requires a recorded reason and retrospective review.", emptyMessage: "No break-glass access events were recorded in the database.", columns: [
  { key: "timestamp", label: "Access time" }, { key: "organization", label: "Organization" }, { key: "actor", label: "Actor identifier" }, { key: "record", label: "Patient record" }, { key: "reason", label: "Recorded reason" }, { key: "status", label: "Review status", render: status },
] };
