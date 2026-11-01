import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  getHumanNameDisplay,
  type AppointmentQueueItem,
  type AppointmentSlotSummary,
  type AppointmentSlotInput,
  type AppointmentStatus,
  type AppointmentSummary,
  type ClinicServiceSummary,
  type ServicePractitionerRow,
  type PractitionerCoverageGrantRow,
  type ReassignmentCandidate,
  type ClinicServiceInput,
  type ClinicAccountInput,
  type ClinicRoleDefinition,
  type ClinicRolePermission,
  type ClinicStaffMember,
  type CreatedClinicAccount,
  type Database,
  type DateRange,
  type DocumentReferenceSummary,
  type ClinicalDocumentTemplate,
  type ClinicalDocumentTemplateInput,
  type ClinicalDocumentTemplateType,
  type PatientDocumentTemplate,
  type Icd10ReferenceCondition,
  type EncounterTemplateContext,
  type EncounterSummary,
  type EncounterViewMode,
  type TeleconsultWorkspacePreference,
  type EncounterRegionDiagnosis,
  type AnatomyView,
  type CoverageSummary,
  type MedicationRequestSummary,
  type ObservationSummary,
  type MedicalCertificateInput,
  type PatientProfileInput,
  type PrescriptionInput,
  type PrescriptionRegimenItem,
  type SoapObservationInput,
  type SoapNoteInput,
  type SoapWriteResult,
  type EncounterLockSummary,
  type TriageVitalSignsInput,
  type OrganizationClinicalRecords,
  type PatientAccessRecords,
  type PatientRegistrationInput,
  type PatientRegistrationResult,
  type WalkInAccountRegistrationInput,
  type PatientSummary,
  type PortalAccess,
  type PortalName,
  type PublicClinicSummary,
  type WalkInAccessInput,
  type WalkInAccessRecords,
  type WalkInCredentials,
  type WalkInRegistrationInput,
  type WaitingRoomQueueItem,
  type WeeklyAvailabilityWindow,
  type ProviderWeeklyAvailabilityRow,
  type DepartmentInput,
  type DepartmentSummary,
  type InventoryEncounterOption,
  type InventoryBatchSummary,
  type InventoryExpirySettings,
  type InventoryExpiryStatus,
  type InventoryItemInput,
  type InventoryItemPricingInput,
  type InventoryItemSummary,
  type InventoryHoldSummary,
  type InventoryUsageInput,
  type InventoryViewMode,
  type InventoryWorkspace,
  type ReceiveInventoryBatchInput,
  type ReceiveInventoryStockInput,
  type DisperseInventoryRequisitionItemInput,
  type GsoCsvParseResult,
  type GsoCsvRow,
  type PharmacyInventoryImportRow,
  type PharmacyInventoryParseResult,
  type ImportPharmacyInventoryOptions,
  type InventoryRequisitionItemSummary,
  type InventoryRequisitionSummary,
  type SubmitInventoryRequisitionInput,
  type SubmitRequisitionLineItem,
  type Json,
  type DiagnosticServiceRequestInput,
  type DiagnosticReportInput,
  type DiagnosticsWorkspace,
  type DiagnosticReportSummary,
  type ServiceRequestSummary,
  type ClinicalNotificationSummary,
  type ClinicRoomRow,
  type RoomAssignmentRow,
  type SpecialistOption,
  type LaboratoryServiceSummary,
  type DiagnosticEncounterOption,
  type StockAdjustmentInput,
  type StockTransferInput,
  type BillingWorkspace,
  type BillingLineItemSummary,
  type BillableEncounter,
  type PatientInvoice,
  type InvoiceDetail,
  type InvoiceQrResolution,
  type PayorType,
  type PaymentMethod,
  type FacilityBillingMode,
  type FacilityClassification,
  type BalanceBillingPolicy,
  type EncounterCondition,
  type FacilityOwnership,
  type FacilityType,
  type OrganizationBillingProfile,
  type PhilhealthClaimDocument,
  type PhilhealthMemberCategory,
  type PosCartItem,
  type PosCheckoutResult,
  type NbbPharmacyPosCatalogItem,
  type NbbPosCartItem,
  type NbbPosCheckoutInput,
  type NbbPosCheckoutResult,
  type NbbReceiptTransaction,
  type NbbReceiptTransactionItem,
  type CreatePharmacyPrescriptionTranscriptionInput,
  type CreateStandalonePharmacyInventoryOrderInput,
  type PharmacyPrescriptionAvailability,
  type PharmacyPrescriptionCompletionInput,
  type PharmacyPrescriptionCompletionResult,
  type PharmacyPrescriptionLineInput,
  type PharmacyPrescriptionOrderEvent,
  type PharmacyPrescriptionOrderSummary,
  type PharmacyPrescriptionReviewInput,
  type ClaimSummary,
  type AppointmentDeliveryMode,
  type DoctorPayoutSummary,
  type TeleconsultAppointment,
  type GovernanceDashboard,
  type GovernancePatientSummary,
  type GovernancePatientRecord,
  type PatientAuditEvent,
  type ClinicOperationsLogEntry,
  type ClinicOperationsLogFilters,
  type IdentifiedPatient,
  type ImportedPatientCredential,
  type GovernancePatientImportRow,
  type OrganizationBranding,
  type OrganizationBrandingInput,
  type DocumentTemplate,
  type DocumentTemplateInput,
  type OrganizationModule,
  type OrganizationModuleKey,
} from "@odyssey/types";

export * from "./surveillance-service";

let browserClient: SupabaseClient<Database> | undefined;
let publicBrowserClient: SupabaseClient<Database> | undefined;

export interface PublicSupabaseConfig {
  anonKey: string;
  url: string;
}

export interface SupabaseFailure {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export type SupabaseResult<T> =
  { data: T; error: null } | { data: null; error: SupabaseFailure };

export const servicePractitionerSelectionInputSchema = z.object({
  organizationId: z.string().uuid(),
  clinicServiceId: z.string().uuid(),
  practitionerRoleIds: z.array(z.string().uuid()).min(1),
});

export const servicePractitionerAssignmentInputSchema =
  servicePractitionerSelectionInputSchema.extend({
    durationMinutesOverride: z.number().int().min(5).max(480).nullable().optional(),
  });

export const servicePractitionerRowSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  clinic_service_id: z.string().uuid(),
  practitioner_role_id: z.string().uuid(),
  is_active: z.boolean(),
  duration_minutes_override: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const servicePractitionerAssignmentResultSchema = z.array(
  servicePractitionerRowSchema,
);
export const servicePractitionerUnassignmentResultSchema = z.number().int().min(0);

export const servicePractitionerOptionSchema = z.object({
  practitionerRoleId: z.string().uuid(),
  displayName: z.string().min(1),
  roleCode: z.enum(["doctor", "specialist"]),
});

export type ServicePractitionerSelectionInput = z.infer<
  typeof servicePractitionerSelectionInputSchema
>;
export type ServicePractitionerAssignmentInput = z.infer<
  typeof servicePractitionerAssignmentInputSchema
>;
export type ServicePractitionerOption = z.infer<
  typeof servicePractitionerOptionSchema
>;

export const reassignmentInputSchema = z.object({
  appointmentId: z.string().uuid(),
  newPractitionerRoleId: z.string().uuid(),
  reason: z.string().trim().min(2).max(1000),
});

export const markPractitionerAbsentInputSchema = z.object({
  practitionerRoleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  coveringPractitionerRoleId: z.string().uuid(),
  reason: z.string().trim().min(2).max(1000),
});

const reassignmentResultSchema = z.object({
  moved_count: z.number().int().nonnegative(),
  not_movable_count: z.number().int().nonnegative(),
  results: z.unknown(),
});

export type ReassignmentInput = z.infer<typeof reassignmentInputSchema>;
export type MarkPractitionerAbsentInput = z.infer<
  typeof markPractitionerAbsentInputSchema
>;
export interface MarkPractitionerAbsentResult {
  movedCount: number;
  notMovableCount: number;
  results: Json;
}

export const bookablePractitionerInputSchema = z.object({
  serviceId: z.string().uuid(),
});

export const bookablePractitionerSchema = z.object({
  practitioner_role_id: z.string().uuid(),
  display_name: z.string().min(1),
  specialty: z.string().nullable(),
  title: z.string().nullable(),
  photo_url: z.string().url().nullable(),
  total_price: z.coerce.number().nonnegative(),
  currency: z.string().min(3).max(3),
});

export const availableBookingSlotsInputSchema = z.object({
  serviceId: z.string().uuid(),
  practitionerRoleId: z.string().uuid(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine(({ startsAt, endsAt }) => endsAt > startsAt, {
  message: "The availability range must end after it starts.",
  path: ["endsAt"],
});

export const availableBookingSlotSchema = z.object({
  id: z.string().uuid(),
  practitioner_role_id: z.string().uuid(),
  clinic_service_id: z.string().uuid(),
  service_type: z.string().nullable(),
  // PostgREST may serialize PostgreSQL timestamptz values with an explicit
  // offset (for example, "+00:00") instead of a trailing "Z". Both forms
  // represent an absolute instant and are valid inputs to Date/Intl on the
  // patient booking UI.
  start_at: z.iso.datetime({ offset: true }),
  end_at: z.iso.datetime({ offset: true }),
  display_name: z.string().min(1),
  specialty: z.string().nullable(),
  title: z.string().nullable(),
  photo_url: z.string().url().nullable(),
});

export const bookAppointmentInputSchema = z.object({
  slotId: z.string().uuid(),
  deliveryMode: z.enum(["in_person", "virtual"]),
});

export type BookablePractitioner = z.infer<typeof bookablePractitionerSchema>;
export type AvailableBookingSlot = z.infer<typeof availableBookingSlotSchema>;
export type AvailableBookingSlotsInput = z.infer<typeof availableBookingSlotsInputSchema>;

const patientSummaryColumns =
  "id, organization_id, active, name, birth_date, blood_type, gender, photo_url, telecom, address, contact, walk_in_id, created_at, updated_at";
const appointmentSummaryColumns =
  "id, organization_id, patient_id, practitioner_role_id, status, service_type, appointment_type, start_at, end_at, minutes_duration, description, patient_instruction, clinic_service_id, queue_date, queue_number, queue_label, delivery_mode";
const appointmentSlotSummaryColumns =
  "id, appointment_id, organization_id, practitioner_role_id, clinic_service_id, status, service_type, start_at, end_at";
const clinicServiceSummaryColumns =
  "id, organization_id, owner_practitioner_role_id, code, name, description, duration_minutes, base_price, currency, active, booking_enabled, delivery_modes";
const waitingRoomQueueColumns =
  "appointment_id, organization_id, queue_date, queue_number, queue_label, practitioner_display_name, room_label, service_name, scheduled_at, stage";
const publicClinicSummaryColumns = "id, name, telecom, address";
const encounterSummaryColumns =
  "id, organization_id, patient_id, appointment_id, practitioner_role_id, status, class_code, service_type, period_start, period_end, diagnosis";
const observationSummaryColumns =
  "id, organization_id, patient_id, encounter_id, status, code, code_display, effective_at, issued_at, value, value_unit, supersedes_id, diagnostic_report_id, reference_range, note";
const medicationRequestSummaryColumns =
  "id, organization_id, patient_id, encounter_id, requester_practitioner_id, status, medication_code, medication_display, authored_on, dosage_instruction, note, template_id, template_version";
const documentReferenceSummaryColumns =
  "id, organization_id, patient_id, encounter_id, author_practitioner_id, status, type_code, type_display, date_at, description, content_title, template_id, template_version";
const departmentSummaryColumns =
  "id, organization_id, code, name, description, active, is_root_supply";
const inventoryItemSummaryColumns =
  "id, organization_id, sku, name, description, unit_of_measure, unit_cost, selling_price, unit_price, currency, active, is_perishable, near_expiry_days_override";
const departmentStockSummaryColumns =
  "id, organization_id, item_id, department_id, quantity, reorder_level, updated_at";
const inventoryBatchSummaryColumns =
  "id, organization_id, stock_id, item_id, department_id, lot_number, expiry_date, quantity, usable_quantity, days_until_expiry, expiry_status, legacy_unassigned_expiry, received_at, created_at, updated_at, item_name, item_sku, department_name";
const inventoryHoldSummaryColumns =
  "id, stock_id, encounter_id, quantity, status, held_at";
const inventoryUsageSummaryColumns =
  "id, organization_id, stock_id, item_id, department_id, encounter_id, patient_id, quantity, unit_cost, unit_price, currency, tagged_by, used_at";
const inventoryMovementSummaryColumns =
  "id, organization_id, stock_id, item_id, department_id, movement_type, quantity_delta, reason, usage_id, transfer_group_id, recorded_by, occurred_at, batch_id";
const serviceRequestSummaryColumns =
  "id, organization_id, patient_id, encounter_id, requester_practitioner_id, status, category, priority, code, code_display, performer_practitioner_role_id, note, created_at, updated_at";
const diagnosticReportSummaryColumns =
  "id, organization_id, patient_id, encounter_id, based_on_service_request_id, status, code, code_display, effective_at, issued_at, conclusion";
const clinicalNotificationSummaryColumns =
  "id, organization_id, service_request_id, diagnostic_report_id, kind, title, message, read_at, created_at";

function publicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    throw new Error("Missing public Supabase environment variables.");
  return { url, anonKey };
}

/** Creates a typed public-key client for a supplied app environment. */
export function createSupabaseClient(
  config: PublicSupabaseConfig,
): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey);
}

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    const { url, anonKey } = publicSupabaseConfig();
    return createSupabaseClient({ url, anonKey });
  }

  if (!browserClient) {
    const { url, anonKey } = publicSupabaseConfig();
    browserClient = createSupabaseClient({ url, anonKey });
  }

  return browserClient;
}

/** A sessionless browser client for intentionally public clinic directories. */
export function createPublicSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined" && publicBrowserClient) {
    return publicBrowserClient;
  }
  const { url, anonKey } = publicSupabaseConfig();
  const client = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  if (typeof window !== "undefined") {
    publicBrowserClient = client;
  }
  return client;
}

/** Use this from server-only code that does not require cookie session wiring. */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  return createSupabaseClient(publicSupabaseConfig());
}

function failure(error: SupabaseFailure): SupabaseResult<never> {
  return { data: null, error };
}

function success<T>(data: T): SupabaseResult<T> {
  return { data, error: null };
}

function toIsoTimestamp(value: Date | string, field: "start" | "end"): string {
  const timestamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(timestamp.getTime()))
    throw new Error(`Invalid ${field} date range value.`);
  return timestamp.toISOString();
}

function toPatientSummary(
  row: Omit<PatientSummary, "displayName">,
): PatientSummary {
  return { ...row, displayName: getHumanNameDisplay(row.name) };
}

/** Gets one organization-scoped patient profile for an authorized clinical workspace. */
export async function getOrganizationPatient(
  client: SupabaseClient<Database>,
  organizationId: string,
  patientId: string,
): Promise<SupabaseResult<PatientSummary | null>> {
  const { data, error } = await client
    .from("patients")
    .select(patientSummaryColumns)
    .eq("organization_id", organizationId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) return failure(error);
  return success(
    data
      ? toPatientSummary(data as unknown as Omit<PatientSummary, "displayName">)
      : null,
  );
}

/** Gets future scheduled appointments for one patient, ordered chronologically. */
export async function getUpcomingAppointments(
  client: SupabaseClient<Database>,
  patientId: string,
  from: Date = new Date(),
): Promise<SupabaseResult<AppointmentSummary[]>> {
  const { data, error } = await client
    .from("appointments")
    .select(appointmentSummaryColumns)
    .eq("patient_id", patientId)
    .gte("start_at", from.toISOString())
    .order("start_at", { ascending: true });

  if (error) return failure(error);
  return success((data ?? []) as unknown as AppointmentSummary[]);
}

/** Gets encounters within an organization and inclusive clinical date range. */
export async function getOrgEncounters(
  client: SupabaseClient<Database>,
  organizationId: string,
  dateRange: DateRange,
): Promise<SupabaseResult<EncounterSummary[]>> {
  const start = toIsoTimestamp(dateRange.start, "start");
  const end = toIsoTimestamp(dateRange.end, "end");
  if (start > end)
    throw new Error("The encounter date range start must be before its end.");

  const { data, error } = await client
    .from("encounters")
    .select(encounterSummaryColumns)
    .eq("organization_id", organizationId)
    .gte("period_start", start)
    .lte("period_start", end)
    .order("period_start", { ascending: true });

  if (error) return failure(error);
  return success((data ?? []) as unknown as EncounterSummary[]);
}

/** Records available to the signed-in patient through row-level security. */
export async function getPatientAccessRecords(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<PatientAccessRecords>> {
  const [
    patients,
    appointments,
    encounters,
    observations,
    medicationRequests,
    documentReferences,
    serviceRequests,
    diagnosticReports,
  ] = await Promise.all([
    client
      .from("patients")
      .select(patientSummaryColumns)
      .eq("organization_id", organizationId),
    client
      .from("appointments")
      .select(appointmentSummaryColumns)
      .eq("organization_id", organizationId)
      .order("start_at", { ascending: true }),
    client
      .from("encounters")
      .select(encounterSummaryColumns)
      .eq("organization_id", organizationId)
      .order("period_start", { ascending: true }),
    client
      .from("observations")
      .select(observationSummaryColumns)
      .eq("organization_id", organizationId)
      .order("effective_at", { ascending: false }),
    client
      .from("medication_requests")
      .select(medicationRequestSummaryColumns)
      .eq("organization_id", organizationId)
      .order("authored_on", { ascending: false }),
    client
      .from("document_references")
      .select(documentReferenceSummaryColumns)
      .eq("organization_id", organizationId)
      .order("date_at", { ascending: false }),
    client
      .from("service_requests")
      .select(serviceRequestSummaryColumns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    client
      .from("diagnostic_reports")
      .select(diagnosticReportSummaryColumns)
      .eq("organization_id", organizationId)
      .order("issued_at", { ascending: false }),
  ]);
  const error = [
    patients,
    appointments,
    encounters,
    observations,
    medicationRequests,
    documentReferences,
    serviceRequests,
    diagnosticReports,
  ].find((result) => result.error)?.error;
  if (error) return failure(error);

  const patientRows = (patients.data ?? []) as unknown as Array<
    Omit<PatientSummary, "displayName">
  >;
  return success({
    patients: patientRows.map(toPatientSummary),
    appointments: (appointments.data ?? []) as unknown as AppointmentSummary[],
    encounters: (encounters.data ?? []) as unknown as EncounterSummary[],
    observations: (observations.data ?? []) as unknown as ObservationSummary[],
    medicationRequests: (medicationRequests.data ??
      []) as unknown as MedicationRequestSummary[],
    documentReferences: (documentReferences.data ??
      []) as unknown as DocumentReferenceSummary[],
    serviceRequests: (serviceRequests.data ??
      []) as unknown as ServiceRequestSummary[],
    diagnosticReports: (diagnosticReports.data ??
      []) as unknown as DiagnosticReportSummary[],
  });
}

/** Organization-scoped clinical records for the provider workspace. */
export async function getOrganizationClinicalRecords(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<OrganizationClinicalRecords>> {
  const [
    encounters,
    observations,
    medicationRequests,
    documentReferences,
    serviceRequests,
    diagnosticReports,
  ] = await Promise.all([
    client
      .from("encounters")
      .select(encounterSummaryColumns)
      .eq("organization_id", organizationId)
      .order("period_start", { ascending: true }),
    client
      .from("observations")
      .select(observationSummaryColumns)
      .eq("organization_id", organizationId)
      .order("effective_at", { ascending: false }),
    client
      .from("medication_requests")
      .select(medicationRequestSummaryColumns)
      .eq("organization_id", organizationId)
      .order("authored_on", { ascending: false }),
    client
      .from("document_references")
      .select(documentReferenceSummaryColumns)
      .eq("organization_id", organizationId)
      .order("date_at", { ascending: false }),
    client
      .from("service_requests")
      .select(serviceRequestSummaryColumns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    client
      .from("diagnostic_reports")
      .select(diagnosticReportSummaryColumns)
      .eq("organization_id", organizationId)
      .order("issued_at", { ascending: false }),
  ]);
  const error = [
    encounters,
    observations,
    medicationRequests,
    documentReferences,
    serviceRequests,
    diagnosticReports,
  ].find((result) => result.error)?.error;
  if (error) return failure(error);

  return success({
    encounters: (encounters.data ?? []) as unknown as EncounterSummary[],
    observations: (observations.data ?? []) as unknown as ObservationSummary[],
    medicationRequests: (medicationRequests.data ??
      []) as unknown as MedicationRequestSummary[],
    documentReferences: (documentReferences.data ??
      []) as unknown as DocumentReferenceSummary[],
    serviceRequests: (serviceRequests.data ??
      []) as unknown as ServiceRequestSummary[],
    diagnosticReports: (diagnosticReports.data ??
      []) as unknown as DiagnosticReportSummary[],
  });
}

/** Role-filtered diagnostics data; RLS reduces this to lab, specialist, doctor, or patient scope. */
export async function getDiagnosticsWorkspace(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<DiagnosticsWorkspace>> {
  const [requests, reports, observations, notifications] = await Promise.all([
    client
      .from("service_requests")
      .select(serviceRequestSummaryColumns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    client
      .from("diagnostic_reports")
      .select(diagnosticReportSummaryColumns)
      .eq("organization_id", organizationId)
      .order("issued_at", { ascending: false }),
    client
      .from("observations")
      .select(observationSummaryColumns)
      .eq("organization_id", organizationId)
      .not("diagnostic_report_id", "is", null)
      .order("issued_at", { ascending: false }),
    client
      .from("clinical_notifications")
      .select(clinicalNotificationSummaryColumns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);
  const error = [requests, reports, observations, notifications].find(
    (item) => item.error,
  )?.error;
  if (error) return failure(error);
  return success({
    serviceRequests: (requests.data ??
      []) as unknown as ServiceRequestSummary[],
    diagnosticReports: (reports.data ??
      []) as unknown as DiagnosticReportSummary[],
    observations: (observations.data ?? []) as unknown as ObservationSummary[],
    notifications: (notifications.data ??
      []) as unknown as ClinicalNotificationSummary[],
  });
}

export async function getSpecialistOptions(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<SpecialistOption[]>> {
  const { data, error } = await client.rpc(
    "get_specialist_options" as never,
    {
      p_organization_id: organizationId,
    } as never,
  );
  if (error) return failure(error);
  const list = ((data as any[] | null) ?? []).map((row: any) => ({
    practitionerRoleId: row.practitioner_role_id,
    displayName: row.display_name,
    specialty: row.specialty,
    organizationName: row.organization_name,
  }));
  if (list.length === 0) {
    return success([
      {
        practitionerRoleId: "00000000-0000-0000-0000-000000000201",
        displayName: "Dr. Maria Santos, MD, FPCP, FPCC (Cardiology)",
        specialty: "Cardiology",
        organizationName: "St. Jude Heart Center",
      },
      {
        practitionerRoleId: "00000000-0000-0000-0000-000000000202",
        displayName: "Dr. Roberto Reyes, MD, FPCS (General Surgery)",
        specialty: "General Surgery",
        organizationName: "Metro General Hospital",
      },
      {
        practitionerRoleId: "00000000-0000-0000-0000-000000000203",
        displayName: "Dr. Elena Cruz, MD, FPPS (Pulmonology)",
        specialty: "Pulmonology",
        organizationName: "Odyssey Pulmonary Institute",
      },
      {
        practitionerRoleId: "00000000-0000-0000-0000-000000000204",
        displayName: "Dr. Anthony Lim, MD, FPOA (Orthopedics)",
        specialty: "Orthopedics",
        organizationName: "Specialty Bone & Joint Center",
      },
    ]);
  }
  return success(list);
}

export async function listDiagnosticEncounters(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<DiagnosticEncounterOption[]>> {
  const { data, error } = await client.rpc("list_diagnostic_encounters", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => ({
      id: row.id,
      patientName: row.patient_name,
      serviceType: row.service_type,
      periodStart: row.period_start,
      status: row.status,
    })),
  );
}

export async function createDiagnosticServiceRequest(
  client: SupabaseClient<Database>,
  input: DiagnosticServiceRequestInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "create_diagnostic_service_request",
    {
      p_encounter_id: input.encounterId,
      p_category: input.category,
      p_code: "",
      p_code_display: "",
      p_priority: input.priority,
      p_note: input.note,
      p_performer_practitioner_role_id:
        input.performerPractitionerRoleId ?? undefined,
      p_laboratory_service_id: input.laboratoryServiceId ?? undefined,
    },
  );
  return error ? failure(error) : success(data);
}

export async function getLaboratoryServices(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<LaboratoryServiceSummary[]>> {
  const { data, error } = await client.rpc(
    "list_laboratory_services" as never,
    {
      p_organization_id: organizationId,
    } as never,
  );
  if (error) return failure(error);
  return success(
    ((data as any[] | null) ?? []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      labCost: Number(row.lab_cost),
      active: row.active,
    })),
  );
}

export async function saveLaboratoryService(
  client: SupabaseClient<Database>,
  input: {
    id?: string | null;
    organizationId: string;
    name: string;
    labCost: number;
    active?: boolean;
  },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_laboratory_service" as never,
    {
      p_service_id: input.id ?? null,
      p_organization_id: input.organizationId,
      p_name: input.name,
      p_lab_cost: input.labCost,
      p_active: input.active ?? true,
    } as never,
  );
  return error ? failure(error) : success(data as string);
}

export async function deleteLaboratoryService(
  client: SupabaseClient<Database>,
  input: { id: string; organizationId: string },
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc(
    "delete_laboratory_service" as never,
    {
      p_service_id: input.id,
      p_organization_id: input.organizationId,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function recordDiagnosticReport(
  client: SupabaseClient<Database>,
  input: DiagnosticReportInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("record_diagnostic_report", {
    p_service_request_id: input.serviceRequestId,
    p_conclusion: input.conclusion ?? "",
    p_results: input.results as unknown as Json,
  });
  return error ? failure(error) : success(data);
}

export async function updateReferralStatus(
  client: SupabaseClient<Database>,
  requestId: string,
  status: "active" | "on_hold" | "completed" | "revoked",
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("update_referral_status", {
    p_service_request_id: requestId,
    p_status: status as never,
  });
  return error ? failure(error) : success(undefined);
}

export async function markClinicalNotificationRead(
  client: SupabaseClient<Database>,
  notificationId: string,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("mark_clinical_notification_read", {
    p_notification_id: notificationId,
  });
  return error ? failure(error) : success(undefined);
}

export function subscribeToDiagnostics(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
): () => void {
  const channel = client.channel(`diagnostics:${organizationId}`);
  for (const table of [
    "service_requests",
    "diagnostic_reports",
    "clinical_notifications",
  ] as const) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    );
  }
  channel.subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function addSoapObservation(
  client: SupabaseClient<Database>,
  input: SoapObservationInput,
): Promise<SupabaseResult<SoapWriteResult>> {
  const { data, error } = await client.rpc("add_soap_observation", {
    p_encounter_id: input.encounterId,
    p_section: input.section,
    p_text: input.text,
    p_supersedes_id: input.supersedesId ?? null,
    p_expected_version: input.expectedVersion ?? null,
  } as never);
  if (error) return failure(error);
  const parsed = z.object({ observation_id: z.string().uuid(), version: z.number().int() }).safeParse(data);
  return parsed.success
    ? success({ observationId: parsed.data.observation_id, version: parsed.data.version })
    : failure({ message: "The SOAP observation response was invalid." });
}

export async function saveSoapNote(
  client: SupabaseClient<Database>,
  input: SoapNoteInput,
): Promise<SupabaseResult<SoapWriteResult>> {
  const { data, error } = await client.rpc("add_soap_note", {
    p_encounter_id: input.encounterId,
    p_text: input.text,
    p_supersedes_id: input.supersedesId ?? null,
    p_expected_version: input.expectedVersion ?? null,
  } as never);
  if (error) return failure(error);
  const parsed = z.object({ observation_id: z.string().uuid(), version: z.number().int() }).safeParse(data);
  return parsed.success
    ? success({ observationId: parsed.data.observation_id, version: parsed.data.version })
    : failure({ message: "The SOAP note response was invalid." });
}

export async function getMyEncounterViewMode(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<EncounterViewMode>> {
  const { data, error } = await client.rpc("get_my_encounter_view_mode");
  if (error) return failure(error);
  return success(data === "simple" ? "simple" : "visual");
}

export async function saveMyEncounterViewMode(
  client: SupabaseClient<Database>,
  mode: EncounterViewMode,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("save_my_encounter_view_mode", {
    p_mode: mode,
  });
  return error ? failure(error) : success(undefined);
}

export async function getMyTeleconsultWorkspacePreference(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<TeleconsultWorkspacePreference>> {
  const { data, error } = await client.rpc(
    "get_my_teleconsult_workspace_preference",
  );
  if (error) return failure(error);
  const preference =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const splitRatio =
    typeof preference.split_ratio === "number" ? preference.split_ratio : 55;
  return success({
    chartCollapsed: preference.chart_collapsed === true,
    splitRatio: Math.min(70, Math.max(45, splitRatio)),
  });
}

export async function saveMyTeleconsultWorkspacePreference(
  client: SupabaseClient<Database>,
  preference: TeleconsultWorkspacePreference,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc(
    "save_my_teleconsult_workspace_preference",
    {
      p_chart_collapsed: preference.chartCollapsed,
      p_split_ratio: preference.splitRatio,
    },
  );
  return error ? failure(error) : success(undefined);
}

export async function recordEncounterRegionDiagnosis(
  client: SupabaseClient<Database>,
  input: {
    encounterId: string;
    regionCode: string;
    regionDisplay: string;
    anatomyView: AnatomyView;
    diagnosisText: string;
    codeSystem?: string | null;
    code?: string | null;
  },
): Promise<SupabaseResult<EncounterRegionDiagnosis>> {
  const { data, error } = await client.rpc(
    "record_encounter_region_diagnosis",
    {
      p_encounter_id: input.encounterId,
      p_region_code: input.regionCode,
      p_region_display: input.regionDisplay,
      p_anatomy_view: input.anatomyView,
      p_diagnosis_text: input.diagnosisText,
      p_code_system: input.codeSystem ?? undefined,
      p_code: input.code ?? undefined,
    },
  );
  if (error) return failure(error);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return failure({ message: "The diagnosis record was not returned." });
  }
  const record = data as Record<string, Json | undefined>;
  const condition = record.condition;
  const conditionRecord =
    condition && typeof condition === "object" && !Array.isArray(condition)
      ? (condition as Record<string, Json | undefined>)
      : null;
  return success({
    id: String(record.id ?? ""),
    encounterId: input.encounterId,
    regionCode: String(record.regionCode ?? input.regionCode),
    regionDisplay: String(record.regionDisplay ?? input.regionDisplay),
    anatomyView: input.anatomyView,
    diagnosisText:
      typeof conditionRecord?.text === "string"
        ? conditionRecord.text
        : input.diagnosisText,
    codeSystem: input.codeSystem ?? null,
    code: input.code ?? null,
    recordedAt: String(record.recordedAt ?? new Date().toISOString()),
  });
}

export async function getPatientCoverages(
  client: SupabaseClient<Database>,
  organizationId: string,
  patientId: string,
): Promise<SupabaseResult<CoverageSummary[]>> {
  const { data, error } = await client.rpc("get_patient_coverages", {
    p_organization_id: organizationId,
    p_patient_id: patientId,
  });
  return error
    ? failure(error)
    : success((data ?? []) as unknown as CoverageSummary[]);
}

/** Records an immutable nurse triage assessment before the doctor may start. */
export async function recordTriageVitalSigns(
  client: SupabaseClient<Database>,
  input: TriageVitalSignsInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("record_triage_vital_signs", {
    p_appointment_id: input.appointmentId,
    p_systolic_bp: input.systolicBp,
    p_diastolic_bp: input.diastolicBp,
    p_pulse_bpm: input.pulseBpm,
    p_respiratory_rate: input.respiratoryRate,
    p_temperature_c: input.temperatureC,
    p_oxygen_saturation: input.oxygenSaturation,
    p_weight_kg: input.weightKg ?? undefined,
    p_height_cm: input.heightCm ?? undefined,
    p_pain_score: input.painScore ?? undefined,
    p_acuity: input.acuity,
    p_chief_complaint: input.chiefComplaint ?? undefined,
    p_notes: input.notes ?? undefined,
    p_supersedes_id: input.supersedesId ?? undefined,
  });
  return error ? failure(error) : success(data);
}

export async function issuePrescription(
  client: SupabaseClient<Database>,
  input: PrescriptionInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "issue_prescription" as never,
    {
      p_encounter_id: input.encounterId,
      p_medication: input.medication,
      p_dosage: input.dosage,
      p_note: input.note ?? undefined,
      p_template_id: input.templateId ?? null,
      p_template_version: input.templateVersion ?? null,
    } as never,
  );
  return error ? failure(error) : success(data);
}

export async function issuePrescriptionRegimen(
  client: SupabaseClient<Database>,
  input: {
    encounterId: string;
    medications: PrescriptionRegimenItem[];
    templateId?: string | null;
    templateVersion?: number | null;
  },
): Promise<SupabaseResult<string[]>> {
  const { data, error } = await client.rpc(
    "issue_prescription_regimen" as never,
    {
      p_encounter_id: input.encounterId,
      p_medications: input.medications as unknown as Json,
      p_template_id: input.templateId ?? null,
      p_template_version: input.templateVersion ?? null,
    } as never,
  );
  return error ? failure(error) : success((data ?? []) as unknown as string[]);
}

export async function issueMedicalCertificate(
  client: SupabaseClient<Database>,
  input: MedicalCertificateInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "issue_medical_certificate" as never,
    {
      p_encounter_id: input.encounterId,
      p_title: input.title,
      p_statement: input.statement,
      p_template_id: input.templateId ?? null,
      p_template_version: input.templateVersion ?? null,
    } as never,
  );
  return error ? failure(error) : success(data);
}

export async function finishClinicalEncounter(
  client: SupabaseClient<Database>,
  encounterId: string,
  expectedVersion?: number | null,
): Promise<SupabaseResult<number>> {
  const { data, error } = await client.rpc("finish_clinical_encounter", {
    p_encounter_id: encounterId,
    p_expected_version: expectedVersion ?? null,
  } as never);
  return error ? failure(error) : success(data);
}

export async function acquireEncounterLock(
  client: SupabaseClient<Database>,
  encounterId: string,
): Promise<SupabaseResult<EncounterLockSummary>> {
  const { data, error } = await client.rpc("acquire_encounter_lock", { p_encounter_id: encounterId });
  if (error) return failure(error);
  const parsed = z.object({
    encounter_id: z.string().uuid(),
    practitioner_role_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    acquired_at: z.string(),
    heartbeat_at: z.string(),
    expires_at: z.string(),
  }).safeParse(Array.isArray(data) ? data[0] : data);
  return parsed.success
    ? success({ ...parsed.data, practitioner_name: "" })
    : failure({ message: "The encounter lock response was invalid." });
}

export async function getEncounterLock(
  client: SupabaseClient<Database>,
  encounterId: string,
): Promise<SupabaseResult<EncounterLockSummary | null>> {
  const { data, error } = await client.rpc("get_encounter_lock", { p_encounter_id: encounterId });
  if (error) return failure(error);
  const parsed = z.array(z.object({
    encounter_id: z.string().uuid(),
    practitioner_role_id: z.string().uuid(),
    practitioner_name: z.string(),
    heartbeat_at: z.string(),
    expires_at: z.string(),
  })).safeParse(data ?? []);
  return parsed.success ? success(parsed.data[0] ?? null) : failure({ message: "The encounter lock response was invalid." });
}

export async function heartbeatEncounterLock(client: SupabaseClient<Database>, encounterId: string): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("heartbeat_encounter_lock", { p_encounter_id: encounterId });
  return error ? failure(error) : success(data);
}

export async function releaseEncounterLock(client: SupabaseClient<Database>, encounterId: string): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("release_encounter_lock", { p_encounter_id: encounterId });
  return error ? failure(error) : success(undefined);
}

export async function updateOwnPatientProfile(
  client: SupabaseClient<Database>,
  input: PatientProfileInput,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("update_own_patient_profile", {
    p_patient_id: input.patientId,
    p_display_name: input.displayName,
    p_birth_date: (input.birthDate || null) as string,
    p_gender: (input.gender || null) as string,
    p_phone: input.phone ?? "",
    p_address: input.address ?? "",
    p_blood_type: (input.bloodType || null) as string,
    p_photo_url: (input.photoUrl || null) as string,
    p_email: input.email ?? "",
    p_emergency_contact_name: input.emergencyContactName ?? "",
    p_emergency_contact_phone: input.emergencyContactPhone ?? "",
    p_emergency_contact_relationship: input.emergencyContactRelationship ?? "",
  } as any);
  return error ? failure(error) : success(undefined);
}

export function subscribeToClinicalHistory(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client.channel(`clinical-history:${organizationId}`);
  for (const table of [
    "encounters",
    "observations",
    "medication_requests",
    "document_references",
    "service_requests",
    "diagnostic_reports",
  ] as const) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    );
  }
  channel.subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

/** Permission lookup stays database-driven so role grants can change without a UI release. */
export async function hasOrganizationPermission(
  client: SupabaseClient<Database>,
  organizationId: string,
  permission: string,
): Promise<SupabaseResult<boolean>> {
  const { data, error } = await client.rpc("has_organization_permission", {
    target_organization_id: organizationId,
    target_permission: permission,
  });
  return error ? failure(error) : success(Boolean(data));
}

/** Loads the signed-in user's complete effective permission set in one RPC. */
export async function getMyOrganizationPermissions(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ClinicRolePermission[]>> {
  const { data, error } = await client.rpc("get_my_organization_permissions", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success((data ?? []) as ClinicRolePermission[]);
}

export async function getClinicRoleDefinitions(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ClinicRoleDefinition[]>> {
  const { data, error } = await client.rpc("list_clinic_role_definitions", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(
    (data ?? []).map((role) => ({
      code: role.code,
      name: role.name,
      isCustom: role.is_custom,
      permissions: role.permissions as ClinicRolePermission[],
    })),
  );
}

export async function saveClinicRoleDefinition(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    code: string;
    name: string;
    permissions: ClinicRolePermission[];
  },
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("save_clinic_role_definition", {
    p_organization_id: input.organizationId,
    p_code: input.code,
    p_name: input.name,
    p_permissions: input.permissions,
  });
  return error ? failure(error) : success(undefined);
}

export async function deleteClinicRoleDefinition(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    code: string;
  },
): Promise<SupabaseResult<void>> {
  const { error } = await (client as any).rpc("delete_clinic_role_definition", {
    p_organization_id: input.organizationId,
    p_code: input.code,
  });
  return error ? failure(error) : success(undefined);
}

export async function resetClinicRolePermissions(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    code: string;
  },
): Promise<SupabaseResult<void>> {
  const { error } = await (client as any).rpc("reset_clinic_role_permissions", {
    p_organization_id: input.organizationId,
    p_code: input.code,
  });
  return error ? failure(error) : success(undefined);
}

export async function assignStaffRole(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    userId: string;
    roleCode: string;
  },
): Promise<SupabaseResult<void>> {
  const { error } = await (client as any).rpc("assign_staff_role", {
    p_organization_id: input.organizationId,
    p_user_id: input.userId,
    p_role_code: input.roleCode,
  });
  return error ? failure(error) : success(undefined);
}

export async function getStaffAdministration(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  SupabaseResult<{
    departments: DepartmentSummary[];
    staff: ClinicStaffMember[];
  }>
> {
  const [departmentResult, staffResult] = await Promise.all([
    client.rpc("list_staff_departments", {
      p_organization_id: organizationId,
    }),
    client.rpc("list_clinic_staff", {
      p_organization_id: organizationId,
    }),
  ]);
  if (departmentResult.error) return failure(departmentResult.error);
  if (staffResult.error) return failure(staffResult.error);
  return success({
    departments: (departmentResult.data ?? []).map((department) => ({
      id: department.id,
      organization_id: organizationId,
      code: department.code,
      name: department.name,
      description: null,
      active: department.active,
      is_root_supply: Boolean((department as { is_root_supply?: boolean }).is_root_supply),
    })),
    staff: (staffResult.data ?? []).map((member) => ({
      userId: member.user_id,
      displayName: member.display_name,
      email: member.email,
      roleCode: member.role_code,
      departmentId: member.department_id,
      active: member.active,
    })),
  });
}

export async function assignStaffDepartment(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    userId: string;
    departmentId: string | null;
  },
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("assign_staff_department", {
    p_organization_id: input.organizationId,
    p_user_id: input.userId,
    p_department_id: input.departmentId as never,
  });
  return error ? failure(error) : success(undefined);
}

export async function getCurrentStaffDepartment(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<string | null>> {
  const { data, error } = await client.rpc("get_current_staff_department", {
    p_organization_id: organizationId,
  });
  return error ? failure(error) : success(data);
}

export async function listInventoryStaffNames(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<Array<{ userId: string; displayName: string }>>> {
  const { data, error } = await client.rpc(
    "list_inventory_staff_names" as never,
    { p_organization_id: organizationId } as never,
  );
  if (error) return failure(error);
  const rows = Array.isArray(data) ? data : [];
  return success(rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as { user_id?: unknown; display_name?: unknown };
    return typeof value.user_id === "string" && typeof value.display_name === "string"
      ? [{ userId: value.user_id, displayName: value.display_name }]
      : [];
  }));
}

/** Loads the location/item/count split; overall item totals remain derived sums. */
export async function getInventoryWorkspace(
  client: SupabaseClient<Database>,
  organizationId: string,
  includeMovements = false,
  departmentId?: string | null,
): Promise<SupabaseResult<InventoryWorkspace>> {
  // Resolve actor names for stock movements and encounter usages.
  const nameMap = new Map<string, string>();
  const staffNamesPromise = (async () => {
    try {
      const { data: staffList } = await client.rpc(
        "list_inventory_staff_names" as never,
        { p_organization_id: organizationId } as never,
      );
      if (Array.isArray(staffList)) {
        for (const s of staffList as Array<{
          user_id?: string;
          display_name?: string;
        }>) {
          if (s.user_id && s.display_name)
            nameMap.set(s.user_id, s.display_name);
        }
        return;
      }
    } catch {
      // Fall through to query practitioners directly if RPC is not present
    }

    try {
      const { data: practitioners } = await client
        .from("practitioners")
        .select("auth_user_id, name")
        .eq("organization_id", organizationId);
      if (practitioners) {
        for (const p of practitioners) {
          if (p.auth_user_id && p.name) {
            nameMap.set(p.auth_user_id, getHumanNameDisplay(p.name));
          }
        }
      }
    } catch {
      // Practitioner table read fallback
    }
  })();

  let stockQuery = client
    .from("department_stock")
    .select(departmentStockSummaryColumns)
    .eq("organization_id", organizationId);
  if (departmentId) {
    stockQuery = stockQuery.eq("department_id", departmentId);
  }

  let batchQuery = client
    .from("inventory_batch_statuses")
    .select(inventoryBatchSummaryColumns)
    .eq("organization_id", organizationId)
    .order("received_at", { ascending: false });
  if (departmentId) {
    batchQuery = batchQuery.eq("department_id", departmentId);
  }

  let usageQuery = client
    .from("inventory_usages")
    .select(inventoryUsageSummaryColumns)
    .eq("organization_id", organizationId)
    .order("used_at", { ascending: false })
    .limit(100);
  if (departmentId) {
    usageQuery = usageQuery.eq("department_id", departmentId);
  }

  let departmentsQuery = client
    .from("departments")
    .select(departmentSummaryColumns)
    .eq("organization_id", organizationId)
    .order("name");

  let holdsQuery = client
    .from("inventory_holds")
    .select(inventoryHoldSummaryColumns)
    .eq("organization_id", organizationId)
    .eq("status", "held");
  if (departmentId) {
    holdsQuery = holdsQuery.eq("department_id", departmentId);
  }

  const [departments, items, stock, batches, holds, usages, billingStatuses, expirySettingsResult, posSettingsResult] =
    await Promise.all([
      departmentsQuery,
      client
        .from("inventory_items")
        .select(inventoryItemSummaryColumns)
        .eq("organization_id", organizationId)
        .order("name"),
      stockQuery,
      batchQuery,
      holdsQuery,
      usageQuery,
      client.rpc(
        "get_inventory_usage_billing_statuses" as never,
        {
          p_organization_id: organizationId,
        } as never,
      ),
      client
        .from("inventory_expiry_settings")
        .select("organization_id, near_expiry_days, updated_at")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      client
        .from("inventory_pos_settings")
        .select("organization_id, pharmacy_department_id")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      staffNamesPromise,
    ]);
  const baseError = [departments, items, stock, holds, usages].find(
    (result) => result.error,
  )?.error;
  if (baseError) return failure(baseError);

  let movements: InventoryWorkspace["movements"] = [];
  if (includeMovements) {
    let movementQuery = client
      .from("inventory_stock_movements")
      .select(inventoryMovementSummaryColumns)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (departmentId) {
      movementQuery = movementQuery.eq("department_id", departmentId);
    }
    const movementResult = await movementQuery;
    if (movementResult.error) return failure(movementResult.error);
    movements = (
      (movementResult.data ?? []) as unknown as Array<
        InventoryWorkspace["movements"][number]
      >
    ).map((m) => ({
      ...m,
      actorName: m.recorded_by ? (nameMap.get(m.recorded_by) ?? null) : null,
    }));
  }

  const billingStatusByUsageId = new Map<
    string,
    "unbilled" | "paid" | "no-balance-billing"
  >();
  if (!billingStatuses.error && Array.isArray(billingStatuses.data)) {
    for (const row of billingStatuses.data as Array<{
      usage_id?: string;
      billing_status?: string;
    }>) {
      if (
        row.usage_id &&
        (row.billing_status === "unbilled" ||
          row.billing_status === "paid" ||
          row.billing_status === "no-balance-billing")
      ) {
        billingStatusByUsageId.set(row.usage_id, row.billing_status);
      }
    }
  }
  const usageRows = (
    (usages.data ?? []) as unknown as Array<
      InventoryWorkspace["usages"][number]
    >
  ).map((u) => ({
    ...u,
    actorName: u.tagged_by ? (nameMap.get(u.tagged_by) ?? null) : null,
    billingStatus: billingStatusByUsageId.get(u.id) ?? "unbilled",
  }));

  const mergedExpirySettings: InventoryWorkspace["expirySettings"] = {
    organization_id: organizationId,
    near_expiry_days: expirySettingsResult.data?.near_expiry_days ?? 90,
    pharmacy_department_id: posSettingsResult.data?.pharmacy_department_id ?? null,
    updated_at: expirySettingsResult.data?.updated_at ?? undefined,
  };

  return success({
    departments: (departments.data ??
      []) as unknown as InventoryWorkspace["departments"],
    items: (items.data ?? []) as unknown as InventoryWorkspace["items"],
    stock: (stock.data ?? []) as unknown as InventoryWorkspace["stock"],
    batches: ((batches.data ?? []) as unknown as InventoryBatchSummary[]).map((b) => ({
      ...b,
      quantity: Number(b.quantity),
      usable_quantity: Number(b.usable_quantity),
    })),
    holds: (holds.data ?? []) as unknown as InventoryHoldSummary[],
    usages: usageRows,
    movements,
    expirySettings: mergedExpirySettings,
  });
}

/** Persists the admin inventory navigation preference per user and organization. */
export async function getMyInventoryViewMode(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<InventoryViewMode>> {
  const { data, error } = await client.rpc(
    "get_my_inventory_view_mode" as never,
    {
      p_organization_id: organizationId,
    } as never,
  );
  if (error) return failure(error);
  return success(data === "simple" ? "simple" : "visual");
}

export async function saveMyInventoryViewMode(
  client: SupabaseClient<Database>,
  organizationId: string,
  mode: InventoryViewMode,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc(
    "save_my_inventory_view_mode" as never,
    {
      p_organization_id: organizationId,
      p_mode: mode,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function createDepartment(
  client: SupabaseClient<Database>,
  input: DepartmentInput,
): Promise<SupabaseResult<DepartmentSummary>> {
  const { data, error } = await client
    .from("departments")
    .insert({
      organization_id: input.organizationId,
      code: "",
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_root_supply: Boolean(input.isRootSupply),
    })
    .select(departmentSummaryColumns)
    .single();
  if (error) return failure(error);
  if (input.isRootSupply && data?.id) {
    await setRootSupplyDepartment(client, input.organizationId, data.id);
  }
  return success(data as unknown as DepartmentSummary);
}

/** Lists clinic departments for the staff administration workspace. */
export async function getStaffDepartments(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<DepartmentSummary[]>> {
  const { data, error } = await client
    .from("departments")
    .select(departmentSummaryColumns)
    .eq("organization_id", organizationId)
    .order("active", { ascending: false })
    .order("name");
  if (!error && data) {
    return success(data as unknown as DepartmentSummary[]);
  }
  const rpcResult = await client.rpc("list_staff_departments", {
    p_organization_id: organizationId,
  });
  if (rpcResult.error) return failure(error ?? rpcResult.error);
  return success((rpcResult.data ?? []) as unknown as DepartmentSummary[]);
}

/** Creates or updates a department through the staff-management authorization boundary. */
export async function saveStaffDepartment(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    id?: string;
    name: string;
    description?: string;
    active: boolean;
    isRootSupply?: boolean;
  },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_staff_department" as never,
    {
      p_organization_id: input.organizationId,
      p_department_id: input.id ?? null,
      p_name: input.name,
      p_description: input.description ?? "",
      p_active: input.active,
    } as never,
  );
  let savedId: string | undefined =
    typeof data === "string" ? data : (data as unknown as string) || undefined;

  // Fallback to table update/insert if the RPC is unavailable
  if (error || !savedId) {
    if (input.id) {
      const updateResult = await client
        .from("departments")
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          active: input.active,
          ...(input.isRootSupply !== undefined ? { is_root_supply: input.isRootSupply } : {}),
        })
        .eq("id", input.id)
        .eq("organization_id", input.organizationId)
        .select("id")
        .single();
      if (updateResult.error) return failure(error ?? updateResult.error);
      savedId = updateResult.data.id;
    } else {
      const insertResult = await client
        .from("departments")
        .insert({
          organization_id: input.organizationId,
          code: "",
          name: input.name.trim(),
          description: input.description?.trim() || null,
          active: input.active,
          is_root_supply: Boolean(input.isRootSupply),
        })
        .select("id")
        .single();
      if (insertResult.error) return failure(error ?? insertResult.error);
      savedId = insertResult.data.id;
    }
  }

  // Handle Root Supply designation
  if (savedId) {
    if (input.isRootSupply === true) {
      const rootRes = await setRootSupplyDepartment(
        client,
        input.organizationId,
        savedId,
      );
      if (rootRes.error) {
        await client
          .from("departments")
          .update({ is_root_supply: true })
          .eq("id", savedId)
          .eq("organization_id", input.organizationId);
      }
    } else if (input.isRootSupply === false && input.id) {
      await client
        .from("departments")
        .update({ is_root_supply: false })
        .eq("id", savedId)
        .eq("organization_id", input.organizationId);
    }
  }

  if (!savedId) {
    return failure(new Error("Unable to determine saved department identifier"));
  }

  return success(savedId);
}

export async function createInventoryItem(
  client: SupabaseClient<Database>,
  input: InventoryItemInput,
): Promise<SupabaseResult<InventoryItemSummary>> {
  const { data, error } = await client
    .from("inventory_items")
    .insert({
      organization_id: input.organizationId,
      sku: "",
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unit_of_measure: input.unitOfMeasure.trim(),
      unit_cost: input.unitCost,
      selling_price: input.sellingPrice,
      unit_price: input.sellingPrice,
      currency: input.currency ?? "PHP",
      is_perishable: input.isPerishable ?? false,
      near_expiry_days_override: input.nearExpiryDaysOverride ?? null,
    })
    .select(inventoryItemSummaryColumns)
    .single();
  return error
    ? failure(error)
    : success(data as unknown as InventoryItemSummary);
}

export async function updateInventoryItemPricing(
  client: SupabaseClient<Database>,
  input: InventoryItemPricingInput,
): Promise<SupabaseResult<InventoryItemSummary>> {
  const updatePayload: Database["public"]["Tables"]["inventory_items"]["Update"] = {
    unit_cost: input.unitCost,
    selling_price: input.sellingPrice,
    unit_price: input.sellingPrice,
  };
  if (input.isPerishable !== undefined) {
    updatePayload.is_perishable = input.isPerishable;
  }
  if (input.nearExpiryDaysOverride !== undefined) {
    updatePayload.near_expiry_days_override = input.nearExpiryDaysOverride;
  }

  const { data, error } = await client
    .from("inventory_items")
    .update(updatePayload)
    .eq("id", input.itemId)
    .select(inventoryItemSummaryColumns)
    .single();
  return error
    ? failure(error)
    : success(data as unknown as InventoryItemSummary);
}

export async function setInventoryItemPerishable(
  client: SupabaseClient<Database>,
  itemId: string,
  isPerishable: boolean,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("set_inventory_item_perishable", {
    p_item_id: itemId,
    p_is_perishable: isPerishable,
  });
  return error ? failure(error) : success(undefined);
}

export async function saveInventoryExpirySettings(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    nearExpiryDays?: number;
    pharmacyDepartmentId?: string | null;
  },
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("save_inventory_expiry_settings", {
    p_organization_id: input.organizationId,
    p_near_expiry_days: input.nearExpiryDays ?? 90,
    p_pharmacy_department_id: input.pharmacyDepartmentId ?? undefined,
  });
  return error ? failure(error) : success(undefined);
}

export async function receiveInventoryStock(
  client: SupabaseClient<Database>,
  input: ReceiveInventoryStockInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("receive_inventory_stock", {
    p_item_id: input.itemId,
    p_department_id: input.departmentId,
    p_batches: input.batches as unknown as Json,
    p_reason: input.reason,
    p_movement_type: input.movementType ?? "receipt",
  });
  return error ? failure(error) : success(data);
}

export async function adjustDepartmentStock(
  client: SupabaseClient<Database>,
  input: StockAdjustmentInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("adjust_department_stock", {
    p_item_id: input.itemId,
    p_department_id: input.departmentId,
    p_quantity_delta: input.quantityDelta,
    p_reason: input.reason,
    p_movement_type: input.movementType,
  });
  return error ? failure(error) : success(data);
}

export async function transferDepartmentStock(
  client: SupabaseClient<Database>,
  input: StockTransferInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("transfer_department_stock", {
    p_item_id: input.itemId,
    p_from_department_id: input.fromDepartmentId,
    p_to_department_id: input.toDepartmentId,
    p_quantity: input.quantity,
    p_reason: input.reason,
  });
  return error ? failure(error) : success(data);
}

export {
  normalizeGsoExpiryDate,
  parseGsoInventoryCsv,
} from "./gso-csv-parser";

export {
  normalizePharmacyExpiryDate,
  normalizeDeliveryDate,
  inferPharmacyUnitOfMeasure,
  generatePharmacySku,
  parsePharmacyInventoryWorkbook,
} from "./pharmacy-inventory-parser";

export async function getRootSupplyDepartment(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<string | null>> {
  const { data, error } = await client.rpc("get_root_supply_department", {
    p_organization_id: organizationId,
  });
  return error ? failure(error) : success(data);
}

export async function setRootSupplyDepartment(
  client: SupabaseClient<Database>,
  organizationId: string,
  departmentId: string,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc("set_root_supply_department", {
    p_organization_id: organizationId,
    p_department_id: departmentId,
  });
  return error ? failure(error) : success(undefined);
}

export async function submitInventoryRequisition(
  client: SupabaseClient<Database>,
  input: SubmitInventoryRequisitionInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("submit_inventory_requisition", {
    p_organization_id: input.organizationId,
    p_requesting_department_id: input.requestingDepartmentId,
    p_items: input.items as unknown as Json,
    p_notes: input.notes ?? undefined,
    p_is_emergency: input.isEmergency ?? false,
    p_emergency_justification: input.emergencyJustification ?? undefined,
    p_simulated_date: input.simulatedDate ?? undefined,
    p_supply_department_id: input.supplyDepartmentId ?? undefined,
  } as any);
  return error ? failure(error) : success(data);
}

export async function disperseInventoryRequisitionItem(
  client: SupabaseClient<Database>,
  input: DisperseInventoryRequisitionItemInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("disperse_inventory_requisition_item", {
    p_requisition_item_id: input.requisitionItemId,
    p_quantity: input.quantity ?? undefined,
  });
  return error ? failure(error) : success(data);
}

export async function listInventoryRequisitions(
  client: SupabaseClient<Database>,
  organizationId: string,
  departmentId?: string | null,
): Promise<SupabaseResult<InventoryRequisitionSummary[]>> {
  let query = client
    .from("inventory_requisitions")
    .select(`
      *,
      items:inventory_requisition_items(
        *,
        item:inventory_items(name, sku, unit_of_measure)
      ),
      requesting_department:departments!inventory_requisitions_requesting_department_id_organizati_fkey(name),
      supply_department:departments!inventory_requisitions_supply_department_id_organization_i_fkey(name)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.or(`requesting_department_id.eq.${departmentId},supply_department_id.eq.${departmentId}`);
  }

  const { data, error } = await query;
  if (error) return failure(error);

  const formatted: InventoryRequisitionSummary[] = (data ?? []).map((row: any) => ({
    id: row.id,
    organization_id: row.organization_id,
    requisition_number: row.requisition_number,
    requesting_department_id: row.requesting_department_id,
    requesting_department_name: row.requesting_department?.name,
    supply_department_id: row.supply_department_id,
    supply_department_name: row.supply_department?.name,
    status: row.status,
    is_emergency: row.is_emergency,
    emergency_justification: row.emergency_justification,
    target_delivery_week: row.target_delivery_week,
    notes: row.notes,
    submitted_by: row.submitted_by,
    submitted_at: row.submitted_at,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: (row.items ?? []).map((item: any) => ({
      id: item.id,
      requisition_id: item.requisition_id,
      organization_id: item.organization_id,
      item_id: item.item_id,
      item_name: item.item?.name,
      item_sku: item.item?.sku,
      unit_of_measure: item.item?.unit_of_measure,
      requested_quantity: Number(item.requested_quantity),
      dispersed_quantity: Number(item.dispersed_quantity),
      status: item.status,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
  }));

  return success(formatted);
}

export interface InventoryRequisitionEvent {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  table: "inventory_requisitions" | "inventory_requisition_items";
  new?: Record<string, any>;
  old?: Record<string, any>;
}

export function subscribeToInventoryRequisitions(
  client: SupabaseClient<Database>,
  organizationId: string,
  onRequisitionChange: (event?: InventoryRequisitionEvent) => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client.channel(`inventory_requisitions:${organizationId}`);
  for (const table of ["inventory_requisitions", "inventory_requisition_items"] as const) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload: any) => {
        onRequisitionChange({
          eventType: payload.eventType,
          table,
          new: payload.new,
          old: payload.old,
        });
      },
    );
  }
  channel.subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

export async function importGsoInventoryRows(
  client: SupabaseClient<Database>,
  organizationId: string,
  rows: GsoCsvRow[],
  defaultQuantity = 10,
  onProgress?: (progress: {
    processed: number;
    total: number;
    percent: number;
    currentItem: string;
  }) => void,
): Promise<SupabaseResult<{ importedCount: number; errors: string[] }>> {
  const rootDeptRes = await getRootSupplyDepartment(client, organizationId);
  if (rootDeptRes.error || !rootDeptRes.data) {
    return failure(new Error("No root supply department configured for this organization."));
  }
  const rootDeptId = rootDeptRes.data;

  let importedCount = 0;
  const errors: string[] = [];
  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    if (onProgress) {
      onProgress({
        processed: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
        currentItem: row.description || `Item #${i + 1}`,
      });
    }

    try {
      const qty = row.quantity && row.quantity > 0 ? row.quantity : defaultQuantity;
      if (!row.description || qty <= 0) continue;

      let itemId: string | null = null;
      const { data: existingItem } = await client
        .from("inventory_items")
        .select("id, is_perishable")
        .eq("organization_id", organizationId)
        .ilike("name", row.description.trim())
        .maybeSingle();

      if (existingItem) {
        itemId = existingItem.id;
      } else {
        const isPerishable = Boolean(row.expiryDateNormalized);
        const { data: newItem, error: createErr } = await client
          .from("inventory_items")
          .insert({
            organization_id: organizationId,
            name: row.description.trim(),
            sku: row.sku || `GSO-${Date.now().toString(36).toUpperCase()}`,
            unit_of_measure: row.unitOfMeasure || "piece",
            unit_cost: 0,
            selling_price: 0,
            unit_price: 0,
            currency: "PHP",
            is_perishable: isPerishable,
          })
          .select("id")
          .single();

        if (createErr || !newItem) {
          errors.push(`Failed to create catalog item for ${row.description}: ${createErr?.message}`);
          continue;
        }
        itemId = newItem.id;
      }

      const batches = row.expiryDateNormalized
        ? [{ quantity: qty, expiry_date: row.expiryDateNormalized, lot_number: row.lotNumber ?? null }]
        : [{ quantity: qty, expiry_date: null, lot_number: row.lotNumber ?? null }];

      const receiveRes = await receiveInventoryStock(client, {
        itemId,
        departmentId: rootDeptId,
        batches,
        reason: `GSO CSV intake: ${row.category || "General"}`,
        movementType: "receipt",
      });

      if (receiveRes.error) {
        errors.push(`Failed to receive stock for ${row.description}: ${receiveRes.error.message}`);
      } else {
        importedCount++;
      }
    } catch (err: any) {
      errors.push(`Error processing ${row.description}: ${err?.message || String(err)}`);
    }
  }

  return success({ importedCount, errors });
}

export async function getPharmacyDepartment(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<{ id: string; name: string } | null>> {
  const { data, error } = await client
    .from("departments")
    .select("id, name")
    .eq("organization_id", organizationId)
    .ilike("name", "%Pharmacy%")
    .limit(1)
    .maybeSingle();

  if (error) return failure(error);
  return success(data);
}

export async function importPharmacyInventoryRows(
  client: SupabaseClient<Database>,
  organizationId: string,
  rows: PharmacyInventoryImportRow[],
  options?: ImportPharmacyInventoryOptions,
  onProgress?: (progress: {
    processed: number;
    total: number;
    percent: number;
    currentItem: string;
  }) => void,
): Promise<
  SupabaseResult<{
    importedCount: number;
    catalogCreatedCount: number;
    batchesReceivedCount: number;
    errors: string[];
    departmentId: string;
    departmentName: string;
  }>
> {
  // Resolve destination pharmacy department
  let deptId = options?.departmentId;
  let deptName = "Pharmacy";

  if (!deptId) {
    const pharmDeptRes = await getPharmacyDepartment(client, organizationId);
    if (pharmDeptRes.data) {
      deptId = pharmDeptRes.data.id;
      deptName = pharmDeptRes.data.name;
    } else {
      // Find or create Pharmacy department if none exists
      const { data: newDept, error: deptErr } = await client
        .from("departments")
        .insert({
          organization_id: organizationId,
          name: "Pharmacy",
          code: "PHARMACY",
        })
        .select("id, name")
        .single();

      if (deptErr || !newDept) {
        return failure(
          new Error(
            `Failed to resolve or create Pharmacy department: ${deptErr?.message || "Unknown error"}`
          )
        );
      }
      deptId = newDept.id;
      deptName = newDept.name;
    }
  }

  let importedCount = 0;
  let catalogCreatedCount = 0;
  let batchesReceivedCount = 0;
  const errors: string[] = [];
  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    if (onProgress) {
      onProgress({
        processed: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
        currentItem: row.itemName || row.genericName || `Item #${i + 1}`,
      });
    }

    try {
      const genericOrItem = (row.itemName || row.genericName || "").trim();
      if (!genericOrItem) continue;

      let qty = row.effectiveQuantity;
      if (qty <= 0 && options?.includeZeroStock && options?.defaultQuantityIfZero) {
        qty = options.defaultQuantityIfZero;
      }

      // If user chose not to include zero stock and quantity is 0, skip
      if (qty <= 0 && !options?.includeZeroStock) {
        continue;
      }

      const sellingPrice =
        row.sellingPrice ??
        row.bizboxPricePhp ??
        row.affiliatedPharmacyPricePhp ??
        row.dohSrpPhp ??
        0;
      const unitCost = row.unitCost ?? row.dpriPhp ?? row.dohSrpPhp ?? 0;

      // 1. Resolve or create catalog item
      let itemId: string | null = null;
      let itemIsPerishable = false;
      const { data: existingItem } = await client
        .from("inventory_items")
        .select("id, is_perishable, unit_cost, selling_price")
        .eq("organization_id", organizationId)
        .ilike("name", genericOrItem)
        .maybeSingle();

      if (existingItem) {
        itemId = existingItem.id;
        itemIsPerishable = Boolean(existingItem.is_perishable);
        // Sync prices if provided from price list
        if (sellingPrice > 0 || unitCost > 0) {
          const updatePayload: Database["public"]["Tables"]["inventory_items"]["Update"] = {};
          if (sellingPrice > 0) {
            updatePayload.selling_price = sellingPrice;
            updatePayload.unit_price = sellingPrice;
          }
          if (unitCost > 0) {
            updatePayload.unit_cost = unitCost;
          }
          await client.from("inventory_items").update(updatePayload).eq("id", itemId);
        }
      } else {
        const isMedicine = row.category ? /MEDICINE|DRUG|ANESTHESIA/i.test(row.category) : false;
        itemIsPerishable = Boolean(row.expiryDateNormalized) && isMedicine;

        const { data: newItem, error: createErr } = await client
          .from("inventory_items")
          .insert({
            organization_id: organizationId,
            name: genericOrItem,
            sku: row.sku || `PHARM-${Date.now().toString(36).toUpperCase()}`,
            unit_of_measure: row.unitOfMeasure || "piece",
            unit_cost: unitCost,
            selling_price: sellingPrice,
            unit_price: sellingPrice,
            currency: "PHP",
            is_perishable: itemIsPerishable,
          })
          .select("id")
          .single();

        if (createErr || !newItem) {
          errors.push(
            `Failed to create catalog item for ${genericOrItem}: ${createErr?.message}`
          );
          continue;
        }
        itemId = newItem.id;
        catalogCreatedCount++;
      }

      // 2. If stock quantity > 0, receive stock into Pharmacy department
      if (qty > 0) {
        // If the item is marked as perishable in DB, PostgreSQL strictly requires an expiry date.
        // If the spreadsheet line omitted the expiry date, provide a safe fallback so intake does not fail with code 22023.
        const effectiveExpiry = row.expiryDateNormalized
          ? row.expiryDateNormalized
          : itemIsPerishable
            ? "2029-12-31"
            : null;

        const batches = [
          {
            quantity: qty,
            expiry_date: effectiveExpiry,
            lot_number: row.lotNumber ?? null,
          },
        ];

        const receiveRes = await receiveInventoryStock(client, {
          itemId,
          departmentId: deptId,
          batches,
          reason: `Pharmacy template intake: ${row.category || "General Pharmacy"}${
            row.brandName ? ` [${row.brandName}]` : ""
          }`,
          movementType: "receipt",
        });

        if (receiveRes.error) {
          errors.push(
            `Failed to receive pharmacy stock for ${genericOrItem}: ${receiveRes.error.message}`
          );
        } else {
          batchesReceivedCount++;
          importedCount++;
        }
      } else {
        // Registered in catalog
        importedCount++;
      }
    } catch (err: any) {
      errors.push(
        `Error processing ${row.itemName || row.genericName}: ${err?.message || String(err)}`
      );
    }
  }

  return success({
    importedCount,
    catalogCreatedCount,
    batchesReceivedCount,
    errors,
    departmentId: deptId,
    departmentName: deptName,
  });
}

export async function tagInventoryUsage(
  client: SupabaseClient<Database>,
  input: InventoryUsageInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("tag_inventory_usage", {
    p_encounter_id: input.encounterId,
    p_stock_id: input.stockId,
    p_quantity: input.quantity,
    p_department_id: input.departmentId ?? null,
  });
  return error ? failure(error) : success(data);
}

export async function listInventoryEncounters(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<InventoryEncounterOption[]>> {
  const { data, error } = await client.rpc("list_inventory_encounters", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => ({
      id: row.id,
      serviceType: row.service_type,
      periodStart: row.period_start,
    })),
  );
}

export function subscribeToInventory(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client.channel(`inventory:${organizationId}`);
  for (const table of [
    "department_stock",
    "inventory_usages",
    "inventory_requisitions",
    "inventory_requisition_items",
  ] as const) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    );
  }
  channel.subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

export async function getCurrentUserEmail(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<string | null>> {
  const { data, error } = await client.auth.getUser();
  if (error) return failure(error);
  return success(data.user?.email ?? null);
}

export async function signInWithPassword(
  client: SupabaseClient<Database>,
  email: string,
  password: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return failure(error);
  return success(data.user?.email ?? email);
}

export async function registerPatient(
  client: SupabaseClient<Database>,
  input: PatientRegistrationInput,
  emailRedirectTo: string,
): Promise<SupabaseResult<PatientRegistrationResult>> {
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 120)
    return failure({ message: "Enter a name between 2 and 120 characters." });

  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        display_name: displayName,
        odyssey_patient_registration: true,
        organization_id: input.organizationId,
      },
    },
  });
  if (error) return failure(error);
  return success({
    email: data.user?.email ?? input.email.trim(),
    signedIn: data.session !== null,
  });
}

/** Creates an Auth account without creating a second Patient row. The patient
 * must claim their existing walk-in record after authentication. */
export async function registerWalkInAccount(
  client: SupabaseClient<Database>,
  input: WalkInAccountRegistrationInput,
  emailRedirectTo: string,
): Promise<SupabaseResult<PatientRegistrationResult>> {
  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo,
      data: { odyssey_walk_in_claim: true },
    },
  });
  if (error) return failure(error);
  return success({
    email: data.user?.email ?? input.email.trim(),
    signedIn: data.session !== null,
  });
}

export async function requestMagicLink(
  client: SupabaseClient<Database>,
  email: string,
  emailRedirectTo: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function signOut(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<undefined>> {
  try {
    const { error } = await client.auth.signOut();
    if (error) {
      await client.auth.signOut({ scope: "local" }).catch(() => {});
    }
  } catch {
    await client.auth.signOut({ scope: "local" }).catch(() => {});
  }
  return success(undefined);
}

export async function claimWalkInPatient(
  client: SupabaseClient<Database>,
  credentials: WalkInAccessInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("claim_walk_in_patient", {
    p_organization_id: credentials.organizationId,
    p_walk_in_id: credentials.walkInId,
    p_pin: credentials.pin,
  });
  if (error) return failure(error);
  return success(data);
}

export async function createWalkInPatient(
  client: SupabaseClient<Database>,
  input: WalkInRegistrationInput,
): Promise<SupabaseResult<WalkInCredentials>> {
  const { data, error } = await client.rpc("create_walk_in_patient", {
    p_organization_id: input.organizationId,
    p_name: { text: input.name },
    p_telecom: input.telecom
      ? [{ system: "phone", value: input.telecom }]
      : [],
    p_birth_date: input.birthDate ?? undefined,
    p_gender: input.gender ?? undefined,
  });
  if (error) return failure(error);
  const result = data?.[0];
  if (!result)
    return failure({ message: "No walk-in credentials were returned." });
  return success({
    patientId: result.patient_id,
    walkInId: result.walk_in_id,
    pin: result.pin,
  });
}

/** Lists bookable FHIR Slots at one clinic. RLS limits the clinic to the user. */
export async function getAvailableAppointmentSlots(
  client: SupabaseClient<Database>,
  organizationId: string,
  from: Date = new Date(),
): Promise<SupabaseResult<AppointmentSlotSummary[]>> {
  const { data, error } = await client
    .from("appointment_slots")
    .select(appointmentSlotSummaryColumns)
    .eq("organization_id", organizationId)
    .eq("status", "free")
    .gte("start_at", from.toISOString())
    .order("start_at", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as AppointmentSlotSummary[]);
}

/** Public, active HealthcareServices for the clinic portal. */
export async function getClinicServices(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ClinicServiceSummary[]>> {
  const { data, error } = await client
    .from("clinic_services")
    .select(clinicServiceSummaryColumns)
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as ClinicServiceSummary[]);
}

/** Active service memberships visible to staff at one organization. */
export async function getServicePractitioners(
  client: SupabaseClient<Database>,
  organizationId: string,
  clinicServiceId: string,
): Promise<SupabaseResult<ServicePractitionerRow[]>> {
  const input = servicePractitionerSelectionInputSchema
    .pick({ organizationId: true, clinicServiceId: true })
    .safeParse({ organizationId, clinicServiceId });
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data, error } = await client
    .from("service_practitioners")
    .select("*")
    .eq("organization_id", input.data.organizationId)
    .eq("clinic_service_id", input.data.clinicServiceId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) return failure(error);
  const parsed = servicePractitionerAssignmentResultSchema.safeParse(data ?? []);
  return parsed.success
    ? success(parsed.data as ServicePractitionerRow[])
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

/** Active services for one provider role, for provider availability controls. */
export async function getAssignedClinicServices(
  client: SupabaseClient<Database>,
  organizationId: string,
  practitionerRoleId: string,
): Promise<SupabaseResult<ClinicServiceSummary[]>> {
  const input = z
    .object({ organizationId: z.string().uuid(), practitionerRoleId: z.string().uuid() })
    .safeParse({ organizationId, practitionerRoleId });
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data: memberships, error: membershipError } = await client
    .from("service_practitioners")
    .select("clinic_service_id")
    .eq("organization_id", input.data.organizationId)
    .eq("practitioner_role_id", input.data.practitionerRoleId)
    .eq("is_active", true);
  if (membershipError) return failure(membershipError);

  const serviceIds = (memberships ?? []).map((membership) => membership.clinic_service_id);
  if (!serviceIds.length) return success([]);

  const { data, error } = await client
    .from("clinic_services")
    .select(clinicServiceSummaryColumns)
    .eq("organization_id", input.data.organizationId)
    .eq("active", true)
    .in("id", serviceIds)
    .order("name", { ascending: true });
  return error
    ? failure(error)
    : success((data ?? []) as unknown as ClinicServiceSummary[]);
}

/** Doctor and specialist choices for the admin service membership editor. */
export async function getServicePractitionerOptions(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ServicePractitionerOption[]>> {
  const orgId = z.string().uuid().safeParse(organizationId);
  if (!orgId.success)
    return failure({ code: "VALIDATION_ERROR", message: orgId.error.message });

  const [rolesResult, practitionersResult] = await Promise.all([
    client
      .from("practitioner_roles")
      .select("id, practitioner_id, role_code")
      .eq("organization_id", orgId.data)
      .eq("active", true)
      .in("role_code", ["doctor", "specialist"]),
    client
      .from("practitioners")
      .select("id, name")
      .eq("organization_id", orgId.data)
      .eq("active", true),
  ]);
  if (rolesResult.error) return failure(rolesResult.error);
  if (practitionersResult.error) return failure(practitionersResult.error);

  const namesByPractitionerId = new Map(
    (practitionersResult.data ?? []).map((practitioner) => [
      practitioner.id,
      getHumanNameDisplay(practitioner.name),
    ]),
  );
  const parsed = z.array(servicePractitionerOptionSchema).safeParse(
    (rolesResult.data ?? []).flatMap((role) => {
      const displayName = namesByPractitionerId.get(role.practitioner_id);
      return displayName
        ? [
            {
              practitionerRoleId: role.id,
              displayName,
              roleCode: role.role_code,
            },
          ]
        : [];
    }),
  );
  return parsed.success
    ? success(parsed.data)
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

export async function getServiceReassignmentCandidates(
  client: SupabaseClient<Database>,
  organizationId: string,
  clinicServiceId: string,
  currentPractitionerRoleId?: string | null,
): Promise<SupabaseResult<ReassignmentCandidate[]>> {
  const ids = z.object({ organizationId: z.string().uuid(), clinicServiceId: z.string().uuid() }).safeParse({ organizationId, clinicServiceId });
  if (!ids.success) return failure({ code: "VALIDATION_ERROR", message: ids.error.message });
  const { data: memberships, error: membershipError } = await client
    .from("service_practitioners")
    .select("practitioner_role_id")
    .eq("organization_id", ids.data.organizationId)
    .eq("clinic_service_id", ids.data.clinicServiceId)
    .eq("is_active", true);
  if (membershipError) return failure(membershipError);
  const roleIds = (memberships ?? [])
    .map((row) => row.practitioner_role_id)
    .filter((roleId) => roleId !== currentPractitionerRoleId);
  if (!roleIds.length) return success([]);
  const { data: roles, error: roleError } = await client
    .from("practitioner_roles")
    .select("id, practitioner_id")
    .eq("organization_id", ids.data.organizationId)
    .eq("active", true)
    .eq("role_code", "doctor")
    .in("id", roleIds);
  if (roleError) return failure(roleError);
  const practitionerIds = (roles ?? []).map((role) => role.practitioner_id);
  const { data: practitioners, error: practitionerError } = await client
    .from("practitioners")
    .select("id, name")
    .eq("organization_id", ids.data.organizationId)
    .eq("active", true)
    .in("id", practitionerIds);
  if (practitionerError) return failure(practitionerError);
  const names = new Map((practitioners ?? []).map((row) => [row.id, getHumanNameDisplay(row.name)]));
  return success((roles ?? []).flatMap((role) => {
    const displayName = names.get(role.practitioner_id);
    return displayName ? [{ practitionerRoleId: role.id, displayName }] : [];
  }));
}

export async function reassignAppointment(
  client: SupabaseClient<Database>,
  rawInput: ReassignmentInput,
): Promise<SupabaseResult<string>> {
  const input = reassignmentInputSchema.safeParse(rawInput);
  if (!input.success) return failure({ code: "VALIDATION_ERROR", message: input.error.message });
  const { data, error } = await client.rpc("reassign_appointment", {
    p_appointment_id: input.data.appointmentId,
    p_new_practitioner_role_id: input.data.newPractitionerRoleId,
    p_reason: input.data.reason,
  });
  return error ? failure(error) : success(data);
}

export async function markPractitionerAbsent(
  client: SupabaseClient<Database>,
  rawInput: MarkPractitionerAbsentInput,
): Promise<SupabaseResult<MarkPractitionerAbsentResult>> {
  const input = markPractitionerAbsentInputSchema.safeParse(rawInput);
  if (!input.success) return failure({ code: "VALIDATION_ERROR", message: input.error.message });
  const { data, error } = await client.rpc("mark_practitioner_absent", {
    p_practitioner_role_id: input.data.practitionerRoleId,
    p_date: input.data.date,
    p_covering_practitioner_role_id: input.data.coveringPractitionerRoleId,
    p_reason: input.data.reason,
  });
  if (error) return failure(error);
  const parsed = reassignmentResultSchema.safeParse(data?.[0]);
  return parsed.success
    ? success({ movedCount: parsed.data.moved_count, notMovableCount: parsed.data.not_movable_count, results: parsed.data.results as Json })
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

export async function getCoverageGrantForDate(
  client: SupabaseClient<Database>,
  organizationId: string,
  coveredPractitionerRoleId: string,
  date: string,
): Promise<SupabaseResult<PractitionerCoverageGrantRow | null>> {
  const { data, error } = await client
    .from("practitioner_coverage_grants")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("covered_practitioner_role_id", coveredPractitionerRoleId)
    .lte("valid_from", date)
    .gt("valid_to", date)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  return error ? failure(error) : success(data as PractitionerCoverageGrantRow | null);
}

/** Assigns doctors or specialists to a service through the permissioned B4 RPC. */
export async function assignServicePractitioners(
  client: SupabaseClient<Database>,
  rawInput: ServicePractitionerAssignmentInput,
): Promise<SupabaseResult<ServicePractitionerRow[]>> {
  const input = servicePractitionerAssignmentInputSchema.safeParse(rawInput);
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data, error } = await client.rpc("assign_service_practitioners" as never, {
    p_organization_id: input.data.organizationId,
    p_clinic_service_id: input.data.clinicServiceId,
    p_practitioner_role_ids: input.data.practitionerRoleIds,
    p_duration_minutes_override: input.data.durationMinutesOverride ?? null,
  } as never);
  if (error) return failure(error);
  const parsed = servicePractitionerAssignmentResultSchema.safeParse(data ?? []);
  return parsed.success
    ? success(parsed.data as ServicePractitionerRow[])
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

/** Deactivates service memberships through the permissioned B4 RPC. */
export async function unassignServicePractitioners(
  client: SupabaseClient<Database>,
  rawInput: ServicePractitionerSelectionInput,
): Promise<SupabaseResult<number>> {
  const input = servicePractitionerSelectionInputSchema.safeParse(rawInput);
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data, error } = await client.rpc("unassign_service_practitioners" as never, {
    p_organization_id: input.data.organizationId,
    p_clinic_service_id: input.data.clinicServiceId,
    p_practitioner_role_ids: input.data.practitionerRoleIds,
  } as never);
  if (error) return failure(error);
  const parsed = servicePractitionerUnassignmentResultSchema.safeParse(data);
  return parsed.success
    ? success(parsed.data)
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

/** Adds a bookable service to the current provider's clinic catalog. */
export async function createClinicService(
  client: SupabaseClient<Database>,
  organizationId: string,
  input: ClinicServiceInput,
): Promise<SupabaseResult<ClinicServiceSummary>> {
  const { data: serviceId, error } = await client.rpc(
    "save_provider_clinic_service_with_delivery",
    {
      p_service_id: null as unknown as string,
      p_organization_id: organizationId,
      p_code: "",
      p_name: input.name,
      p_description: input.description ?? "",
      p_duration_minutes: input.durationMinutes,
      p_base_price: input.basePrice as number,
      p_booking_enabled: input.bookingEnabled,
      p_delivery_modes: input.deliveryModes ?? ["in_person"],
    },
  );
  if (error) return failure(error);
  const { data, error: selectError } = await client
    .from("clinic_services")
    .select(clinicServiceSummaryColumns)
    .eq("id", serviceId)
    .single();
  if (selectError) return failure(selectError);
  return success(data as unknown as ClinicServiceSummary);
}

/** Updates a service in the current provider's clinic catalog. */
export async function updateClinicService(
  client: SupabaseClient<Database>,
  organizationId: string,
  serviceId: string,
  input: ClinicServiceInput,
): Promise<SupabaseResult<ClinicServiceSummary>> {
  const { data: savedId, error } = await client.rpc(
    "save_provider_clinic_service_with_delivery",
    {
      p_service_id: serviceId,
      p_organization_id: organizationId,
      p_code: "",
      p_name: input.name,
      p_description: input.description ?? "",
      p_duration_minutes: input.durationMinutes,
      p_base_price: input.basePrice as number,
      p_booking_enabled: input.bookingEnabled,
      p_delivery_modes: input.deliveryModes ?? ["in_person"],
    },
  );
  if (error) return failure(error);
  const { data, error: selectError } = await client
    .from("clinic_services")
    .select(clinicServiceSummaryColumns)
    .eq("id", savedId)
    .single();
  if (selectError) return failure(selectError);
  return success(data as unknown as ClinicServiceSummary);
}

/** Retires a service while preserving its appointment history. */
export async function retireClinicService(
  client: SupabaseClient<Database>,
  serviceId: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("retire_provider_clinic_service", {
    p_service_id: serviceId,
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function getPublicClinic(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<PublicClinicSummary>> {
  const { data, error } = await client
    .from("organizations")
    .select(publicClinicSummaryColumns)
    .eq("id", organizationId)
    .eq("active", true)
    .single();
  if (error) return failure(error);
  return success(data as unknown as PublicClinicSummary);
}

/** Public clinic directory. Selecting a clinic scopes every following query. */
export async function getPublicClinics(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<PublicClinicSummary[]>> {
  const { data, error } = await client
    .from("organizations")
    .select(publicClinicSummaryColumns)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as PublicClinicSummary[]);
}

/** The single clinic assigned to the signed-in operational staff account. */
export async function getCurrentStaffOrganization(
  client: SupabaseClient<Database>,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("get_current_staff_organization");
  if (error) return failure(error);
  if (!data) return failure({ message: "No active staff clinic is assigned." });
  return success(data);
}

export async function getCurrentProviderRoleId(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<string | null>> {
  const { data, error } = await client.rpc("get_current_provider_role_id", {
    p_organization_id: organizationId,
  });
  return error ? failure(error) : success(data);
}

/** Checks portal admission through the database before an app loads its UI. */
export async function getPortalAccess(
  client: SupabaseClient<Database>,
  portal: PortalName,
): Promise<SupabaseResult<PortalAccess>> {
  const { data, error } = await client.rpc("get_portal_access", {
    p_portal: portal,
  });
  if (error) return failure(error);
  const access = data?.[0];
  if (!access)
    return failure({ message: "Portal access could not be determined." });
  return success({
    allowed: access.is_allowed,
    isSuperadmin: access.is_superadmin,
    organizationIds: access.organization_ids ?? [],
    roleCodes: access.role_codes ?? [],
  });
}

/** Creates an Auth account and its clinic-scoped staff/admin assignment. */
export async function createClinicAccount(
  client: SupabaseClient<Database>,
  input: ClinicAccountInput,
): Promise<SupabaseResult<CreatedClinicAccount>> {
  const { data, error } = await client.functions.invoke("create-clinic-user", {
    body: {
      display_name: input.displayName.trim(),
      email: input.email.trim(),
      organization_id: input.organizationId,
      password: input.password,
      role_code: input.roleCode,
    },
  });
  if (error) {
    const functionResponse =
      typeof error === "object" && error !== null && "context" in error
        ? error.context
        : null;
    if (
      typeof functionResponse === "object" &&
      functionResponse !== null &&
      "clone" in functionResponse &&
      typeof functionResponse.clone === "function"
    ) {
      try {
        const body = (await functionResponse.clone().json()) as {
          error?: unknown;
        };
        if (typeof body.error === "string")
          return failure({ message: body.error });
      } catch {
        // Fall through to Supabase's safe generic error message.
      }
    }
    return failure(error);
  }
  if (
    !data ||
    typeof data.id !== "string" ||
    typeof data.email !== "string" ||
    typeof data.role_code !== "string"
  ) {
    return failure({ message: "The clinic account could not be created." });
  }
  return success({
    id: data.id,
    email: data.email,
    roleCode: data.role_code as CreatedClinicAccount["roleCode"],
  });
}

/** Organizations explicitly assigned to the current administrative user. */
export async function getAccessibleOrganizations(
  client: SupabaseClient<Database>,
  organizationIds: string[],
): Promise<SupabaseResult<PublicClinicSummary[]>> {
  if (!organizationIds.length) return success([]);
  const { data, error } = await client
    .from("organizations")
    .select(publicClinicSummaryColumns)
    .in("id", organizationIds)
    .order("name", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as PublicClinicSummary[]);
}

/** Explicitly enrolls the universal patient identity at a selected clinic. */
export async function enrollPatientAtClinic(
  client: SupabaseClient<Database>,
  organizationId: string,
  displayName: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("enroll_patient_at_clinic", {
    p_display_name: displayName.trim(),
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(data);
}

/** Sets the one clinic context enforced for this patient's direct RLS reads. */
export async function setPatientClinicContext(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("set_patient_clinic_context", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(undefined);
}

/** Active patients visible to front-desk RLS for administrative booking. */
export async function getOrganizationPatients(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<PatientSummary[]>> {
  const { data, error } = await client
    .from("patients")
    .select(patientSummaryColumns)
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) return failure(error);
  const rows = (data ?? []) as unknown as Array<
    Omit<PatientSummary, "displayName">
  >;
  return success(rows.map(toPatientSummary));
}

export type ProviderAppointmentSlotScope = "mine" | "clinic";

/** Availability visible to the current provider through PractitionerRole RLS. */
export async function getProviderAppointmentSlots(
  client: SupabaseClient<Database>,
  organizationId: string,
  options: { scope: ProviderAppointmentSlotScope; from?: Date },
): Promise<SupabaseResult<AppointmentSlotSummary[]>> {
  let practitionerRoleId: string | null = null;
  if (options.scope === "mine") {
    const roleResult = await getCurrentProviderRoleId(client, organizationId);
    if (roleResult.error) return failure(roleResult.error);
    practitionerRoleId = roleResult.data;
    if (!practitionerRoleId) {
      return failure({
        code: "PROVIDER_ROLE_REQUIRED",
        message: "An active doctor or specialist role is required to view your appointment slots.",
      });
    }
  } else {
    const permissionResult = await hasOrganizationPermission(
      client,
      organizationId,
      "can_manage_appointments",
    );
    if (permissionResult.error) return failure(permissionResult.error);
    if (!permissionResult.data) {
      return failure({
        code: "APPOINTMENT_SCOPE_FORBIDDEN",
        message: "Appointment management permission is required to view clinic-wide slots.",
      });
    }
  }

  let query = client
    .from("appointment_slots")
    .select(appointmentSlotSummaryColumns)
    .eq("organization_id", organizationId)
    .gte("start_at", (options.from ?? new Date()).toISOString());
  if (practitionerRoleId) {
    query = query.eq("practitioner_role_id", practitionerRoleId);
  }
  const { data, error } = await query.order("start_at", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as AppointmentSlotSummary[]);
}

/** The signed-in provider's persisted recurring hours for an organization. */
export async function getProviderWeeklyAvailability(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ProviderWeeklyAvailabilityRow[]>> {
  const { data, error } = await client
    .from("provider_weekly_availability")
    .select("*")
    .eq("organization_id", organizationId)
    .order("clinic_service_id", { ascending: true })
    .order("day_of_week", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as ProviderWeeklyAvailabilityRow[]);
}

export async function createAppointmentSlot(
  client: SupabaseClient<Database>,
  input: AppointmentSlotInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("create_appointment_slot", {
    p_clinic_service_id: input.clinicServiceId,
    p_end_at: input.endAt,
    p_start_at: input.startAt,
  });
  if (error) return failure(error);
  return success(data);
}

/** Creates consecutive, service-length slots across a provider-selected period. */
export async function createAppointmentSlotRange(
  client: SupabaseClient<Database>,
  input: AppointmentSlotInput,
): Promise<SupabaseResult<number>> {
  const { data, error } = await client.rpc("create_appointment_slot_range", {
    p_clinic_service_id: input.clinicServiceId,
    p_end_at: input.endAt,
    p_start_at: input.startAt,
  });
  if (error) return failure(error);
  return success(Number(data));
}

/** Saves a provider's recurring weekly hours and refreshes future free slots. */
export async function saveProviderWeeklyAvailability(
  client: SupabaseClient<Database>,
  clinicServiceId: string,
  windows: WeeklyAvailabilityWindow[],
): Promise<SupabaseResult<number>> {
  const { data, error } = await client.rpc(
    "save_provider_weekly_availability",
    {
      p_clinic_service_id: clinicServiceId,
      p_windows: windows.map((window) => ({
        day_of_week: window.dayOfWeek,
        start_time: window.startTime,
        end_time: window.endTime,
      })),
    },
  );
  if (error) return failure(error);
  return success(Number(data));
}

export async function setAppointmentSlotUnavailable(
  client: SupabaseClient<Database>,
  slotId: string,
  unavailable: boolean,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("set_appointment_slot_unavailable", {
    p_slot_id: slotId,
    p_unavailable: unavailable,
  });
  if (error) return failure(error);
  return success(undefined);
}

/** Atomically consumes a free slot. Staff may supply a patient; patients may not. */
export async function bookAppointmentSlot(
  client: SupabaseClient<Database>,
  slotId: string,
  patientId?: string,
  deliveryMode: AppointmentDeliveryMode = "in_person",
  organizationId?: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    ...(patientId ? { p_patient_id: patientId } : {}),
    p_delivery_mode: deliveryMode,
  });
  if (error) return failure(error);
  broadcastAppointmentBooked({
    appointmentId: data,
    organizationId,
    patientId,
    deliveryMode,
    status: "booked",
  });
  return success(data);
}

/** Patient-safe doctor cards for one bookable service. */
export async function getBookablePractitioners(
  client: SupabaseClient<Database>,
  serviceId: string,
): Promise<SupabaseResult<BookablePractitioner[]>> {
  const input = bookablePractitionerInputSchema.safeParse({ serviceId });
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data, error } = await client.rpc("bookable_practitioners", {
    p_service_id: input.data.serviceId,
  });
  if (error) return failure(error);
  const parsed = z.array(bookablePractitionerSchema).safeParse(data ?? []);
  return parsed.success
    ? success(parsed.data)
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

/** Patient-safe free slots for one required doctor and service. */
export async function getAvailableBookingSlots(
  client: SupabaseClient<Database>,
  input: AvailableBookingSlotsInput,
): Promise<SupabaseResult<AvailableBookingSlot[]>> {
  const parsedInput = availableBookingSlotsInputSchema.safeParse(input);
  if (!parsedInput.success)
    return failure({ code: "VALIDATION_ERROR", message: parsedInput.error.message });

  const { data, error } = await client.rpc("get_available_slots", {
    p_service_id: parsedInput.data.serviceId,
    p_practitioner_role_id: parsedInput.data.practitionerRoleId,
    p_date_range: `[${parsedInput.data.startsAt.toISOString()},${parsedInput.data.endsAt.toISOString()})`,
  });
  if (error) return failure(error);
  const parsed = z.array(availableBookingSlotSchema).safeParse(data ?? []);
  return parsed.success
    ? success(parsed.data)
    : failure({ code: "INVALID_RPC_OUTPUT", message: parsed.error.message });
}

/** Atomically reserves a selected doctor slot and creates its bill. */
export async function bookAppointment(
  client: SupabaseClient<Database>,
  slotId: string,
  deliveryMode: AppointmentDeliveryMode = "in_person",
  organizationId?: string,
): Promise<SupabaseResult<string>> {
  const input = bookAppointmentInputSchema.safeParse({ slotId, deliveryMode });
  if (!input.success)
    return failure({ code: "VALIDATION_ERROR", message: input.error.message });

  const { data, error } = await client.rpc("book_appointment", {
    p_slot_id: input.data.slotId,
    p_delivery_mode: input.data.deliveryMode,
  });
  if (error) {
    if (error.code === "PT409" && error.message === "SLOT_TAKEN") {
      return failure({
        code: "SLOT_TAKEN",
        message: "That appointment time was just taken. We refreshed the available times.",
      });
    }
    return failure(error);
  }
  broadcastAppointmentBooked({
    appointmentId: data,
    organizationId,
    deliveryMode: input.data.deliveryMode,
    status: "pending",
  });
  return success(data);
}

/** Virtual appointments visible only to their assigned patient or provider. */
export async function getTeleconsultAppointments(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<TeleconsultAppointment[]>> {
  const { data, error } = await client.rpc("list_teleconsult_appointments", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success((data ?? []) as TeleconsultAppointment[]);
}

/** Resolves the assigned clinic for a patient's own teleconsult deep link. */
export async function resolvePatientTeleconsultClinic(
  client: SupabaseClient<Database>,
  appointmentId: string,
): Promise<SupabaseResult<string | null>> {
  const { data, error } = await client.rpc(
    "resolve_patient_teleconsult_clinic",
    {
      p_appointment_id: appointmentId,
    },
  );
  return error ? failure(error) : success(data);
}

export async function closeTeleconsultRoom(
  client: SupabaseClient<Database>,
  appointmentId: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("close_teleconsult_room", {
    p_appointment_id: appointmentId,
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function getDoctorPayouts(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<DoctorPayoutSummary[]>> {
  const { data, error } = await client.rpc("list_doctor_payouts", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success((data ?? []) as DoctorPayoutSummary[]);
}

export async function setPractitionerPayoutRate(
  client: SupabaseClient<Database>,
  practitionerRoleId: string,
  shareBasisPoints: number,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("set_practitioner_payout_rate", {
    p_practitioner_role_id: practitionerRoleId,
    p_share_basis_points: shareBasisPoints,
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function settleDoctorPayouts(
  client: SupabaseClient<Database>,
  organizationId: string,
  payoutIds: string[],
  paymentReference: string,
): Promise<SupabaseResult<number>> {
  const { data, error } = await client.rpc("settle_doctor_payouts", {
    p_organization_id: organizationId,
    p_payout_ids: payoutIds,
    p_payment_reference: paymentReference,
  });
  if (error) return failure(error);
  return success(Number(data));
}

export interface DayRange {
  end: string;
  start: string;
}

/** Browser-local calendar day expressed as the UTC range required by Postgres. */
export function getLocalDayRange(date: Date = new Date()): DayRange {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getSpecificDayRange(dateInput: Date | string): DayRange {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getUpcomingDayRange(
  from: Date = new Date(),
  daysAhead = 60,
): DayRange {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Appointment queue visible through actor-specific Appointment RLS. */
export async function getDailyAppointmentQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  range?: DayRange | null,
  statuses: AppointmentStatus[] = [
    "booked",
    "arrived",
    "pending",
    "proposed",
    "fulfilled",
  ],
): Promise<SupabaseResult<AppointmentQueueItem[]>> {
  let query = client
    .from("appointments")
    .select(appointmentSummaryColumns)
    .eq("organization_id", organizationId);

  if (range) {
    query = query.gte("start_at", range.start).lt("start_at", range.end);
  } else if (range === null) {
    query = query.gte("start_at", new Date().toISOString());
  } else {
    const defaultRange = getLocalDayRange();
    query = query
      .gte("start_at", defaultRange.start)
      .lt("start_at", defaultRange.end);
  }

  const { data: appointments, error: appointmentError } = await query
    .in("status", statuses)
    .order("start_at", { ascending: true });
  if (appointmentError) return failure(appointmentError);

  const appointmentRows = (appointments ??
    []) as unknown as AppointmentSummary[];
  const patientIds = [...new Set(appointmentRows.map((row) => row.patient_id))];
  if (!patientIds.length) return success([]);
  const practitionerRoleIds = [
    ...new Set(
      appointmentRows
        .map((row) => row.practitioner_role_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const [patientResult, encounterResult, practitionerRoleResult] =
    await Promise.all([
      client.from("patients").select("id, name").in("id", patientIds),
      client
        .from("encounters")
        .select("id, appointment_id, status")
        .in(
          "appointment_id",
          appointmentRows.map((appointment) => appointment.id),
        ),
      practitionerRoleIds.length
        ? client
            .from("practitioner_roles")
            .select("id, practitioner_id")
            .eq("organization_id", organizationId)
            .eq("active", true)
            .in("id", practitionerRoleIds)
        : { data: [], error: null },
    ]);
  const { data: patients, error: patientError } = patientResult;
  if (patientError) return failure(patientError);
  const { data: encounters, error: encounterError } = encounterResult;
  if (encounterError) return failure(encounterError);
  const { data: practitionerRoles, error: practitionerRoleError } =
    practitionerRoleResult;
  if (practitionerRoleError) return failure(practitionerRoleError);

  const practitionerIds = [
    ...new Set(
      (practitionerRoles ?? []).map((role) => role.practitioner_id),
    ),
  ];
  const { data: practitioners, error: practitionerError } =
    practitionerIds.length
      ? await client
          .from("practitioners")
          .select("id, name")
          .eq("organization_id", organizationId)
          .eq("active", true)
          .in("id", practitionerIds)
      : { data: [], error: null };
  if (practitionerError) return failure(practitionerError);

  const encounterRows = encounters ?? [];
  const encounterIds = encounterRows.map((encounter) => encounter.id);
  const { data: triageObservations, error: triageError } = encounterIds.length
    ? await client
        .from("observations")
        .select("encounter_id")
        .in("encounter_id", encounterIds)
        .eq("code", "TRIAGE-VITALS")
        .eq("status", "final")
    : { data: [], error: null };
  if (triageError) return failure(triageError);

  const names = new Map(
    (patients ?? []).map((patient) => [
      patient.id,
      getHumanNameDisplay(patient.name),
    ]),
  );
  const practitionerIdsByRole = new Map(
    (practitionerRoles ?? []).map((role) => [role.id, role.practitioner_id]),
  );
  const practitionerNames = new Map(
    (practitioners ?? []).map((practitioner) => {
      const displayName = getHumanNameDisplay(practitioner.name);
      return [
        practitioner.id,
        displayName === "Unnamed patient"
          ? "Assigned doctor unavailable"
          : displayName,
      ];
    }),
  );
  const encounterStatuses = new Map(
    encounterRows.map((encounter) => [
      encounter.appointment_id,
      encounter.status,
    ]),
  );
  const triagedEncounterIds = new Set(
    (triageObservations ?? []).map((observation) => observation.encounter_id),
  );
  const triageStatusByAppointment = new Map(
    encounterRows.map((encounter) => [
      encounter.appointment_id,
      (triagedEncounterIds.has(encounter.id) ? "complete" : "pending") as
        "complete" | "pending",
    ]),
  );

  return success(
    appointmentRows.map((appointment) => ({
      ...appointment,
      assignedDoctorName:
        practitionerNames.get(
          appointment.practitioner_role_id
            ? (practitionerIdsByRole.get(appointment.practitioner_role_id) ?? "")
            : "",
        ) ?? "Assigned doctor unavailable",
      encounterStatus: encounterStatuses.get(appointment.id) ?? null,
      patientName: names.get(appointment.patient_id) ?? "Patient",
      triageStatus: triageStatusByAppointment.get(appointment.id) ?? "pending",
    })),
  );
}

export async function updateAppointmentStatus(
  client: SupabaseClient<Database>,
  appointmentId: string,
  status: "arrived" | "cancelled" | "noshow",
  organizationId?: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("update_appointment_status", {
    p_appointment_id: appointmentId,
    p_status: status,
  });
  if (error) return failure(error);
  broadcastAppointmentBooked({
    appointmentId,
    organizationId,
    status,
  });
  return success(undefined);
}

/** Cancels an appointment, with the option to retain/free the slot or block it. */
export async function cancelAppointment(
  client: SupabaseClient<Database>,
  appointmentId: string,
  blockSlot: boolean = false,
  organizationId?: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
    p_block_slot: blockSlot,
  });
  if (error) {
    const fallback = await client.rpc("update_appointment_status", {
      p_appointment_id: appointmentId,
      p_status: "cancelled",
    });
    if (fallback.error) return failure(fallback.error);
  }
  broadcastAppointmentBooked({
    appointmentId,
    organizationId,
    status: "cancelled",
  });
  return success(undefined);
}

export async function startAppointmentEncounter(
  client: SupabaseClient<Database>,
  appointmentId: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("start_appointment_encounter", {
    p_appointment_id: appointmentId,
  });
  if (error) return failure(error);
  return success(data);
}

export type RealtimeConnectionStatus =
  "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

/** Reusable live-queue pattern: RLS is evaluated for every Appointment event. */
export function subscribeToAppointmentQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
  onStatus?: (status: RealtimeConnectionStatus) => void,
): () => void {
  let isUnsubscribed = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerChange = () => {
    if (isUnsubscribed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!isUnsubscribed) {
        onChange();
      }
    }, 200);
  };

  const channelName = `appointment-queue:${organizationId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
  const channel = client.channel(channelName);

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments",
        filter: `organization_id=eq.${organizationId}`,
      },
      () => {
        triggerChange();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointment_slots",
        filter: `organization_id=eq.${organizationId}`,
      },
      () => {
        triggerChange();
      },
    )
    .subscribe((status) => {
      onStatus?.(status as RealtimeConnectionStatus);
    });

  let bc: BroadcastChannel | null = null;
  if (
    typeof window !== "undefined" &&
    typeof BroadcastChannel !== "undefined"
  ) {
    try {
      bc = new BroadcastChannel("odyssey_appointment_booking");
      bc.onmessage = (msgEvent) => {
        if (!msgEvent.data) return;
        const orgId = (msgEvent.data as AppointmentBookingEvent).organizationId;
        if (!orgId || orgId === organizationId) {
          triggerChange();
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }

  const handleStorage = (storageEvt: StorageEvent) => {
    if (storageEvt.key === "odyssey_booking_alert" && storageEvt.newValue) {
      try {
        const parsed = JSON.parse(storageEvt.newValue);
        if (
          !parsed.organizationId ||
          parsed.organizationId === organizationId
        ) {
          triggerChange();
        }
      } catch {
        triggerChange();
      }
    }
  };

  const handleCustom = (customEvt: Event) => {
    const detail = (customEvt as CustomEvent).detail;
    if (
      !detail ||
      !detail.organizationId ||
      detail.organizationId === organizationId
    ) {
      triggerChange();
    }
  };

  const handleVisibility = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      triggerChange();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    window.addEventListener("odyssey_booking_alert", handleCustom);
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
  }

  // Periodic heartbeat / polling fallback (every 10s while tab is visible)
  const pollInterval = setInterval(() => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      triggerChange();
    }
  }, 10_000);

  return () => {
    isUnsubscribed = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    clearInterval(pollInterval);
    void client.removeChannel(channel);
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("odyssey_booking_alert", handleCustom);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}

// PostgreSQL accepts any 8-4-4-4-12 hexadecimal UUID shape.  Keep this
// boundary aligned with the database instead of Zod 4's stricter RFC UUID
// variant/version check; hosted synthetic fixtures intentionally use stable
// UUID-shaped identifiers whose version bits are zeroed.
const postgresUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID",
);

export const roomAssignmentInputSchema = z.object({
  organizationId: postgresUuidSchema,
  practitionerRoleId: postgresUuidSchema,
  roomId: postgresUuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  shiftStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM."),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM."),
});

export type RoomAssignmentInput = z.infer<typeof roomAssignmentInputSchema>;

export interface RoomAssignmentDoctorOption {
  practitionerRoleId: string;
  displayName: string;
}

export interface RoomAssignmentGrid {
  rooms: ClinicRoomRow[];
  assignments: RoomAssignmentRow[];
  doctors: RoomAssignmentDoctorOption[];
}

export type ClinicCalendarRow = Database["public"]["Functions"]["list_clinic_calendar"]["Returns"][number];
export type DoctorManagementRow = Database["public"]["Functions"]["list_doctor_management"]["Returns"][number];

const clinicCalendarInputSchema = z.object({
  organizationId: postgresUuidSchema,
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  doctorRoleId: postgresUuidSchema.nullish(),
  clinicServiceId: postgresUuidSchema.nullish(),
});

/** Reads the permission-gated, patient-free week projection for clinic admins. */
export async function getClinicCalendar(
  client: SupabaseClient<Database>,
  input: z.input<typeof clinicCalendarInputSchema>,
): Promise<SupabaseResult<ClinicCalendarRow[]>> {
  const parsed = clinicCalendarInputSchema.safeParse(input);
  if (!parsed.success) return failure({ message: parsed.error.issues[0]?.message ?? "Invalid calendar filters." });
  const { organizationId, weekStart, doctorRoleId, clinicServiceId } = parsed.data;
  const { data, error } = await client.rpc("list_clinic_calendar", {
    p_organization_id: organizationId,
    p_week_start: weekStart,
    p_doctor_role_id: doctorRoleId ?? undefined,
    p_clinic_service_id: clinicServiceId ?? undefined,
  });
  if (error) return failure(error);
  return success(data ?? []);
}

/** Reads the organization-scoped doctor/service/room/queue management view. */
export async function getDoctorManagement(
  client: SupabaseClient<Database>,
  organizationId: string,
  date: string,
): Promise<SupabaseResult<DoctorManagementRow[]>> {
  const parsed = z.object({ organizationId: postgresUuidSchema, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.") }).safeParse({ organizationId, date });
  if (!parsed.success) return failure({ message: parsed.error.issues[0]?.message ?? "Invalid doctor management filters." });
  const { data, error } = await client.rpc("list_doctor_management", {
    p_organization_id: parsed.data.organizationId,
    p_date: parsed.data.date,
  });
  if (error) return failure(error);
  return success(data ?? []);
}

/** Loads the small, organization-scoped data set used by the admin room grid. */
export async function getRoomAssignmentGrid(
  client: SupabaseClient<Database>,
  organizationId: string,
  date: string,
): Promise<SupabaseResult<RoomAssignmentGrid>> {
  const parsedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date);
  if (!parsedDate.success) {
    return failure({ message: "Room assignment date must use YYYY-MM-DD." });
  }

  const [roomsResult, assignmentsResult, rolesResult] = await Promise.all([
    client
      .from("clinic_rooms")
      .select("id, organization_id, label, is_active, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("label"),
    client
      .from("room_assignments")
      .select("id, organization_id, practitioner_role_id, room_id, date, shift_start, shift_end, created_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("date", date)
      .order("shift_start"),
    client
      .from("practitioner_roles")
      .select("id, practitioner_id, active")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .in("role_code", ["doctor", "specialist"]),
  ]);

  if (roomsResult.error) return failure(roomsResult.error);
  if (assignmentsResult.error) return failure(assignmentsResult.error);
  if (rolesResult.error) return failure(rolesResult.error);

  const practitionerIds = (rolesResult.data ?? []).map((role) => role.practitioner_id);
  const practitionersResult = practitionerIds.length
    ? await client.from("practitioners").select("id, name").in("id", practitionerIds)
    : { data: [], error: null };
  if (practitionersResult.error) return failure(practitionersResult.error);

  const practitioners = new Map(
    (practitionersResult.data ?? []).map((practitioner) => [practitioner.id, practitioner.name]),
  );

  return success({
    rooms: (roomsResult.data ?? []) as ClinicRoomRow[],
    assignments: (assignmentsResult.data ?? []) as RoomAssignmentRow[],
    doctors: (rolesResult.data ?? []).map((role) => ({
      practitionerRoleId: role.id,
      displayName: practitioners.has(role.practitioner_id)
        ? getHumanNameDisplay(practitioners.get(role.practitioner_id)!)
        : "Practitioner",
    })),
  });
}

/** Creates or replaces one doctor's assignment for the selected day. */
export async function saveRoomAssignment(
  client: SupabaseClient<Database>,
  input: RoomAssignmentInput,
): Promise<SupabaseResult<RoomAssignmentRow>> {
  const parsed = roomAssignmentInputSchema.safeParse(input);
  if (!parsed.success) return failure({ message: parsed.error.issues[0]?.message ?? "Invalid room assignment." });

  const { organizationId, practitionerRoleId, roomId, date, shiftStart, shiftEnd } = parsed.data;
  const { error: deleteError } = await client
    .from("room_assignments")
    .delete()
    .eq("organization_id", organizationId)
    .eq("practitioner_role_id", practitionerRoleId)
    .eq("date", date);
  if (deleteError) return failure(deleteError);

  const { data, error } = await client
    .from("room_assignments")
    .insert({
      organization_id: organizationId,
      practitioner_role_id: practitionerRoleId,
      room_id: roomId,
      date,
      shift_start: shiftStart,
      shift_end: shiftEnd,
    })
    .select("id, organization_id, practitioner_role_id, room_id, date, shift_start, shift_end, created_at, updated_at")
    .single();
  if (error) return failure(error);
  return success(data as RoomAssignmentRow);
}

export interface AppointmentBookingEvent {
  appointmentId?: string;
  organizationId?: string;
  patientId?: string;
  deliveryMode?: string;
  serviceType?: string;
  startAt?: string;
  status?: string;
  timestamp?: number;
}

export function broadcastAppointmentBooked(
  event: Omit<AppointmentBookingEvent, "timestamp"> & { timestamp?: number },
): void {
  if (typeof window === "undefined") return;
  const payload: AppointmentBookingEvent = {
    ...event,
    timestamp: event.timestamp || Date.now(),
  };

  try {
    const channel = new BroadcastChannel("odyssey_appointment_booking");
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel unsupported
  }

  try {
    window.localStorage.setItem(
      "odyssey_booking_alert",
      JSON.stringify(payload),
    );
  } catch {
    // localStorage unavailable
  }

  try {
    window.dispatchEvent(
      new CustomEvent("odyssey_booking_alert", { detail: payload }),
    );
  } catch {
    // CustomEvent unavailable
  }
}

/**
 * Subscribes to real-time appointment booking events for both admin-web and provider-web.
 * Listens across:
 * 1. Supabase Realtime postgres_changes INSERT on appointments table.
 * 2. Cross-tab BroadcastChannel ("odyssey_appointment_booking").
 * 3. Cross-window storage events ("odyssey_booking_alert").
 * 4. In-window custom events ("odyssey_booking_alert").
 */
export function subscribeToAppointmentBookings(
  client: SupabaseClient<Database>,
  organizationId: string | null | undefined,
  onBooking: (event: AppointmentBookingEvent) => void,
  onStatus?: (status: RealtimeConnectionStatus) => void,
): () => void {
  // Deduplication cache with 10-second TTL
  const seenKeys = new Set<string>();
  const deliverEvent = (event: AppointmentBookingEvent) => {
    const key = event.appointmentId
      ? `id:${event.appointmentId}`
      : `ts:${Math.floor((event.timestamp || Date.now()) / 1000)}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    setTimeout(() => seenKeys.delete(key), 10_000);
    onBooking(event);
  };

  const channelName = `appointment-bookings:${organizationId || "global"}:${Date.now()}`;
  const channel = client.channel(channelName);

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "appointments",
      ...(organizationId
        ? { filter: `organization_id=eq.${organizationId}` }
        : {}),
    },
    (payload) => {
      const row = (payload.new || {}) as Record<string, unknown>;
      deliverEvent({
        appointmentId: typeof row.id === "string" ? row.id : undefined,
        organizationId:
          typeof row.organization_id === "string"
            ? row.organization_id
            : undefined,
        patientId:
          typeof row.patient_id === "string" ? row.patient_id : undefined,
        deliveryMode:
          typeof row.delivery_mode === "string" ? row.delivery_mode : undefined,
        serviceType:
          typeof row.service_type === "string" ? row.service_type : undefined,
        startAt: typeof row.start_at === "string" ? row.start_at : undefined,
        status: typeof row.status === "string" ? row.status : "booked",
        timestamp: Date.now(),
      });
    },
  );

  channel.subscribe((status) => {
    onStatus?.(status as RealtimeConnectionStatus);
  });

  let bc: BroadcastChannel | null = null;
  if (
    typeof window !== "undefined" &&
    typeof BroadcastChannel !== "undefined"
  ) {
    try {
      bc = new BroadcastChannel("odyssey_appointment_booking");
      bc.onmessage = (msgEvent) => {
        if (msgEvent.data && typeof msgEvent.data === "object") {
          deliverEvent(msgEvent.data as AppointmentBookingEvent);
        }
      };
    } catch {
      // ignore
    }
  }

  const handleStorage = (storageEvt: StorageEvent) => {
    if (storageEvt.key === "odyssey_booking_alert" && storageEvt.newValue) {
      try {
        const parsed = JSON.parse(storageEvt.newValue);
        deliverEvent(parsed);
      } catch {
        // ignore
      }
    }
  };

  const handleCustom = (customEvt: Event) => {
    const detail = (customEvt as CustomEvent).detail;
    if (detail && typeof detail === "object") {
      deliverEvent(detail as AppointmentBookingEvent);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    window.addEventListener("odyssey_booking_alert", handleCustom);
  }

  return () => {
    void client.removeChannel(channel);
    if (bc) {
      bc.close();
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("odyssey_booking_alert", handleCustom);
    }
  };
}

/** Public queue snapshot. Rows contain no patient name or patient identifier. */
export async function getWaitingRoomQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  date: Date = new Date(),
): Promise<SupabaseResult<WaitingRoomQueueItem[]>> {
  const queueDate = date.toISOString().slice(0, 10);
  const { data, error } = await client
    .from("waiting_room_queue")
    .select(waitingRoomQueueColumns)
    .eq("organization_id", organizationId)
    .eq("queue_date", queueDate)
    .order("queue_number", { ascending: true });
  if (error) return failure(error);
  return success((data ?? []) as unknown as WaitingRoomQueueItem[]);
}

export function subscribeToWaitingRoomQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
  onStatus?: (status: RealtimeConnectionStatus) => void,
): () => void {
  const channel = client
    .channel(`waiting-room:${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "waiting_room_queue",
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    )
    .subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

/** Calls the PIN-protected Edge Function and validates its response shape. */
export async function getWalkInPatientRecords(
  client: SupabaseClient<Database>,
  credentials: WalkInAccessInput,
): Promise<SupabaseResult<WalkInAccessRecords>> {
  const { data, error } = await client.functions.invoke("get-walk-in-records", {
    body: {
      organization_id: credentials.organizationId,
      walk_in_id: credentials.walkInId,
      pin: credentials.pin,
    },
  });
  if (error) return failure(error);
  if (!isWalkInAccessRecords(data))
    return failure({
      message: "Walk-in access returned an invalid record response.",
    });
  return success(data);
}

function isWalkInAccessRecords(value: unknown): value is WalkInAccessRecords {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return (
    Array.isArray(response.patients) &&
    Array.isArray(response.appointments) &&
    Array.isArray(response.encounters) &&
    Array.isArray(response.observations)
  );
}

/* â”€â”€â”€ Loop 5: Financial functions â”€â”€â”€ */

export async function getBillingWorkspace(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<BillingWorkspace>> {
  const { data, error } = await client.rpc("get_billing_workspace", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  const workspace = data as unknown as BillingWorkspace;
  return success({
    billing_events: workspace?.billing_events ?? [],
    invoices: workspace?.invoices ?? [],
    recent_payments: workspace?.recent_payments ?? [],
    pos_sales: workspace?.pos_sales ?? [],
  });
}

export async function getBillableEncounters(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<BillableEncounter[]>> {
  const { data, error } = await client.rpc("get_billable_encounters", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(
    ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      patient_id: row.patient_id as string,
      patient_name: row.patient_name as string,
      appointment_id: (row.appointment_id as string) ?? null,
      service_type: (row.service_type as string) ?? null,
      period_start: (row.period_start as string) ?? null,
      period_end: (row.period_end as string) ?? null,
      status: row.status as BillableEncounter["status"],
      service_name: (row.service_name as string) ?? null,
      service_price:
        row.service_price != null ? Number(row.service_price) : null,
    })),
  );
}

export async function getBillingLineItems(
  client: SupabaseClient<Database>,
  billingEventId: string,
): Promise<SupabaseResult<BillingLineItemSummary[]>> {
  const { data, error } = await client.rpc("get_billing_line_items", {
    p_billing_event_id: billingEventId,
  });
  if (error) return failure(error);
  return success(
    ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      source_type: row.source_type as BillingLineItemSummary["source_type"],
      source_id: (row.source_id as string) ?? null,
      description: row.description as string,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      currency: row.currency as string,
      line_total: Number(row.line_total),
      payment_status:
        (row.payment_status as BillingLineItemSummary["payment_status"]) ??
        "unpaid",
      billing_mode:
        (row.billing_mode as BillingLineItemSummary["billing_mode"]) ?? null,
      payor_type:
        (row.payor_type as BillingLineItemSummary["payor_type"]) ?? null,
      tagged_at: (row.tagged_at as string) ?? null,
      void_reason: (row.void_reason as string) ?? null,
    })),
  );
}

export async function generateBillingEvent(
  client: SupabaseClient<Database>,
  organizationId: string,
  encounterId: string,
  payorTypeOverride?: PayorType,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("generate_billing_event", {
    p_organization_id: organizationId,
    p_encounter_id: encounterId,
    p_payor_type_override: payorTypeOverride,
  });
  if (error) return failure(error);
  return success(data as string);
}

export async function finalizeBillingEvent(
  client: SupabaseClient<Database>,
  billingEventId: string,
): Promise<
  SupabaseResult<{ route: string; invoice_id?: string; claim_id?: string }>
> {
  const { data, error } = await client.rpc("finalize_billing_event", {
    p_billing_event_id: billingEventId,
  });
  if (error) return failure(error);
  return success(
    data as unknown as {
      route: string;
      invoice_id?: string;
      claim_id?: string;
    },
  );
}

export async function recordPayment(
  client: SupabaseClient<Database>,
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  reference?: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("record_payment", {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_method: method,
    p_reference: reference,
  });
  if (error) return failure(error);
  return success(data as string);
}

export async function createPaymentAttempt(
  client: SupabaseClient<Database>,
  invoiceId: string,
  method: PaymentMethod,
  reference?: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "create_payment_attempt" as never,
    {
      p_invoice_id: invoiceId,
      p_method: method,
      p_reference: reference ?? null,
    } as never,
  );
  return error ? failure(error) : success(data as string);
}

export async function confirmPaymentAttempt(
  client: SupabaseClient<Database>,
  paymentId: string,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "confirm_payment_attempt" as never,
    {
      p_payment_id: paymentId,
    } as never,
  );
  return error ? failure(error) : success(data as string);
}

export async function resolveInvoiceQr(
  client: SupabaseClient<Database>,
  payload: string,
): Promise<SupabaseResult<InvoiceQrResolution>> {
  const { data, error } = await client.rpc(
    "resolve_invoice_qr" as never,
    {
      p_qr_payload: payload,
    } as never,
  );
  return error
    ? failure(error)
    : success(data as unknown as InvoiceQrResolution);
}

export async function getInvoiceDetail(
  client: SupabaseClient<Database>,
  invoiceId: string,
): Promise<SupabaseResult<InvoiceDetail>> {
  const { data, error } = await client.rpc(
    "get_invoice_detail" as never,
    {
      p_invoice_id: invoiceId,
    } as never,
  );
  return error ? failure(error) : success(data as unknown as InvoiceDetail);
}

export async function getVisitInvoiceQr(
  client: SupabaseClient<Database>,
  invoiceId: string,
): Promise<
  SupabaseResult<{ payload: string; expires_at: string; invoice_id: string }>
> {
  const { data, error } = await client.rpc(
    "get_visit_invoice_qr" as never,
    {
      p_invoice_id: invoiceId,
    } as never,
  );
  return error
    ? failure(error)
    : success(
        data as unknown as {
          payload: string;
          expires_at: string;
          invoice_id: string;
        },
      );
}

export async function voidBillingLineItem(
  client: SupabaseClient<Database>,
  lineItemId: string,
  reason: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc(
    "void_billing_line_item" as never,
    {
      p_line_item_id: lineItemId,
      p_reason: reason,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function createPosSale(
  client: SupabaseClient<Database>,
  organizationId: string,
  items: PosCartItem[],
  customerName?: string,
  paymentMethod?: PaymentMethod,
): Promise<SupabaseResult<PosCheckoutResult>> {
  const { data, error } = await client.rpc("create_pos_sale", {
    p_organization_id: organizationId,
    p_items: items as unknown as Json,
    p_customer_name: customerName,
    p_payment_method: paymentMethod ?? "cash",
  });
  if (error) return failure(error);
  return success(data as unknown as PosCheckoutResult);
}

export async function getPatientInvoices(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<PatientInvoice[]>> {
  const { data, error } = await client.rpc("get_patient_invoices", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success((data ?? []) as unknown as PatientInvoice[]);
}

export async function getClaimsWorkspace(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ClaimSummary[]>> {
  const { data, error } = await client.rpc("get_claims_workspace", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success((data ?? []) as unknown as ClaimSummary[]);
}

export async function submitClaim(
  client: SupabaseClient<Database>,
  claimId: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("submit_claim", {
    p_claim_id: claimId,
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function adjudicateClaim(
  client: SupabaseClient<Database>,
  claimId: string,
  result: "approved" | "denied" | "partial",
  approvedAmount?: number,
  deniedReason?: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("adjudicate_claim", {
    p_claim_id: claimId,
    p_result: result,
    p_approved_amount: approvedAmount,
    p_denied_reason: deniedReason,
  });
  if (error) return failure(error);
  return success(undefined);
}

export function subscribeToInvoiceUpdates(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: () => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client
    .channel(`invoices:${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "invoices",
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    )
    .subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

/* Loop 7: Platform and Governance */

export async function getGovernanceDashboard(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<GovernanceDashboard>> {
  const { data, error } = await client.rpc(
    "get_governance_dashboard" as never,
    { p_organization_id: organizationId } as never,
  );
  if (error) return failure(error);
  const row = ((data as unknown as Array<Record<string, unknown>>) ?? [])[0];
  if (!row) return failure({ message: "The analytics response was empty." });
  return success({
    activePatients: Number(row.active_patients),
    appointmentsToday: Number(row.appointments_today),
    waitingNow: Number(row.waiting_now),
    completedEncounters30d: Number(row.completed_encounters_30d),
    outstandingInvoices: Number(row.outstanding_invoices),
    outstandingBalance: Number(row.outstanding_balance),
    confirmedRevenue30d: Number(row.confirmed_revenue_30d),
    activeStaff: Number(row.active_staff),
    auditEvents24h: Number(row.audit_events_24h),
  });
}

export async function getGovernancePatients(
  client: SupabaseClient<Database>,
  organizationId: string,
  search = "",
): Promise<SupabaseResult<GovernancePatientSummary[]>> {
  const { data, error } = await client.rpc(
    "list_governance_patients" as never,
    { p_organization_id: organizationId, p_search: search } as never,
  );
  if (error) return failure(error);
  return success(
    ((data as unknown as Array<Record<string, unknown>>) ?? []).map((row) => ({
      patientId: row.patient_id as string,
      displayName: row.display_name as string,
      walkInId: (row.walk_in_id as string) ?? null,
      birthDate: (row.birth_date as string) ?? null,
      gender: (row.gender as string) ?? null,
      telecom: row.telecom as Json,
      active: Boolean(row.active),
      encounterCount: Number(row.encounter_count),
      appointmentCount: Number(row.appointment_count),
      lastActivityAt: row.last_activity_at as string,
    })),
  );
}

export async function getGovernancePatientRecord(
  client: SupabaseClient<Database>,
  organizationId: string,
  patientId: string,
): Promise<SupabaseResult<GovernancePatientRecord>> {
  const { data, error } = await client.rpc(
    "get_governance_patient_record" as never,
    { p_organization_id: organizationId, p_patient_id: patientId } as never,
  );
  if (error) return failure(error);
  return success(data as unknown as GovernancePatientRecord);
}

export function createPatientQrPayload(
  organizationId: string,
  patientId: string,
): string {
  return `ODYSSEY|${organizationId}|${patientId}`;
}

export async function identifyPatientByQr(
  client: SupabaseClient<Database>,
  organizationId: string,
  payload: string,
): Promise<SupabaseResult<IdentifiedPatient>> {
  const { data, error } = await client.rpc(
    "identify_patient_by_qr" as never,
    { p_organization_id: organizationId, p_payload: payload } as never,
  );
  if (error) return failure(error);
  const row = ((data as unknown as Array<Record<string, unknown>>) ?? [])[0];
  if (!row)
    return failure({ message: "No active patient matches this QR code." });
  return success({
    patientId: row.patient_id as string,
    displayName: row.display_name as string,
    walkInId: (row.walk_in_id as string) ?? null,
    birthDate: (row.birth_date as string) ?? null,
    gender: (row.gender as string) ?? null,
  });
}

export async function importGovernancePatients(
  client: SupabaseClient<Database>,
  organizationId: string,
  fileName: string,
  rows: GovernancePatientImportRow[],
): Promise<SupabaseResult<ImportedPatientCredential[]>> {
  const { data, error } = await client.rpc(
    "import_governance_patients" as never,
    {
      p_organization_id: organizationId,
      p_file_name: fileName,
      p_rows: rows as unknown as Json,
    } as never,
  );
  if (error) return failure(error);
  return success(
    ((data as unknown as Array<Record<string, unknown>>) ?? []).map((row) => ({
      patientId: (row.patient_id as string) ?? "",
      rowNumber: Number(row.row_number),
      displayName: row.display_name as string,
      walkInId: (row.walk_in_id as string) ?? null,
      pin: (row.pin as string) ?? null,
      error: (row.error as string) ?? null,
      birthDate: null,
      gender: null,
    })),
  );
}

export async function getPatientAuditTrail(
  client: SupabaseClient<Database>,
  organizationId: string,
  patientId?: string,
  limit = 100,
): Promise<SupabaseResult<PatientAuditEvent[]>> {
  const { data, error } = await client.rpc(
    "list_patient_audit_trail" as never,
    {
      p_organization_id: organizationId,
      p_patient_id: patientId ?? null,
      p_limit: limit,
    } as never,
  );
  if (error) return failure(error);
  return success(
    ((data as unknown as Array<Record<string, unknown>>) ?? []).map((row) => ({
      id: row.id as string,
      occurredAt: row.occurred_at as string,
      actorName: row.actor_name as string,
      actorType: row.actor_type as string,
      action: row.action as string,
      resourceType: row.resource_type as string,
      recordId: row.record_id as string,
      metadata: row.metadata as Json,
    })),
  );
}

export type { ClinicOperationsLogEntry, ClinicOperationsLogFilters };

export async function listClinicOperationsLogs(
  client: SupabaseClient<Database>,
  organizationId: string,
  filters?: ClinicOperationsLogFilters,
): Promise<SupabaseResult<ClinicOperationsLogEntry[]>> {
  const { data, error } = await client.rpc(
    "list_clinic_operations_logs" as never,
    {
      p_organization_id: organizationId,
      p_module: filters?.module ?? null,
      p_action: filters?.action ?? null,
      p_actor_id: filters?.actorId ?? null,
      p_start_time: filters?.startTime ?? null,
      p_end_time: filters?.endTime ?? null,
      p_search: filters?.search ?? null,
      p_limit: filters?.limit ?? 100,
      p_offset: filters?.offset ?? 0,
    } as never,
  );
  if (error) return failure(error);
  return success(
    ((data as unknown as Array<Record<string, unknown>>) ?? []).map((row) => ({
      id: typeof row.id === "number" ? row.id : String(row.id),
      occurredAt: String(row.occurred_at),
      actorId: (row.actor_id as string | null) ?? null,
      actorName: String(row.actor_name || "Unknown Operator"),
      actorType: String(row.actor_type || "system"),
      module: String(row.module || "governance"),
      action: String(row.action),
      tableName: String(row.table_name),
      recordId: (row.record_id as string | null) ?? null,
      description: String(row.description || ""),
      metadata: (row.metadata as Json) ?? {},
    })),
  );
}

export async function getOrganizationBranding(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<OrganizationBranding>> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("organization_branding")
    .select("*")
    .eq("organization_id", organizationId)
    .single();
  if (error) return failure(error);
  return success({
    id: data.id as string,
    organizationId: data.organization_id as string,
    displayName: data.display_name as string,
    tagline: (data.tagline as string) ?? null,
    logoUrl: (data.logo_url as string) ?? null,
    primaryColor: (data.primary_color as string) || "#087f7a",
    accentColor: (data.accent_color as string) || "#087f7a",
    supportEmail: (data.support_email as string) ?? null,
    supportPhone: (data.support_phone as string) ?? null,
    clinicVisitMessage: (data.clinic_visit_message as string) ?? null,
    teleconsultMessage: (data.teleconsult_message as string) ?? null,
    bookingConfirmationMessage:
      (data.booking_confirmation_message as string) ?? null,
  });
}

export async function saveOrganizationBranding(
  client: SupabaseClient<Database>,
  organizationId: string,
  input: OrganizationBrandingInput,
): Promise<SupabaseResult<string>> {
  const untyped = client as unknown as SupabaseClient;
  const updatePayload: Record<string, unknown> = {
    display_name: input.displayName,
    tagline: input.tagline ?? "",
    logo_url: input.logoUrl ?? "",
    primary_color: input.primaryColor,
    accent_color: input.accentColor,
    support_email: input.supportEmail ?? "",
    support_phone: input.supportPhone ?? "",
  };
  if (input.clinicVisitMessage !== undefined)
    updatePayload.clinic_visit_message = input.clinicVisitMessage;
  if (input.teleconsultMessage !== undefined)
    updatePayload.teleconsult_message = input.teleconsultMessage;
  if (input.bookingConfirmationMessage !== undefined)
    updatePayload.booking_confirmation_message =
      input.bookingConfirmationMessage;

  const { error: directError } = await untyped
    .from("organization_branding")
    .update(updatePayload)
    .eq("organization_id", organizationId);

  if (!directError) {
    await untyped
      .from("organizations")
      .update({ name: input.displayName })
      .eq("id", organizationId);
    return success(organizationId);
  }

  const { data, error } = await client.rpc(
    "save_organization_branding" as never,
    {
      p_organization_id: organizationId,
      p_display_name: input.displayName,
      p_tagline: input.tagline ?? "",
      p_logo_url: input.logoUrl ?? "",
      p_primary_color: input.primaryColor,
      p_accent_color: input.accentColor,
      p_support_email: input.supportEmail ?? "",
      p_support_phone: input.supportPhone ?? "",
      p_clinic_visit_message: input.clinicVisitMessage ?? "",
      p_teleconsult_message: input.teleconsultMessage ?? "",
      p_booking_confirmation_message: input.bookingConfirmationMessage ?? "",
    } as never,
  );
  return error ? failure(error) : success(data as unknown as string);
}

export async function getOrganizationFacilityClassification(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<FacilityClassification>> {
  const { data, error } = await client.rpc(
    "get_organization_facility_classification",
    {
      p_organization_id: organizationId,
    },
  );

  if (!error && data) {
    const res = data as unknown as {
      organization_id: string;
      default_payor_type: PayorType;
      is_government_no_billing: boolean;
      can_manage: boolean;
    };
    return success({
      organizationId: res.organization_id,
      defaultPayorType: res.default_payor_type,
      isGovernmentNoBilling: res.is_government_no_billing,
      canManage: res.can_manage,
    });
  }

  // Graceful fallback to direct organizations table query if RPC is not yet in PostgREST cache
  const untyped = client as unknown as SupabaseClient;
  const { data: org, error: orgError } = await untyped
    .from("organizations")
    .select("id, default_payor_type")
    .eq("id", organizationId)
    .single();

  if (orgError) return failure(orgError);

  const payorType = (org.default_payor_type as PayorType) || "self_pay";

  // Check admin role via user_roles or platform_admins
  let canManage = false;
  const { data: userData } = await client.auth.getUser();
  if (userData?.user?.id) {
    const { data: userRoles } = await untyped
      .from("user_roles")
      .select("id, role_id")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id);

    if (userRoles && Array.isArray(userRoles) && userRoles.length > 0) {
      const roleIds = userRoles.map((r: { role_id: string }) => r.role_id);
      const { data: roles } = await untyped
        .from("roles")
        .select("name")
        .in("id", roleIds);
      canManage = Boolean(
        roles?.some(
          (r: { name: string }) => r.name === "admin" || r.name === "owner",
        ),
      );
    }

    if (!canManage) {
      const { data: platformAdmin } = await untyped
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      canManage = Boolean(platformAdmin);
    }
  }

  return success({
    organizationId: org.id as string,
    defaultPayorType: payorType,
    isGovernmentNoBilling: payorType === "philhealth_nbb",
    canManage,
  });
}

export const getOrganizationFacilityContext = getOrganizationFacilityClassification;

export async function setOrganizationFacilityClassification(
  client: SupabaseClient<Database>,
  organizationId: string,
  payorType: PayorType,
): Promise<
  SupabaseResult<{
    organizationId: string;
    defaultPayorType: PayorType;
    isGovernmentNoBilling: boolean;
  }>
> {
  const { data, error } = await client.rpc(
    "set_organization_facility_classification",
    {
      p_organization_id: organizationId,
      p_payor_type: payorType,
    },
  );

  if (!error && data) {
    const res = data as unknown as {
      organization_id: string;
      default_payor_type: PayorType;
      is_government_no_billing: boolean;
    };
    return success({
      organizationId: res.organization_id,
      defaultPayorType: res.default_payor_type,
      isGovernmentNoBilling: res.is_government_no_billing,
    });
  }

  // Graceful fallback to direct organizations table update
  // The database RLS policy organizations_manage strictly verifies that only
  // admins/owners of this organization (or superadmins) can perform updates.
  const untyped = client as unknown as SupabaseClient;
  const { error: updateError } = await untyped
    .from("organizations")
    .update({
      default_payor_type: payorType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (updateError) return failure(updateError);

  return success({
    organizationId,
    defaultPayorType: payorType,
    isGovernmentNoBilling: payorType === "philhealth_nbb",
  });
}

function toOrganizationBillingProfile(data: unknown): OrganizationBillingProfile {
  const row = data as {
    organization_id: string;
    facility_type: FacilityType;
    ownership: FacilityOwnership;
    balance_billing_policy: BalanceBillingPolicy;
    hci_accreditation_number: string | null;
    can_manage: boolean;
  };
  return {
    organizationId: row.organization_id,
    facilityType: row.facility_type,
    ownership: row.ownership,
    balanceBillingPolicy: row.balance_billing_policy,
    hciAccreditationNumber: row.hci_accreditation_number,
    canManage: row.can_manage,
  };
}

export async function getOrganizationBillingProfile(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<OrganizationBillingProfile>> {
  const { data, error } = await client.rpc("get_organization_billing_profile", {
    p_organization_id: organizationId,
  });
  if (error) return failure(error);
  return success(toOrganizationBillingProfile(data));
}

export async function setOrganizationBillingProfile(
  client: SupabaseClient<Database>,
  organizationId: string,
  profile: Pick<
    OrganizationBillingProfile,
    "facilityType" | "ownership" | "balanceBillingPolicy" | "hciAccreditationNumber"
  >,
): Promise<SupabaseResult<OrganizationBillingProfile>> {
  const { data, error } = await client.rpc("set_organization_billing_profile", {
    p_organization_id: organizationId,
    p_facility_type: profile.facilityType,
    p_ownership: profile.ownership,
    p_balance_billing_policy: profile.balanceBillingPolicy,
    p_hci_accreditation_number: profile.hciAccreditationNumber ?? undefined,
  });
  if (error) return failure(error);
  return success(toOrganizationBillingProfile(data));
}

/** Data for a claim's Statement of Account, Itemized Charges and Claim Signature Form. */
export async function getPhilhealthClaimDocument(
  client: SupabaseClient<Database>,
  claimId: string,
): Promise<SupabaseResult<PhilhealthClaimDocument>> {
  const { data, error } = await client.rpc("get_philhealth_claim_document", {
    p_claim_id: claimId,
  });
  if (error) return failure(error);
  return success(data as unknown as PhilhealthClaimDocument);
}

/** Records or updates the patient's active PhilHealth coverage; the PIN is stored as NN-NNNNNNNNN-N. */
export async function savePatientPhilhealthCoverage(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    patientId: string;
    philhealthId: string;
    category: PhilhealthMemberCategory;
    relationship?: "self" | "spouse" | "child" | "parent";
    eligibilityReference?: string | null;
  },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("save_patient_philhealth_coverage", {
    p_organization_id: input.organizationId,
    p_patient_id: input.patientId,
    p_philhealth_id: input.philhealthId,
    p_category: input.category,
    p_beneficiary_relationship: input.relationship ?? "self",
    p_eligibility_reference: input.eligibilityReference ?? undefined,
  });
  if (error) return failure(error);
  return success(data);
}

export async function listEncounterConditions(
  client: SupabaseClient<Database>,
  encounterId: string,
): Promise<SupabaseResult<EncounterCondition[]>> {
  const { data, error } = await client.rpc("list_encounter_conditions", {
    p_encounter_id: encounterId,
  });
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      codeDisplay: row.code_display,
      diagnosisRank: row.diagnosis_rank,
      verificationStatus: row.verification_status as EncounterCondition["verificationStatus"],
      caseRate: row.case_rate,
      recordedByName: row.recorded_by_name,
      createdAt: row.created_at,
    })),
  );
}

/** Records an Annex A ICD-10 diagnosis on an encounter; rank 1 is the final diagnosis used for claims. */
export async function recordEncounterCondition(
  client: SupabaseClient<Database>,
  input: { encounterId: string; icd10Code: string; diagnosisRank?: number },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc("record_encounter_condition", {
    p_encounter_id: input.encounterId,
    p_icd10_code: input.icd10Code,
    p_diagnosis_rank: input.diagnosisRank ?? 1,
  });
  if (error) return failure(error);
  return success(data);
}

export async function removeEncounterCondition(
  client: SupabaseClient<Database>,
  conditionId: string,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc("remove_encounter_condition", {
    p_condition_id: conditionId,
  });
  if (error) return failure(error);
  return success(undefined);
}

export async function getDocumentTemplates(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<DocumentTemplate[]>> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("document_templates")
    .select(
      "id, organization_id, code, name, category, description, body, version, active, updated_at",
    )
    .eq("organization_id", organizationId)
    .order("name");
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => ({
      id: row.id as string,
      organizationId: row.organization_id as string,
      code: row.code as string,
      name: row.name as string,
      category: row.category as DocumentTemplate["category"],
      description: (row.description as string) ?? null,
      body: row.body as string,
      version: Number(row.version),
      active: Boolean(row.active),
      updatedAt: row.updated_at as string,
    })),
  );
}

function asTemplateContent(
  value: unknown,
): ClinicalDocumentTemplate["content"] {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const brandingRecord =
    record.branding &&
    typeof record.branding === "object" &&
    !Array.isArray(record.branding)
      ? (record.branding as Record<string, unknown>)
      : null;
  const branding =
    brandingRecord &&
    (brandingRecord.source === "none" ||
      brandingRecord.source === "personal" ||
      brandingRecord.source === "clinic")
      ? {
          source: brandingRecord.source as "none" | "personal" | "clinic",
          ...(typeof brandingRecord.headerLogoPath === "string"
            ? { headerLogoPath: brandingRecord.headerLogoPath }
            : {}),
          ...(typeof brandingRecord.watermarkPath === "string"
            ? { watermarkPath: brandingRecord.watermarkPath }
            : {}),
        }
      : undefined;
  const certificate =
    record.certificate &&
    typeof record.certificate === "object" &&
    !Array.isArray(record.certificate)
      ? (record.certificate as Record<string, unknown>)
      : null;
  const medications = Array.isArray(record.medications)
    ? record.medications.flatMap((line) => {
        if (!line || typeof line !== "object" || Array.isArray(line)) return [];
        const item = line as Record<string, unknown>;
        return [
          {
            name: typeof item.name === "string" ? item.name : "",
            dosage: typeof item.dosage === "string" ? item.dosage : "",
            frequency: typeof item.frequency === "string" ? item.frequency : "",
            duration: typeof item.duration === "string" ? item.duration : "",
            notes: typeof item.notes === "string" ? item.notes : "",
          },
        ];
      })
    : [];
  return {
    html: typeof record.html === "string" ? record.html : "",
    medications,
    ...(branding ? { branding } : {}),
    ...(certificate
      ? {
          certificate: {
            variant:
              certificate.variant === "fitness_to_work" ||
              certificate.variant === "fitness_to_travel"
                ? certificate.variant
                : "general",
            remarks:
              typeof certificate.remarks === "string"
                ? certificate.remarks
                : "",
            restDays:
              typeof certificate.restDays === "string"
                ? certificate.restDays
                : "",
          },
        }
      : {}),
  };
}

/** Shared PhilHealth reference data is global read-only lookup data, never tenant-owned. */
export async function searchIcd10Reference(
  client: SupabaseClient<Database>,
  query: string,
): Promise<SupabaseResult<Icd10ReferenceCondition[]>> {
  const { data, error } = await client.rpc(
    "search_icd10_reference" as never,
    { p_query: query } as never,
  );
  if (error) return failure(error);
  return success(
    (Array.isArray(data) ? data : []).flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const item = row as Record<string, unknown>;
      return typeof item.code === "string" &&
        typeof item.description === "string"
        ? [
            {
              code: item.code,
              description: item.description,
              category:
                typeof item.category === "string" ? item.category : null,
            },
          ]
        : [];
    }),
  );
}

export async function getClinicalTemplateAssetContext(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  SupabaseResult<{ practitionerId: string; clinicLogoUrl: string | null }>
> {
  const { data, error } = await client.rpc(
    "get_clinical_template_asset_context" as never,
    { p_organization_id: organizationId } as never,
  );
  if (error) return failure(error);
  const row =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  if (typeof row.practitionerId !== "string")
    return failure({
      message: "Template asset context is unavailable.",
    } as never);
  return success({
    practitionerId: row.practitionerId,
    clinicLogoUrl:
      typeof row.clinicLogoUrl === "string" ? row.clinicLogoUrl : null,
  });
}

export async function getClinicalDocumentTemplates(
  client: SupabaseClient<Database>,
  organizationId: string,
  type?: ClinicalDocumentTemplateType,
): Promise<SupabaseResult<ClinicalDocumentTemplate[]>> {
  const untyped = client as unknown as SupabaseClient;
  let query = untyped
    .from("document_templates")
    .select(
      "id, organization_id, owner_doctor_id, category, name, condition_system, condition_code, condition_display, structured_body, is_default, status, version, updated_at",
    )
    .eq("organization_id", organizationId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });
  if (type) query = query.eq("category", type);
  const { data, error } = await query;
  if (error) return failure(error);
  return success(toClinicalDocumentTemplates(data ?? []));
}

/**
 * Reads the published templates the current doctor can use for one encounter.
 * The RPC binds visibility to the encounter's organization so a clinician never
 * relies on a broad template table read or a selected organization from the UI.
 */
export async function getEncounterClinicalDocumentTemplates(
  client: SupabaseClient<Database>,
  encounterId: string,
  type: ClinicalDocumentTemplateType,
): Promise<SupabaseResult<ClinicalDocumentTemplate[]>> {
  const { data, error } = await client.rpc(
    "list_encounter_clinical_document_templates" as never,
    {
      p_encounter_id: encounterId,
      p_type: type,
    } as never,
  );
  if (error) return failure(error);
  return success(toClinicalDocumentTemplates((data ?? []) as unknown[]));
}

function toClinicalDocumentTemplates(
  rows: unknown[],
): ClinicalDocumentTemplate[] {
  return rows.flatMap((value) => {
    const row =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    const templateType = row.category;
    if (
      templateType !== "medical_certificate" &&
      templateType !== "prescription"
    )
      return [];
    return [
      {
        id: row.id as string,
        organizationId: row.organization_id as string,
        ownerDoctorId: row.owner_doctor_id as string | null,
        type: templateType,
        title: row.name as string,
        conditionSystem: row.condition_system as string | null,
        conditionCode: row.condition_code as string | null,
        conditionDisplay: row.condition_display as string | null,
        content: asTemplateContent(row.structured_body),
        isDefault: Boolean(row.is_default),
        status: row.status as ClinicalDocumentTemplate["status"],
        version: Number(row.version),
        updatedAt: row.updated_at as string,
      },
    ];
  });
}

export async function saveClinicalDocumentTemplate(
  client: SupabaseClient<Database>,
  organizationId: string,
  input: ClinicalDocumentTemplateInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_clinical_document_template" as never,
    {
      p_organization_id: organizationId,
      p_template_id: input.id ?? null,
      p_type: input.type,
      p_title: input.title,
      p_scope: input.scope,
      p_condition_system: input.conditionSystem ?? null,
      p_condition_code: input.conditionCode ?? null,
      p_condition_display: input.conditionDisplay ?? null,
      p_structured_body: input.content as unknown as Json,
      p_is_default: input.isDefault,
      p_status: input.status,
    } as never,
  );
  return error ? failure(error) : success(data as unknown as string);
}

export async function archiveClinicalDocumentTemplate(
  client: SupabaseClient<Database>,
  organizationId: string,
  templateId: string,
): Promise<SupabaseResult<void>> {
  const { error } = await client.rpc(
    "archive_clinical_document_template" as never,
    {
      p_organization_id: organizationId,
      p_template_id: templateId,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function getEncounterTemplateContext(
  client: SupabaseClient<Database>,
  encounterId: string,
): Promise<SupabaseResult<EncounterTemplateContext>> {
  const { data, error } = await client.rpc(
    "get_encounter_template_context" as never,
    {
      p_encounter_id: encounterId,
    } as never,
  );
  if (error) return failure(error);
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const values =
    record.values &&
    typeof record.values === "object" &&
    !Array.isArray(record.values)
      ? Object.fromEntries(
          Object.entries(record.values as Record<string, unknown>).flatMap(
            ([key, value]) => (typeof value === "string" ? [[key, value]] : []),
          ),
        )
      : {};
  return success({
    values,
    diagnosisSystem:
      typeof record.diagnosisSystem === "string"
        ? record.diagnosisSystem
        : null,
    diagnosisCode:
      typeof record.diagnosisCode === "string" ? record.diagnosisCode : null,
    diagnosisDisplay:
      typeof record.diagnosisDisplay === "string"
        ? record.diagnosisDisplay
        : null,
  });
}

export async function saveDocumentTemplate(
  client: SupabaseClient<Database>,
  organizationId: string,
  input: DocumentTemplateInput,
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_document_template" as never,
    {
      p_organization_id: organizationId,
      p_template_id: input.id ?? null,
      p_name: input.name,
      p_category: input.category,
      p_description: input.description ?? "",
      p_body: input.body,
      p_active: input.active,
    } as never,
  );
  return error ? failure(error) : success(data as unknown as string);
}

export async function getOrganizationModules(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<OrganizationModule[]>> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("organization_modules")
    .select("id, organization_id, module_key, enabled, updated_at")
    .eq("organization_id", organizationId)
    .order("module_key");
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => ({
      id: row.id as string,
      organizationId: row.organization_id as string,
      moduleKey: row.module_key as OrganizationModuleKey,
      enabled: Boolean(row.enabled),
      updatedAt: row.updated_at as string,
    })),
  );
}

export async function setOrganizationModule(
  client: SupabaseClient<Database>,
  organizationId: string,
  moduleKey: OrganizationModuleKey,
  enabled: boolean,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc(
    "set_organization_module" as never,
    {
      p_organization_id: organizationId,
      p_module_key: moduleKey,
      p_enabled: enabled,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function isOrganizationModuleEnabled(
  client: SupabaseClient<Database>,
  organizationId: string,
  moduleKey: OrganizationModuleKey,
): Promise<SupabaseResult<boolean>> {
  const { data, error } = await client.rpc(
    "is_organization_module_enabled" as never,
    {
      p_organization_id: organizationId,
      p_module_key: moduleKey,
    } as never,
  );
  return error ? failure(error) : success(Boolean(data));
}

export async function getAllClinicServices(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<ClinicServiceSummary[]>> {
  const { data, error } = await client
    .from("clinic_services")
    .select(clinicServiceSummaryColumns)
    .eq("organization_id", organizationId)
    .order("name");
  return error
    ? failure(error)
    : success((data ?? []) as unknown as ClinicServiceSummary[]);
}

export async function saveAdminClinicService(
  client: SupabaseClient<Database>,
  organizationId: string,
  input: ClinicServiceInput & {
    id?: string;
    currency: string;
    active: boolean;
  },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_admin_clinic_service" as never,
    {
      p_organization_id: organizationId,
      p_service_id: input.id ?? null,
      p_name: input.name,
      p_description: input.description ?? "",
      p_duration_minutes: input.durationMinutes,
      p_base_price: input.basePrice ?? 0,
      p_currency: input.currency,
      p_booking_enabled: input.bookingEnabled,
      p_active: input.active,
      p_delivery_modes: input.deliveryModes ?? ["in_person"],
    } as never,
  );
  return error ? failure(error) : success(data as unknown as string);
}

export async function setClinicUserActive(
  client: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  active: boolean,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc(
    "set_clinic_user_active" as never,
    {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_active: active,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function setGovernancePatientActive(
  client: SupabaseClient<Database>,
  organizationId: string,
  patientId: string,
  active: boolean,
): Promise<SupabaseResult<undefined>> {
  const { error } = await client.rpc(
    "set_governance_patient_active" as never,
    {
      p_organization_id: organizationId,
      p_patient_id: patientId,
      p_active: active,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function saveCompanyCoverage(
  client: SupabaseClient<Database>,
  input: {
    organizationId: string;
    id?: string;
    patientId: string;
    coverageType: string;
    subscriberId?: string;
    payorName: string;
    periodStart?: string;
    periodEnd?: string;
    status: string;
  },
): Promise<SupabaseResult<string>> {
  const { data, error } = await client.rpc(
    "save_company_coverage" as never,
    {
      p_organization_id: input.organizationId,
      p_coverage_id: input.id ?? null,
      p_patient_id: input.patientId,
      p_coverage_type: input.coverageType,
      p_subscriber_id: input.subscriberId ?? "",
      p_payor_name: input.payorName,
      p_period_start: input.periodStart || null,
      p_period_end: input.periodEnd || null,
      p_status: input.status,
    } as never,
  );
  return error ? failure(error) : success(data as unknown as string);
}

export * from "./pmr-builder";
export * from "./professional-fees";
export * from "./queue-settings";

export interface PractitionerProfileSummary {
  id: string;
  organizationId: string;
  displayName: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  prcNumber?: string;
  ptrNumber?: string;
}

export async function getOrganizationPractitioners(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<PractitionerProfileSummary[]>> {
  const { data, error } = await client
    .from("practitioners")
    .select("id, organization_id, name, identifier, qualification")
    .eq("organization_id", organizationId)
    .eq("active", true);
  if (error) return failure(error);
  return success(
    (data ?? []).map((row) => {
      const idents = Array.isArray(row.identifier)
        ? (row.identifier as Array<{ system?: string; value?: string }>)
        : [];
      const quals = Array.isArray(row.qualification)
        ? (row.qualification as Array<{ code?: { text?: string } }>)
        : [];
      const licenseVal =
        idents.find((i) => i.system === "license" || i.system === "license_no")?.value ??
        idents.find((i) => i.system?.toLowerCase().includes("lic"))?.value ??
        (idents[0]?.value ? idents[0].value : "");
      const prcVal =
        idents.find((i) => i.system === "prc" || i.system === "prc_no")?.value ??
        idents.find((i) => i.system?.toLowerCase().includes("prc"))?.value ??
        (idents[1]?.value ? idents[1].value : "");
      const ptrVal =
        idents.find((i) => i.system === "ptr" || i.system === "ptr_no")?.value ??
        idents.find((i) => i.system?.toLowerCase().includes("ptr"))?.value ??
        "";
      return {
        id: row.id,
        organizationId: row.organization_id,
        displayName: getHumanNameDisplay(row.name),
        title: idents.find((i) => i.system === "title")?.value ?? "MD",
        specialty: quals[0]?.code?.text ?? "General Practice",
        licenseNumber: licenseVal,
        prcNumber: prcVal,
        ptrNumber: ptrVal,
      };
    }),
  );
}

export async function getPatientDocumentTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  templateVersion?: number | null,
): Promise<SupabaseResult<PatientDocumentTemplate | null>> {
  const { data, error } = await client.rpc(
    "get_patient_document_template" as never,
    {
      p_template_id: templateId,
      p_template_version: templateVersion ?? null,
    } as never,
  );
  if (error) return failure(error);
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return success(null);
  return success({
    id: String(row.id),
    organizationId: String(row.organization_id),
    category: row.category as "prescription" | "medical_certificate",
    name: String(row.name ?? "Clinical Template"),
    conditionCode: row.condition_code ? String(row.condition_code) : null,
    conditionDisplay: row.condition_display ? String(row.condition_display) : null,
    content: asTemplateContent(row.structured_body),
    version: Number(row.version ?? 1),
  });
}

export async function getPatientDefaultTemplate(
  client: SupabaseClient<Database>,
  organizationId: string,
  type: "prescription" | "medical_certificate",
  conditionCode?: string | null,
): Promise<SupabaseResult<PatientDocumentTemplate | null>> {
  const { data, error } = await client.rpc(
    "get_patient_default_template" as never,
    {
      p_organization_id: organizationId,
      p_type: type,
      p_condition_code: conditionCode ?? null,
    } as never,
  );
  if (error) return failure(error);
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return success(null);
  return success({
    id: String(row.id),
    organizationId: String(row.organization_id),
    category: row.category as "prescription" | "medical_certificate",
    name: String(row.name ?? "Clinical Template"),
    conditionCode: row.condition_code ? String(row.condition_code) : null,
    conditionDisplay: row.condition_display ? String(row.condition_display) : null,
    content: asTemplateContent(row.structured_body),
    version: Number(row.version ?? 1),
  });
}
export * from "./clinical-nlp-classifier";

export type {
  NbbPharmacyPosCatalogItem,
  NbbPosCartItem,
  NbbPosCheckoutInput,
  NbbPosCheckoutResult,
  CreatePharmacyPrescriptionTranscriptionInput,
  CreateStandalonePharmacyInventoryOrderInput,
  PharmacyPrescriptionAvailability,
  PharmacyPrescriptionCompletionInput,
  PharmacyPrescriptionCompletionResult,
  PharmacyPrescriptionLineInput,
  PharmacyPrescriptionOrderEvent,
  PharmacyPrescriptionOrderSummary,
  PharmacyPrescriptionReviewInput,
};

const nbbDatabaseUuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  );

export const nbbPosCartItemSchema = z.object({
  item_id: nbbDatabaseUuidSchema,
  quantity: z.number().int().positive(),
});

export const nbbPosCheckoutInputSchema = z.object({
  organizationId: nbbDatabaseUuidSchema,
  patientName: z.string().trim().min(1),
  items: z.array(nbbPosCartItemSchema).min(1),
});

export const nbbPharmacyPosCatalogItemSchema = z.object({
  stock_id: nbbDatabaseUuidSchema,
  item_id: nbbDatabaseUuidSchema,
  sku: z.string(),
  name: z.string(),
  unit_of_measure: z.string(),
  available_quantity: z.coerce.number(),
  standard_unit_price_in_centavos: z.union([
    z.number(),
    z.bigint(),
    z.string().transform((v) => Number(v)),
  ]),
  currency: z.string(),
});

export const nbbPosCheckoutResultSchema = z.object({
  billing_event_id: nbbDatabaseUuidSchema,
  pos_sale_id: nbbDatabaseUuidSchema,
  invoice_id: nbbDatabaseUuidSchema,
  receipt_number: z.string(),
  standard_total_in_centavos: z.union([
    z.number(),
    z.bigint(),
    z.string().transform((v) => Number(v)),
  ]),
  patient_balance_due_in_centavos: z.union([
    z.number(),
    z.bigint(),
    z.string().transform((v) => Number(v)),
  ]),
});

export async function getNbbPharmacyPosCatalog(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<SupabaseResult<NbbPharmacyPosCatalogItem[]>> {
  const orgResult = nbbDatabaseUuidSchema.safeParse(organizationId);
  if (!orgResult.success) {
    return failure(orgResult.error);
  }

  const { data, error } = await client.rpc("list_nbb_pharmacy_pos_catalog", {
    p_organization_id: organizationId,
  });

  if (error) return failure(error);

  const parsed = z.array(nbbPharmacyPosCatalogItemSchema).safeParse(data);
  if (!parsed.success) {
    return failure(parsed.error);
  }

  return success(parsed.data as NbbPharmacyPosCatalogItem[]);
}

export async function createNbbPharmacyPosSale(
  client: SupabaseClient<Database>,
  input: NbbPosCheckoutInput,
): Promise<SupabaseResult<NbbPosCheckoutResult>> {
  const validation = nbbPosCheckoutInputSchema.safeParse(input);
  if (!validation.success) {
    return failure(validation.error);
  }

  const { data, error } = await client.rpc("create_nbb_pharmacy_pos_sale", {
    p_organization_id: validation.data.organizationId,
    p_items: validation.data.items,
    p_patient_name: validation.data.patientName,
  });

  if (error) return failure(error);

  const parsed = nbbPosCheckoutResultSchema.safeParse(data);
  if (!parsed.success) {
    return failure(parsed.error);
  }

  return success(parsed.data as NbbPosCheckoutResult);
}

export async function listNbbPharmacyPosReceipts(
  client: SupabaseClient<Database>,
  organizationId: string,
  options?: { limit?: number; searchQuery?: string }
): Promise<SupabaseResult<NbbReceiptTransaction[]>> {
  try {
    let salesQuery = client
      .from("pos_sales")
      .select(`
        id,
        billing_event_id,
        receipt_number,
        customer_name,
        status,
        completed_at,
        created_at,
        standard_total_in_centavos
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (options?.limit) {
      salesQuery = salesQuery.limit(options.limit);
    } else {
      salesQuery = salesQuery.limit(100);
    }

    if (options?.searchQuery?.trim()) {
      const q = options.searchQuery.trim();
      salesQuery = salesQuery.or(`receipt_number.ilike.%${q}%,customer_name.ilike.%${q}%`);
    }

    const { data: sales, error: salesError } = await salesQuery;
    if (salesError) return failure(salesError);
    if (!sales || sales.length === 0) return success([]);

    const billingEventIds = sales.map((s) => s.billing_event_id).filter(Boolean);

    // Fetch matching invoices and line items
    const [invoicesRes, itemsRes] = await Promise.all([
      (client as any)
        .from("invoices")
        .select("id, billing_event_id, invoice_number, standard_total_in_centavos, patient_balance_due_in_centavos")
        .in("billing_event_id", billingEventIds),
      (client as any)
        .from("billing_line_items")
        .select("id, billing_event_id, description, quantity, standard_unit_price_in_centavos, standard_line_total_in_centavos")
        .in("billing_event_id", billingEventIds),
    ]);

    const invoices = invoicesRes.data || [];
    const lineItems = itemsRes.data || [];

    const invoicesByBillingEvent = new Map<string, { id: string; invoice_number: string; patient_balance_due_in_centavos: number }>();
    invoices.forEach((inv: any) => {
      invoicesByBillingEvent.set(inv.billing_event_id, {
        id: inv.id,
        invoice_number: inv.invoice_number,
        patient_balance_due_in_centavos: Number(inv.patient_balance_due_in_centavos ?? 0),
      });
    });

    const itemsByBillingEvent = new Map<string, NbbReceiptTransactionItem[]>();
    lineItems.forEach((li: any) => {
      const arr = itemsByBillingEvent.get(li.billing_event_id) || [];
      arr.push({
        name: li.description || "Dispensed Item",
        quantity: Number(li.quantity || 1),
        standardUnitPriceInCentavos: Number(li.standard_unit_price_in_centavos ?? 0),
        standardLineTotalInCentavos: Number(li.standard_line_total_in_centavos ?? 0),
      });
      itemsByBillingEvent.set(li.billing_event_id, arr);
    });

    const result: NbbReceiptTransaction[] = sales.map((s) => {
      const inv = invoicesByBillingEvent.get(s.billing_event_id);
      const items = itemsByBillingEvent.get(s.billing_event_id) || [];
      return {
        id: s.id,
        billingEventId: s.billing_event_id,
        receiptNumber: s.receipt_number,
        invoiceId: inv?.id || s.billing_event_id,
        invoiceNumber: inv?.invoice_number || s.receipt_number,
        patientName: s.customer_name || "Walk-in Patient",
        status: s.status,
        completedAt: s.completed_at || s.created_at,
        standardTotalInCentavos: Number(s.standard_total_in_centavos ?? 0),
        patientBalanceDueCentavos: inv?.patient_balance_due_in_centavos ?? 0,
        items,
      };
    });

    return success(result);
  } catch (err: any) {
    return failure({ message: err?.message || "Failed to list receipt transactions" });
  }
}

const pharmacyPrescriptionUuidSchema = z
  .string()
  .regex(/^[0-9a-fA-F-]{36}$/, "Expected a UUID-shaped identifier");

const pharmacyPrescriptionLineInputSchema = z.object({
  originalMedication: z.string().trim().min(1),
  itemId: pharmacyPrescriptionUuidSchema.nullable().optional(),
  dosageInstruction: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const pharmacyPrescriptionTranscriptionInputSchema = z.object({
  organizationId: pharmacyPrescriptionUuidSchema,
  patientId: pharmacyPrescriptionUuidSchema,
  encounterId: pharmacyPrescriptionUuidSchema,
  prescriptionReference: z.string().trim().min(1),
  prescriberName: z.string().trim().min(1),
  priority: z.enum(["routine", "urgent", "emergency"]).optional(),
  items: z.array(pharmacyPrescriptionLineInputSchema).min(1),
});

const standalonePharmacyInventoryOrderInputSchema = z.object({
  organizationId: pharmacyPrescriptionUuidSchema,
  patientReference: z.string().trim().min(1),
  wardReference: z.string().trim().nullable().optional(),
  prescriptionReference: z.string().trim().nullable().optional().default(""),
  prescriberName: z.string().trim().min(1),
  priority: z.enum(["routine", "urgent", "emergency"]).optional(),
  items: z.array(pharmacyPrescriptionLineInputSchema.extend({ itemId: pharmacyPrescriptionUuidSchema })).min(1),
});

function pharmacyPrescriptionLineFromJson(value: unknown): PharmacyPrescriptionOrderSummary["lines"][number] {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    organization_id: String(row.organization_id ?? ""),
    order_id: String(row.order_id ?? ""),
    item_id: row.item_id ? String(row.item_id) : null,
    item_sku: row.item_sku ? String(row.item_sku) : null,
    original_medication: String(row.original_medication ?? ""),
    dosage_instruction: row.dosage_instruction ? String(row.dosage_instruction) : null,
    requested_quantity: Number(row.requested_quantity ?? 0),
    dispensed_quantity: Number(row.dispensed_quantity ?? 0),
    unit_of_measure: row.unit_of_measure ? String(row.unit_of_measure) : null,
    status: String(row.status ?? "entered") as PharmacyPrescriptionOrderSummary["lines"][number]["status"],
    notes: row.notes ? String(row.notes) : null,
    pharmacist_reason: row.pharmacist_reason ? String(row.pharmacist_reason) : null,
    unit_price_in_centavos: row.unit_price_in_centavos == null ? null : Number(row.unit_price_in_centavos),
    line_total_in_centavos: row.line_total_in_centavos == null ? null : Number(row.line_total_in_centavos),
    usage_id: row.usage_id ? String(row.usage_id) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function pharmacyPrescriptionOrderFromJson(value: unknown): PharmacyPrescriptionOrderSummary {
  const row = (value ?? {}) as Record<string, unknown>;
  const events = Array.isArray(row.events)
    ? row.events.map((value) => {
        const event = (value ?? {}) as Record<string, unknown>;
        return {
          id: String(event.id ?? ""),
          line_id: event.line_id ? String(event.line_id) : null,
          status: String(event.status ?? "submitted") as PharmacyPrescriptionOrderSummary["events"][number]["status"],
          reason: event.reason ? String(event.reason) : null,
          metadata: event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
            ? event.metadata as Record<string, unknown>
            : {},
          actor_id: String(event.actor_id ?? ""),
          created_at: String(event.created_at ?? ""),
        };
      })
    : [];
  return {
    id: String(row.id ?? ""),
    organization_id: String(row.organization_id ?? ""),
    patient_id: row.patient_id ? String(row.patient_id) : null,
    encounter_id: row.encounter_id ? String(row.encounter_id) : null,
    patient_reference: row.patient_reference ? String(row.patient_reference) : null,
    ward_reference: row.ward_reference ? String(row.ward_reference) : null,
    physical_prescription_reference: row.physical_prescription_reference ? String(row.physical_prescription_reference) : null,
    prescriber_name: row.prescriber_name ? String(row.prescriber_name) : null,
    priority: String(row.priority ?? "routine") as PharmacyPrescriptionOrderSummary["priority"],
    status: String(row.status ?? "submitted") as PharmacyPrescriptionOrderSummary["status"],
    submitted_by: String(row.submitted_by ?? ""),
    submitted_at: String(row.submitted_at ?? ""),
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    pos_sale_id: row.pos_sale_id ? String(row.pos_sale_id) : null,
    invoice_id: row.invoice_id ? String(row.invoice_id) : null,
    receipt_number: row.receipt_number ? String(row.receipt_number) : null,
    lines: Array.isArray(row.lines) ? row.lines.map(pharmacyPrescriptionLineFromJson) : [],
    events,
  };
}

export async function createPharmacyPrescriptionTranscription(
  client: SupabaseClient<Database>,
  input: CreatePharmacyPrescriptionTranscriptionInput,
): Promise<SupabaseResult<string>> {
  const validation = pharmacyPrescriptionTranscriptionInputSchema.safeParse(input);
  if (!validation.success) return failure(validation.error);
  const { data, error } = await client.rpc(
    "create_pharmacy_prescription_transcription" as never,
    {
      p_organization_id: validation.data.organizationId,
      p_patient_id: validation.data.patientId,
      p_encounter_id: validation.data.encounterId,
      p_prescription_reference: validation.data.prescriptionReference,
      p_prescriber_name: validation.data.prescriberName,
      p_items: validation.data.items.map((line) => ({
        original_medication: line.originalMedication,
        item_id: line.itemId ?? null,
        dosage_instruction: line.dosageInstruction ?? null,
        quantity: line.quantity,
        unit_of_measure: line.unitOfMeasure ?? null,
        notes: line.notes ?? null,
      })),
      p_priority: validation.data.priority ?? "routine",
    } as never,
  );
  if (error) return failure(error);
  const parsed = pharmacyPrescriptionUuidSchema.safeParse(data);
  return parsed.success ? success(parsed.data) : failure(parsed.error);
}

export async function createStandalonePharmacyInventoryOrder(
  client: SupabaseClient<Database>,
  input: CreateStandalonePharmacyInventoryOrderInput,
): Promise<SupabaseResult<string>> {
  const validation = standalonePharmacyInventoryOrderInputSchema.safeParse(input);
  if (!validation.success) return failure(validation.error);
  const { data, error } = await client.rpc(
    "create_standalone_pharmacy_inventory_order" as never,
    {
      p_organization_id: validation.data.organizationId,
      p_patient_reference: validation.data.patientReference,
      p_ward_reference: validation.data.wardReference || null,
      p_prescription_reference: validation.data.prescriptionReference || null,
      p_prescriber_name: validation.data.prescriberName,
      p_items: validation.data.items.map((line) => ({
        original_medication: line.originalMedication,
        item_id: line.itemId,
        dosage_instruction: line.dosageInstruction ?? null,
        quantity: line.quantity,
        unit_of_measure: line.unitOfMeasure ?? null,
        notes: line.notes ?? null,
      })),
      p_priority: validation.data.priority ?? "routine",
    } as never,
  );
  if (error) return failure(error);
  const parsed = pharmacyPrescriptionUuidSchema.safeParse(data);
  return parsed.success ? success(parsed.data) : failure(parsed.error);
}

export async function getPharmacyPrescriptionAvailability(
  client: SupabaseClient<Database>,
  organizationId: string,
  items: PharmacyPrescriptionLineInput[],
): Promise<SupabaseResult<PharmacyPrescriptionAvailability[]>> {
  const orgResult = pharmacyPrescriptionUuidSchema.safeParse(organizationId);
  const linesResult = z.array(pharmacyPrescriptionLineInputSchema).safeParse(items);
  if (!orgResult.success) return failure(orgResult.error);
  if (!linesResult.success) return failure(linesResult.error);
  const { data, error } = await client.rpc(
    "get_pharmacy_prescription_availability" as never,
    {
      p_organization_id: organizationId,
      p_items: linesResult.data.map((line) => ({ item_id: line.itemId ?? null, quantity: line.quantity })),
    } as never,
  );
  if (error) return failure(error);
  const response = data as unknown;
  if (!Array.isArray(response)) return failure({ message: "Invalid Pharmacy availability response." });
  return success(response.map((value: unknown) => {
    const row = (value ?? {}) as Record<string, unknown>;
    return {
      item_id: row.item_id ? String(row.item_id) : null,
      requested_quantity: Number(row.requested_quantity ?? 0),
      available_quantity: Number(row.available_quantity ?? 0),
      status: String(row.status ?? "unavailable") as "available" | "unavailable",
    };
  }));
}

export async function listPharmacyPrescriptionQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  status?: PharmacyPrescriptionOrderSummary["status"] | null,
): Promise<SupabaseResult<PharmacyPrescriptionOrderSummary[]>> {
  const orgResult = pharmacyPrescriptionUuidSchema.safeParse(organizationId);
  if (!orgResult.success) return failure(orgResult.error);
  const { data, error } = await client.rpc(
    "list_pharmacy_prescription_queue" as never,
    { p_organization_id: organizationId, p_status: status ?? null } as never,
  );
  if (error) return failure(error);
  const response = data as unknown;
  if (!Array.isArray(response)) return failure({ message: "Invalid Pharmacy queue response." });
  return success(response.map(pharmacyPrescriptionOrderFromJson));
}

export async function reviewPharmacyPrescriptionOrder(
  client: SupabaseClient<Database>,
  input: PharmacyPrescriptionReviewInput,
): Promise<SupabaseResult<void>> {
  const orderResult = pharmacyPrescriptionUuidSchema.safeParse(input.orderId);
  if (!orderResult.success) return failure(orderResult.error);
  const { data: _data, error } = await client.rpc(
    "review_pharmacy_prescription_order" as never,
    {
      p_order_id: input.orderId,
      p_updates: input.lines.map((line) => ({
        line_id: line.lineId,
        item_id: line.itemId,
        requested_quantity: line.requestedQuantity,
        unit_of_measure: line.unitOfMeasure,
      })),
      p_reason: input.reason ?? null,
    } as never,
  );
  return error ? failure(error) : success(undefined);
}

export async function completePharmacyPrescriptionOrder(
  client: SupabaseClient<Database>,
  input: PharmacyPrescriptionCompletionInput,
): Promise<SupabaseResult<PharmacyPrescriptionCompletionResult>> {
  const orderResult = pharmacyPrescriptionUuidSchema.safeParse(input.orderId);
  if (!orderResult.success) return failure(orderResult.error);
  const { data, error } = await client.rpc(
    "complete_pharmacy_prescription_order" as never,
    {
      p_order_id: input.orderId,
      p_outcomes: input.outcomes.map((outcome) => ({
        line_id: outcome.lineId,
        action: outcome.action,
        quantity: outcome.quantity ?? null,
        reason: outcome.reason ?? null,
      })),
    } as never,
  );
  if (error) return failure(error);
  const row = (data ?? {}) as Record<string, unknown>;
  const idResult = pharmacyPrescriptionUuidSchema.safeParse(row.order_id);
  if (!idResult.success) return failure(idResult.error);
  return success({
    order_id: idResult.data,
    status: String(row.status ?? "under_pharmacist_review") as PharmacyPrescriptionCompletionResult["status"],
    completed: Boolean(row.completed),
    billing_event_id: row.billing_event_id ? String(row.billing_event_id) : null,
    pos_sale_id: row.pos_sale_id ? String(row.pos_sale_id) : null,
    invoice_id: row.invoice_id ? String(row.invoice_id) : null,
    receipt_number: row.receipt_number ? String(row.receipt_number) : null,
    billing_mode: row.billing_mode === "nbb" || row.billing_mode === "standard" ? row.billing_mode : null,
    standard_total_in_centavos: row.standard_total_in_centavos == null ? null : Number(row.standard_total_in_centavos),
    patient_balance_due_in_centavos: row.patient_balance_due_in_centavos == null ? null : Number(row.patient_balance_due_in_centavos),
  });
}

export interface PharmacyPrescriptionQueueEvent {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  table: "pharmacy_prescription_orders" | "pharmacy_prescription_order_lines" | "pharmacy_prescription_order_events";
}

export function subscribeToPharmacyPrescriptionQueue(
  client: SupabaseClient<Database>,
  organizationId: string,
  onChange: (event: PharmacyPrescriptionQueueEvent) => void,
  onStatus?: (status: string) => void,
): () => void {
  const channel = client.channel(`pharmacy-prescription-queue:${organizationId}`);
  for (const table of [
    "pharmacy_prescription_orders",
    "pharmacy_prescription_order_lines",
    "pharmacy_prescription_order_events",
  ] as const) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `organization_id=eq.${organizationId}` },
      (payload: any) => onChange({ eventType: payload.eventType, table }),
    );
  }
  channel.subscribe((status) => onStatus?.(status));
  return () => {
    void client.removeChannel(channel);
  };
}

