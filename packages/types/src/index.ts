/** FHIR resource types represented by the foundational relational schema. */
export type { Database, Json } from "./database";

import type { Database, Json } from "./database";

/** A generated database row. Keep table-shaped types at the data boundary. */
export type DatabaseRow<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];

export type PatientRow = DatabaseRow<"patients">;
export type PatientClinicContextRow = DatabaseRow<"patient_clinic_contexts">;
export type AppointmentRow = DatabaseRow<"appointments">;
export type AppointmentSlotRow = DatabaseRow<"appointment_slots">;
export type ClinicServiceRow = DatabaseRow<"clinic_services">;
export type ServicePractitionerRow = DatabaseRow<"service_practitioners">;
export type PractitionerCoverageGrantRow = DatabaseRow<"practitioner_coverage_grants">;
export interface ReassignmentCandidate {
  practitionerRoleId: string;
  displayName: string;
}
export type EncounterRow = DatabaseRow<"encounters">;
export type ObservationRow = DatabaseRow<"observations">;
export type MedicationRequestRow = DatabaseRow<"medication_requests">;
export type DocumentReferenceRow = DatabaseRow<"document_references">;
export type ServiceRequestRow = DatabaseRow<"service_requests">;
export type DiagnosticReportRow = DatabaseRow<"diagnostic_reports">;
export type ClinicalNotificationRow = DatabaseRow<"clinical_notifications">;
export type OrganizationRow = DatabaseRow<"organizations">;
export type PlatformAdminRow = DatabaseRow<"platform_admins">;
export type ProviderWeeklyAvailabilityRow =
  DatabaseRow<"provider_weekly_availability">;
export type WaitingRoomQueueRow = DatabaseRow<"waiting_room_queue">;
export type ClinicRoomRow = DatabaseRow<"clinic_rooms">;
export type RoomAssignmentRow = DatabaseRow<"room_assignments">;
export type DepartmentRow = DatabaseRow<"departments">;
export type InventoryItemRow = DatabaseRow<"inventory_items">;
export type DepartmentStockRow = DatabaseRow<"department_stock">;
export type InventoryHoldRow = DatabaseRow<"inventory_holds">;
export type InventoryUsageRow = DatabaseRow<"inventory_usages">;
export type InventoryStockMovementRow =
  DatabaseRow<"inventory_stock_movements">;
export type StaffDepartmentAssignmentRow =
  DatabaseRow<"staff_department_assignments">;
export type InventoryRequisitionRow = DatabaseRow<"inventory_requisitions">;
export type InventoryRequisitionItemRow = DatabaseRow<"inventory_requisition_items">;
export interface BillingEventRow {
  id: string;
  organization_id: string;
  encounter_id: string | null;
  patient_id: string | null;
  payor_type: PayorType;
  status: BillingEventStatus;
  coverage_id: string | null;
  finalized_at: string | null;
  finalized_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface BillingLineItemRow {
  id: string;
  organization_id: string;
  billing_event_id: string;
  source_type: "clinic_service" | "inventory_usage" | "laboratory_service" | "pos_item";
  source_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  currency: string;
  line_total: number;
  created_at: string;
  updated_at: string;
}
export interface InvoiceRow {
  id: string;
  organization_id: string;
  billing_event_id: string;
  patient_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_due: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  qr_payment_token: string | null;
  created_at: string;
  updated_at: string;
}
export interface PaymentRow {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number: string | null;
  qr_token: string | null;
  confirmed_at: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface PosSaleRow {
  id: string;
  organization_id: string;
  billing_event_id: string;
  cashier_user_id: string;
  status: PosSaleStatus;
  customer_name: string | null;
  receipt_number: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
export type CoverageRow = DatabaseRow<"coverages">;
export type ClaimRow = DatabaseRow<"claims">;

export type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
export type AppointmentDeliveryMode =
  Database["public"]["Enums"]["appointment_delivery_mode"];
export type EncounterStatus = Database["public"]["Enums"]["encounter_status"];
export type SlotStatus = Database["public"]["Enums"]["slot_status"];
export type ObservationStatus =
  Database["public"]["Enums"]["observation_status"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type WaitingQueueStage =
  Database["public"]["Enums"]["waiting_queue_stage"];

/** Loop 5 financial enums */
export type PayorType = "self_pay" | "hmo" | "philhealth_nbb" | "government_subsidized";
export type BillingEventStatus = "draft" | "finalized" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "paid" | "partially_paid" | "void" | "cancelled";
export type PaymentMethod = "cash" | "card" | "qr_ewallet" | "bank_transfer" | "check";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";
export type PosSaleStatus = "open" | "completed" | "void";
export type BillingMode = "standard" | "nbb";
export type BillingLinePaymentStatus = "unpaid" | "paid" | "written_off" | "voided";

/**
 * App-facing FHIR-shaped summaries. These intentionally exclude raw storage
 * fields that are not needed in UI code, such as authentication linkage and
 * walk-in PIN state.
 */
export interface PatientSummary extends Pick<
  PatientRow,
  | "id"
  | "organization_id"
  | "active"
  | "name"
  | "birth_date"
  | "blood_type"
  | "gender"
  | "photo_url"
  | "telecom"
  | "address"
  | "contact"
  | "walk_in_id"
  | "created_at"
  | "updated_at"
> {
  displayName: string;
}

export type AppointmentSummary = Pick<
  AppointmentRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "practitioner_role_id"
  | "status"
  | "service_type"
  | "appointment_type"
  | "start_at"
  | "end_at"
  | "minutes_duration"
  | "description"
  | "patient_instruction"
  | "clinic_service_id"
  | "queue_date"
  | "queue_label"
  | "queue_number"
  | "delivery_mode"
>;

/** FHIR Slot fields exposed by the scheduling UI. */
export type AppointmentSlotSummary = Pick<
  AppointmentSlotRow,
  | "id"
  | "appointment_id"
  | "organization_id"
  | "practitioner_role_id"
  | "clinic_service_id"
  | "status"
  | "service_type"
  | "start_at"
  | "end_at"
>;

/** Public FHIR HealthcareService fields used by the clinic portal. */
export type ClinicServiceSummary = Pick<
  ClinicServiceRow,
  | "id"
  | "organization_id"
  | "owner_practitioner_role_id"
  | "code"
  | "name"
  | "description"
  | "duration_minutes"
  | "base_price"
  | "currency"
  | "active"
  | "booking_enabled"
  | "delivery_modes"
>;

/** Values a provider can maintain for a service offered from their clinic. */
export interface ClinicServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  basePrice?: number | null;
  bookingEnabled: boolean;
  deliveryModes?: AppointmentDeliveryMode[];
}

export interface WeeklyAvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** Public waiting-room projection. It intentionally contains no patient data. */
export type WaitingRoomQueueItem = Pick<
  WaitingRoomQueueRow,
  | "appointment_id"
  | "organization_id"
  | "queue_date"
  | "queue_label"
  | "queue_number"
  | "room_label"
  | "practitioner_display_name"
  | "service_name"
  | "scheduled_at"
  | "stage"
>;

export type PublicClinicSummary = Pick<
  OrganizationRow,
  "id" | "name" | "telecom" | "address"
>;

export type QueueMode = "clinic_wide" | "per_practitioner";

export type PortalName = "patient" | "provider" | "admin";

/** Database-authoritative result used to admit a signed-in identity to a portal. */
export interface PortalAccess {
  allowed: boolean;
  isSuperadmin: boolean;
  organizationIds: string[];
  roleCodes: string[];
}

export type AssignableClinicAccountRole = string;

export interface ClinicAccountInput {
  displayName: string;
  email: string;
  organizationId: string;
  password: string;
  roleCode: AssignableClinicAccountRole;
}

export interface CreatedClinicAccount {
  id: string;
  email: string;
  roleCode: AssignableClinicAccountRole;
}

export type ClinicRolePermission =
  | "can_access_admin_portal"
  | "can_access_provider_portal"
  | "can_manage_appointments"
  | "can_record_triage"
  | "can_start_consultation"
  | "can_manage_provider_schedule"
  | "can_manage_staff_roles"
  | "can_view_inventory"
  | "can_manage_inventory"
  | "can_tag_inventory_usage"
  | "can_order_diagnostics"
  | "can_view_diagnostics"
  | "can_view_lab_worklist"
  | "can_record_lab_results"
  | "can_view_referrals"
  | "can_update_referrals"
  | "can_manage_laboratory_services"
  | "can_manage_billing"
  | "can_view_billing"
  | "can_manage_pos"
  | "can_manage_claims"
  | "can_view_claims"
  | "can_view_payouts"
  | "can_manage_payouts"
  | "can_view_analytics"
  | "can_manage_patients"
  | "can_view_audit_log"
  | "can_identify_patients"
  | "can_manage_clinic_branding"
  | "can_manage_service_catalog"
  | "can_manage_document_templates"
  | "can_manage_feature_modules"
  | "can_manage_services"
  | "can_manage_professional_fees"
  | "can_view_clinic_queue"
  | "can_manage_rooms"
  | "can_reassign_appointments"
  | "can_encode_pharmacy_prescriptions"
  | "can_dispense_pharmacy_prescriptions"
  | "can_export_epidemiology_records";

export interface ClinicRoleDefinition {
  code: string;
  name: string;
  isCustom: boolean;
  permissions: ClinicRolePermission[];
}

export interface AppointmentQueueItem extends AppointmentSummary {
  encounterStatus: EncounterStatus | null;
  patientName: string;
  assignedDoctorName: string;
  triageStatus: "pending" | "complete";
}

export type EncounterSummary = Pick<
  EncounterRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "appointment_id"
  | "practitioner_role_id"
  | "status"
  | "class_code"
  | "service_type"
  | "period_start"
  | "period_end"
  | "diagnosis"
  | "version"
>;

export type CoverageSummary = Pick<
  CoverageRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "status"
  | "coverage_type"
  | "subscriber_id"
  | "payor"
  | "period_start"
  | "period_end"
  | "class_values"
>;

export type EncounterViewMode = "visual" | "simple";
export interface TeleconsultWorkspacePreference {
  chartCollapsed: boolean;
  splitRatio: number;
}
export type AnatomyView = "front" | "back" | "left" | "right";

export interface EncounterRegionDiagnosis {
  id: string;
  encounterId: string;
  regionCode: string;
  regionDisplay: string;
  anatomyView: AnatomyView;
  diagnosisText: string;
  codeSystem: string | null;
  code: string | null;
  recordedAt: string;
}

export type ObservationSummary = Pick<
  ObservationRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "encounter_id"
  | "status"
  | "code"
  | "code_display"
  | "effective_at"
  | "value"
  | "value_unit"
  | "supersedes_id"
  | "issued_at"
  | "diagnostic_report_id"
  | "reference_range"
  | "note"
>;

export type ServiceRequestSummary = Omit<Pick<
  ServiceRequestRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "encounter_id"
  | "requester_practitioner_id"
  | "status"
  | "category"
  | "priority"
  | "code"
  | "code_display"
  | "performer_practitioner_role_id"
  | "note"
  | "created_at"
  | "updated_at"
>, "status"> & { status: string };

export type DiagnosticReportSummary = Pick<
  DiagnosticReportRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "encounter_id"
  | "based_on_service_request_id"
  | "status"
  | "code"
  | "code_display"
  | "effective_at"
  | "issued_at"
  | "conclusion"
>;

export type ClinicalNotificationSummary = Pick<
  ClinicalNotificationRow,
  | "id"
  | "organization_id"
  | "service_request_id"
  | "diagnostic_report_id"
  | "kind"
  | "title"
  | "message"
  | "read_at"
  | "created_at"
>;

export interface DiagnosticServiceRequestInput {
  encounterId: string;
  category: "laboratory" | "referral";
  priority: "routine" | "urgent" | "asap" | "stat";
  note?: string;
  performerPractitionerRoleId?: string | null;
  laboratoryServiceId?: string | null;
}

export interface DiagnosticResultInput {
  display: string;
  value: string | number | boolean;
  unit?: string;
  referenceRange?: { low?: number; high?: number; text?: string };
  note?: string;
}

export interface DiagnosticReportInput {
  serviceRequestId: string;
  conclusion?: string;
  results: DiagnosticResultInput[];
}

export interface DiagnosticsWorkspace {
  serviceRequests: ServiceRequestSummary[];
  diagnosticReports: DiagnosticReportSummary[];
  observations: ObservationSummary[];
  notifications: ClinicalNotificationSummary[];
}

export interface SpecialistOption {
  practitionerRoleId: string;
  displayName: string;
  specialty: Json;
  organizationName: string;
}

export interface LaboratoryServiceSummary {
  id: string;
  code: string;
  name: string;
  labCost: number;
  active: boolean;
}

export interface DiagnosticEncounterOption {
  id: string;
  patientName: string;
  serviceType: string | null;
  periodStart: string;
  status: EncounterStatus;
}

export type MedicationRequestSummary = Pick<
  MedicationRequestRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "encounter_id"
  | "requester_practitioner_id"
  | "status"
  | "medication_code"
  | "medication_display"
  | "authored_on"
  | "dosage_instruction"
  | "note"
  | "template_id"
  | "template_version"
>;

export type DocumentReferenceSummary = Pick<
  DocumentReferenceRow,
  | "id"
  | "organization_id"
  | "patient_id"
  | "encounter_id"
  | "author_practitioner_id"
  | "status"
  | "type_code"
  | "type_display"
  | "date_at"
  | "description"
  | "content_title"
  | "template_id"
  | "template_version"
>;

export interface PatientDocumentTemplate {
  id: string;
  organizationId: string;
  category: "prescription" | "medical_certificate";
  name: string;
  conditionCode: string | null;
  conditionDisplay: string | null;
  content: ClinicalDocumentTemplateContent;
  version: number;
}

export interface SoapObservationInput {
  encounterId: string;
  section: "S" | "O" | "A" | "P";
  text: string;
  supersedesId?: string | null;
  expectedVersion?: number | null;
}

export interface SoapNoteInput {
  encounterId: string;
  text: string;
  supersedesId?: string | null;
  expectedVersion?: number | null;
}

export interface SoapWriteResult {
  observationId: string;
  version: number;
}

export interface EncounterLockSummary {
  encounter_id: string;
  practitioner_role_id: string;
  practitioner_name: string;
  heartbeat_at: string;
  expires_at: string;
}

export interface TriageVitalSignsInput {
  appointmentId: string;
  systolicBp: number;
  diastolicBp: number;
  pulseBpm: number;
  respiratoryRate: number;
  temperatureC: number;
  oxygenSaturation: number;
  weightKg?: number | null;
  heightCm?: number | null;
  painScore?: number | null;
  acuity: "routine" | "urgent" | "emergency";
  chiefComplaint?: string | null;
  notes?: string | null;
  supersedesId?: string | null;
  /** Emergency triage level 1-5; required for PhilHealth emergency visits. */
  triageLevel?: number | null;
  /** PC 2025-0020 Annex A core presentation code. */
  corePresentationCode?: string | null;
}

export type EncounterSetting = "outpatient" | "emergency" | "inpatient";
export type AccommodationType = "ward_basic" | "private";
export type DischargeOutcome =
  | "improved"
  | "recovered"
  | "transferred"
  | "home_against_advice"
  | "absconded"
  | "expired";

export const ENCOUNTER_SETTING_LABELS: Record<EncounterSetting, string> = {
  outpatient: "Outpatient (OPD)",
  emergency: "Emergency (ER)",
  inpatient: "Inpatient (admitted)",
};

export const ACCOMMODATION_TYPE_LABELS: Record<AccommodationType, string> = {
  ward_basic: "Ward / basic accommodation",
  private: "Private room",
};

/** CF2 patient disposition. */
export const DISCHARGE_OUTCOME_LABELS: Record<DischargeOutcome, string> = {
  improved: "Improved",
  recovered: "Recovered",
  transferred: "Transferred / referred",
  home_against_advice: "Home against medical advice",
  absconded: "Absconded",
  expired: "Expired",
};

/** Emergency triage levels, 1 most severe. */
export const TRIAGE_LEVEL_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "1 · Resuscitation",
  2: "2 · Emergent",
  3: "3 · Urgent",
  4: "4 · Less urgent",
  5: "5 · Non-urgent",
};

export interface PhilhealthCorePresentation {
  code: string;
  display: string;
}

export interface CheckInDetails {
  encounterSetting?: EncounterSetting | null;
  accommodationType?: AccommodationType | null;
  referredFromFacility?: string | null;
  referredFromReason?: string | null;
}

export interface DischargeDetails {
  outcome: DischargeOutcome | null;
  referredToFacility?: string | null;
  referredToReason?: string | null;
}

export interface PrescriptionInput {
  encounterId: string;
  medication: string;
  dosage: string;
  note?: string;
  templateId?: string | null;
  templateVersion?: number | null;
}

export interface PrescriptionRegimenItem {
  medication: string;
  dosage: string;
  note?: string;
}

export interface MedicalCertificateInput {
  encounterId: string;
  title: string;
  statement: string;
  templateId?: string | null;
  templateVersion?: number | null;
}

export type DepartmentSummary = Pick<
  DepartmentRow,
  "id" | "organization_id" | "code" | "name" | "description" | "active" | "is_root_supply"
>;

export type InventoryItemSummary = Pick<
  InventoryItemRow,
  | "id"
  | "organization_id"
  | "sku"
  | "name"
  | "description"
  | "unit_of_measure"
  | "unit_cost"
  | "selling_price"
  | "unit_price"
  | "currency"
  | "active"
  | "is_perishable"
  | "near_expiry_days_override"
>;

export type DepartmentStockSummary = Pick<
  DepartmentStockRow,
  | "id"
  | "organization_id"
  | "item_id"
  | "department_id"
  | "quantity"
  | "reorder_level"
  | "updated_at"
>;

export type InventoryExpiryStatus =
  | "ok"
  | "near_expiry"
  | "expired"
  | "legacy_unassigned";

export interface InventoryBatchSummary {
  id: string;
  organization_id: string;
  stock_id: string;
  item_id: string;
  department_id: string;
  lot_number: string | null;
  expiry_date: string | null;
  quantity: number;
  usable_quantity: number;
  days_until_expiry: number | null;
  expiry_status: InventoryExpiryStatus;
  legacy_unassigned_expiry: boolean;
  received_at: string;
  created_at: string;
  updated_at: string;
  item_name?: string;
  item_sku?: string;
  department_name?: string;
}

export interface InventoryExpirySettings {
  organization_id: string;
  near_expiry_days: number;
  pharmacy_department_id?: string | null;
  updated_at?: string;
}

export type InventoryUsageSummary = Pick<
  InventoryUsageRow,
  | "id"
  | "organization_id"
  | "stock_id"
  | "item_id"
  | "department_id"
  | "encounter_id"
  | "patient_id"
  | "quantity"
  | "unit_cost"
  | "unit_price"
  | "currency"
  | "tagged_by"
  | "used_at"
> & {
  actorName?: string | null;
  billingStatus?: "unbilled" | "paid" | "no-balance-billing";
};

export type InventoryHoldSummary = Pick<
  InventoryHoldRow,
  | "id"
  | "stock_id"
  | "encounter_id"
  | "quantity"
  | "status"
  | "held_at"
>;

export type InventoryStockMovementSummary = Pick<
  InventoryStockMovementRow,
  | "id"
  | "organization_id"
  | "stock_id"
  | "item_id"
  | "department_id"
  | "movement_type"
  | "quantity_delta"
  | "reason"
  | "usage_id"
  | "transfer_group_id"
  | "recorded_by"
  | "occurred_at"
> & {
  batch_id?: string | null;
  actorName?: string | null;
};

export interface InventoryWorkspace {
  departments: DepartmentSummary[];
  items: InventoryItemSummary[];
  stock: DepartmentStockSummary[];
  batches: InventoryBatchSummary[];
  holds: InventoryHoldSummary[];
  usages: InventoryUsageSummary[];
  movements: InventoryStockMovementSummary[];
  expirySettings?: InventoryExpirySettings | null;
}

export type InventoryViewMode = "visual" | "simple";

export interface InventoryItemInput {
  organizationId: string;
  name: string;
  description?: string;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  currency?: string;
  isPerishable?: boolean;
  nearExpiryDaysOverride?: number | null;
}

export interface InventoryItemPricingInput {
  itemId: string;
  unitCost: number;
  sellingPrice: number;
  isPerishable?: boolean;
  nearExpiryDaysOverride?: number | null;
}

export interface DepartmentInput {
  organizationId: string;
  name: string;
  description?: string;
  isRootSupply?: boolean;
}

export interface ReceiveInventoryBatchInput {
  quantity: number;
  expiry_date?: string | null;
  lot_number?: string | null;
}

export interface ReceiveInventoryStockInput {
  itemId: string;
  departmentId: string;
  batches: ReceiveInventoryBatchInput[];
  reason: string;
  movementType?: "opening" | "receipt" | "adjustment";
}

export interface StockAdjustmentInput {
  itemId: string;
  departmentId: string;
  quantityDelta: number;
  reason: string;
  movementType: "opening" | "receipt" | "adjustment" | "disposal";
}

export interface StockTransferInput {
  itemId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  quantity: number;
  reason: string;
}

export type RequisitionStatus =
  | "submitted"
  | "approved"
  | "partially_dispersed"
  | "fulfilled"
  | "cancelled";

export type RequisitionItemStatus =
  | "pending"
  | "awaiting_supply_intake"
  | "ready_for_dispersal"
  | "dispersed"
  | "cancelled";

export interface InventoryRequisitionItemSummary {
  id: string;
  requisition_id: string;
  organization_id: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  unit_of_measure?: string;
  requested_quantity: number;
  dispersed_quantity: number;
  status: RequisitionItemStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryRequisitionSummary {
  id: string;
  organization_id: string;
  requisition_number: string;
  requesting_department_id: string;
  requesting_department_name?: string;
  supply_department_id: string;
  supply_department_name?: string;
  status: RequisitionStatus;
  is_emergency: boolean;
  emergency_justification?: string | null;
  target_delivery_week: string;
  notes?: string | null;
  submitted_by: string;
  submitted_by_name?: string;
  submitted_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  items: InventoryRequisitionItemSummary[];
}

export interface SubmitRequisitionLineItem {
  item_id: string;
  requested_quantity: number;
  notes?: string;
}

export interface SubmitInventoryRequisitionInput {
  organizationId: string;
  requestingDepartmentId: string;
  supplyDepartmentId?: string;
  items: SubmitRequisitionLineItem[];
  notes?: string;
  isEmergency?: boolean;
  emergencyJustification?: string;
  simulatedDate?: string;
}

export interface DisperseInventoryRequisitionItemInput {
  requisitionItemId: string;
  quantity?: number;
}

export interface GsoCsvRow {
  category: string;
  description: string;
  expiryDateRaw: string | null;
  expiryDateNormalized: string | null; // ISO YYYY-MM-DD or null
  unitOfMeasure: string;
  quantity: number | null;
  sku?: string | null;
  lotNumber?: string | null;
  unitCostInCentavos?: bigint | number | null;
  notes?: string | null;
}

export interface GsoCsvParseResult {
  items: GsoCsvRow[];
  totalParsed: number;
  categoriesFound: string[];
  datedCount: number;
  undatedCount: number;
  errors: Array<{ line: number; message: string }>;
}

export interface PharmacyInventoryImportRow {
  category: string;
  genericName: string;
  dosageForm: string | null;
  brandName: string | null;
  itemName: string;
  unitOfMeasure: string;
  expiryDateRaw: string | null;
  expiryDateNormalized: string | null; // ISO YYYY-MM-DD or null
  lotNumber: string | null;
  dateDelivered: string | null; // ISO YYYY-MM-DD or null
  stocksReceived: number | null;
  totalStocks: number | null;
  balanceSept: number | null;
  qtyDispensed: number | null;
  actualBalance: number | null;
  effectiveQuantity: number;
  sku: string;
  notes?: string | null;
  dohSrpPhp?: number | null;
  dpriPhp?: number | null;
  bizboxPricePhp?: number | null;
  affiliatedPharmacyPricePhp?: number | null;
  unitCost?: number | null;
  sellingPrice?: number | null;
  matchStatus?: string | null;
  priceListItem?: string | null;
}

export interface PharmacyInventoryParseResult {
  sheetName: string;
  sheetsAvailable: string[];
  items: PharmacyInventoryImportRow[];
  totalParsed: number;
  categoriesFound: string[];
  datedCount: number;
  undatedCount: number;
  withStockCount: number;
  zeroStockCount: number;
  errors: Array<{ line: number; message: string }>;
}

export interface ImportPharmacyInventoryOptions {
  departmentId?: string | null;
  includeZeroStock?: boolean;
  defaultQuantityIfZero?: number;
  overrideCategory?: string | null;
}

export interface InventoryUsageInput {
  encounterId: string;
  stockId: string;
  quantity: number;
  departmentId?: string | null;
}

export interface ClinicStaffMember {
  userId: string;
  displayName: string;
  email: string | null;
  roleCode: string;
  departmentId: string | null;
  active: boolean;
}

export interface StaffAdministration {
  departments: DepartmentSummary[];
  staff: ClinicStaffMember[];
}

export interface InventoryEncounterOption {
  id: string;
  serviceType: string | null;
  periodStart: string | null;
}

export interface PatientProfileInput {
  patientId: string;
  displayName: string;
  birthDate?: string | null;
  gender?: "female" | "male" | "other" | "unknown" | null;
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface AppointmentSlotInput {
  clinicServiceId: string;
  endAt: string;
  startAt: string;
}

export interface PatientAccessRecords {
  patients: PatientSummary[];
  appointments: AppointmentSummary[];
  encounters: EncounterSummary[];
  observations: ObservationSummary[];
  medicationRequests: MedicationRequestSummary[];
  documentReferences: DocumentReferenceSummary[];
  serviceRequests: ServiceRequestSummary[];
  diagnosticReports: DiagnosticReportSummary[];
}

export interface OrganizationClinicalRecords {
  encounters: EncounterSummary[];
  observations: ObservationSummary[];
  medicationRequests: MedicationRequestSummary[];
  documentReferences: DocumentReferenceSummary[];
  serviceRequests: ServiceRequestSummary[];
  diagnosticReports: DiagnosticReportSummary[];
}

export interface WalkInCredentials {
  patientId: string;
  walkInId: string;
  pin: string;
}

export interface PatientRegistrationInput {
  displayName: string;
  email: string;
  organizationId: string;
  password: string;
}

export interface PatientRegistrationResult {
  email: string;
  signedIn: boolean;
}

export interface WalkInAccountRegistrationInput {
  email: string;
  password: string;
}

export interface WalkInRegistrationInput {
  organizationId: string;
  name: string;
  birthDate?: string | null;
  gender?: string | null;
  telecom?: string | null;
}

export interface WalkInAccessInput {
  organizationId: string;
  walkInId: string;
  pin: string;
}

export interface WalkInAccessRecords {
  patients: Array<Pick<PatientSummary, "id" | "name" | "walk_in_id">>;
  appointments: AppointmentSummary[];
  encounters: Array<Pick<EncounterSummary, "id" | "status" | "period_start">>;
  observations: Array<
    Pick<ObservationSummary, "id" | "code" | "status" | "value">
  >;
}

/** Extract a human-readable display name from the FHIR HumanName JSON field. */
export function getHumanNameDisplay(name: Json): string {
  if (typeof name === "object" && name !== null && !Array.isArray(name)) {
    const text = name.text;
    if (typeof text === "string" && text.trim()) return text.trim();

    const given = name.given;
    const family = name.family;
    const givenName = Array.isArray(given)
      ? given
          .filter((value): value is string => typeof value === "string")
          .join(" ")
      : typeof given === "string"
        ? given
        : "";
    const familyName = typeof family === "string" ? family : "";
    const combined = `${givenName} ${familyName}`.trim();
    if (combined) return combined;
  }

  return "Unnamed patient";
}

/** Safely reads Odyssey body-region diagnoses from Encounter.diagnosis JSON. */
export function getEncounterRegionDiagnoses(
  encounter: EncounterSummary,
): EncounterRegionDiagnosis[] {
  if (!Array.isArray(encounter.diagnosis)) return [];

  return encounter.diagnosis.flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const record = value as Record<string, Json | undefined>;
    const condition = record.condition;
    const conditionRecord = condition && typeof condition === "object" && !Array.isArray(condition)
      ? condition as Record<string, Json | undefined>
      : null;
    const coding = conditionRecord && Array.isArray(conditionRecord.coding)
      ? conditionRecord.coding[0]
      : null;
    const codingRecord = coding && typeof coding === "object" && !Array.isArray(coding)
      ? coding as Record<string, Json | undefined>
      : null;
    const anatomyView = record.anatomyView;

    if (
      typeof record.id !== "string" ||
      typeof record.regionCode !== "string" ||
      typeof record.regionDisplay !== "string" ||
      typeof record.recordedAt !== "string" ||
      typeof conditionRecord?.text !== "string" ||
      (anatomyView !== "front" && anatomyView !== "back" && anatomyView !== "left" && anatomyView !== "right")
    ) return [];

    return [{
      id: record.id,
      encounterId: encounter.id,
      regionCode: record.regionCode,
      regionDisplay: record.regionDisplay,
      anatomyView,
      diagnosisText: conditionRecord.text,
      codeSystem: typeof codingRecord?.system === "string" ? codingRecord.system : null,
      code: typeof codingRecord?.code === "string" ? codingRecord.code : null,
      recordedAt: record.recordedAt,
    }];
  });
}

export type FhirResourceType =
  | "Organization"
  | "Practitioner"
  | "PractitionerRole"
  | "Patient"
  | "Appointment"
  | "Encounter"
  | "Observation"
  | "MedicationRequest"
  | "ServiceRequest"
  | "DiagnosticReport"
  | "DocumentReference"
  | "Location"
  | "InventoryItem"
  | "SupplyDelivery"
  | "Coverage"
  | "Claim"
  | "Invoice"
  | "PaymentReconciliation";
export interface AuditActor {
  id: string;
  role: "patient" | "provider" | "admin" | "system";
}

/* â”€â”€â”€ Loop 5: Financial types â”€â”€â”€ */

export interface BillingEventSummary {
  id: string;
  organization_id: string;
  encounter_id: string | null;
  appointment_id: string | null;
  patient_id: string | null;
  payor_type: PayorType;
  billing_mode: BillingMode;
  billing_mode_source: string | null;
  status: BillingEventStatus;
  coverage_id: string | null;
  finalized_at: string | null;
  notes: string | null;
  created_at: string;
  patient_name: string;
  line_item_count: number;
  total: number;
}

export interface BillingLineItemSummary {
  id: string;
  source_type: "clinic_service" | "inventory_usage" | "laboratory_service" | "pos_item";
  source_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  line_total: number;
  payment_status: BillingLinePaymentStatus;
  billing_mode: BillingMode | null;
  payor_type: PayorType | null;
  tagged_at: string | null;
  void_reason: string | null;
}

export interface InvoiceSummary {
  id: string;
  organization_id: string;
  billing_event_id: string;
  patient_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_due: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string | null;
  paid_at: string | null;
  patient_name: string;
  qr_payment_token: string | null;
  billing_mode: BillingMode;
  payor_type: PayorType;
  appointment_id: string | null;
  encounter_id: string | null;
}

export interface PaymentSummary {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface PosSaleSummary {
  id: string;
  billing_event_id: string;
  status: PosSaleStatus;
  customer_name: string | null;
  receipt_number: string;
  completed_at: string | null;
  total: number;
}

export type ClaimLifecycleState =
  | "draft"
  | "clean_validated"
  | "batched"
  | "submitted"
  | "acknowledged"
  | "returned"
  | "adjudicated"
  | "settled"
  | "disputed";

export interface ClaimSummary {
  id: string;
  patient_id: string;
  patient_name: string;
  encounter_id: string | null;
  coverage_id: string | null;
  status: string;
  state: ClaimLifecycleState;
  use: string;
  claim_type: string;
  payor_type: PayorType | null;
  payer_type: "philhealth" | "hmo" | "corporate_account" | null;
  total: number | null;
  claimed_amount_centavos: number | null;
  approved_amount_centavos: number | null;
  primary_icd10_code: string | null;
  submitted_at: string | null;
  adjudicated_at: string | null;
  adjudication_result: "approved" | "denied" | "partial" | null;
  approved_amount: number | null;
  denied_reason: string | null;
  philhealth_claim_number: string | null;
  items: unknown;
  created_at: string;
}

export interface BillingWorkspace {
  billing_events: BillingEventSummary[];
  invoices: InvoiceSummary[];
  recent_payments: PaymentSummary[];
  pos_sales: PosSaleSummary[];
}

export interface BillableEncounter {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_id: string | null;
  service_type: string | null;
  period_start: string | null;
  period_end: string | null;
  status: EncounterStatus;
  service_name: string | null;
  service_price: number | null;
}

export interface PatientInvoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  total_due: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string | null;
  paid_at: string | null;
  qr_payment_token: string | null;
  payor_type: PayorType;
  billing_mode: BillingMode;
  billing_mode_source: string | null;
  appointment_id: string | null;
  appointment_status: AppointmentStatus | null;
  payment_due_at: string | null;
  line_items: BillingLineItemSummary[];
}

export interface InvoiceQrResolution {
  status: "active" | "paid" | "expired" | "not_found";
  invoice_id?: string;
  invoice_number?: string;
  patient_name?: string;
  billing_mode?: BillingMode;
  payor_type?: PayorType;
  total_due?: number;
  amount_paid?: number;
  balance_due?: number;
  expires_at?: string;
}

export interface InvoiceDetail {
  invoice: InvoiceSummary & { billing_mode_source: string | null };
  line_items: BillingLineItemSummary[];
  payments: PaymentSummary[];
}

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export interface PosCartItem {
  item_id: string;
  quantity: number;
}

export interface PosCheckoutResult {
  billing_event_id: string;
  pos_sale_id: string;
  invoice_id: string;
  payment_id: string;
  receipt_number: string;
  total: number;
}

/* Loop 6: Remote Care */

export type TeleconsultProvider =
  Database["public"]["Enums"]["teleconsult_provider"];
export type TeleconsultRoomStatus =
  Database["public"]["Enums"]["teleconsult_room_status"];
export type DoctorPayoutStatus =
  Database["public"]["Enums"]["doctor_payout_status"];

export interface TeleconsultAppointment {
  appointment_id: string;
  organization_id: string;
  provider: TeleconsultProvider;
  room_name: string | null;
  room_status: TeleconsultRoomStatus;
  appointment_status: AppointmentStatus;
  start_at: string;
  end_at: string;
  service_type: string | null;
  patient_name: string;
  practitioner_name: string;
  can_join: boolean;
  encounter_id: string | null;
  encounter_status: EncounterStatus | null;
}

export interface DoctorPayoutSummary {
  id: string;
  encounter_id: string;
  billing_event_id: string;
  practitioner_role_id: string;
  assigned_practitioner_role_id: string;
  performed_by_practitioner_role_id: string | null;
  practitioner_name: string;
  delivery_mode: AppointmentDeliveryMode;
  service_type: string | null;
  encounter_finished_at: string | null;
  gross_service_amount: number;
  share_basis_points: number;
  payout_amount: number;
  currency: string;
  status: DoctorPayoutStatus;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

/* Loop 7: Platform and Governance */

export interface GovernanceDashboard {
  activePatients: number;
  appointmentsToday: number;
  waitingNow: number;
  completedEncounters30d: number;
  outstandingInvoices: number;
  outstandingBalance: number;
  confirmedRevenue30d: number;
  activeStaff: number;
  auditEvents24h: number;
}

export interface GovernancePatientSummary {
  patientId: string;
  displayName: string;
  walkInId: string | null;
  birthDate: string | null;
  gender: string | null;
  telecom: Json;
  active: boolean;
  encounterCount: number;
  appointmentCount: number;
  lastActivityAt: string;
}

export interface GovernancePatientRecord {
  patient: Record<string, unknown>;
  appointments: Array<Record<string, unknown>>;
  encounters: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  medications: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  service_requests: Array<Record<string, unknown>>;
  diagnostic_reports: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
}

export interface PatientAuditEvent {
  id: string;
  occurredAt: string;
  actorName: string;
  actorType: string;
  action: string;
  resourceType: string;
  recordId: string;
  metadata: Json;
}

export interface ClinicOperationsLogEntry {
  id: string | number;
  occurredAt: string;
  actorId: string | null;
  actorName: string;
  actorType: string;
  module: string;
  action: string;
  tableName: string;
  recordId: string | null;
  description: string;
  metadata: Json;
}

export interface ClinicOperationsLogFilters {
  module?: string;
  action?: string;
  actorId?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IdentifiedPatient {
  patientId: string;
  displayName: string;
  walkInId: string | null;
  birthDate: string | null;
  gender: string | null;
}

export interface ImportedPatientCredential extends IdentifiedPatient {
  rowNumber: number;
  pin: string | null;
  error: string | null;
}

export interface OrganizationBranding {
  id: string;
  organizationId: string;
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  supportEmail: string | null;
  supportPhone: string | null;
  clinicVisitMessage?: string | null;
  teleconsultMessage?: string | null;
  bookingConfirmationMessage?: string | null;
}

export interface OrganizationBrandingInput {
  displayName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  supportEmail?: string;
  supportPhone?: string;
  clinicVisitMessage?: string;
  teleconsultMessage?: string;
  bookingConfirmationMessage?: string;
}

export type DocumentTemplateCategory =
  | "medical_certificate"
  | "prescription"
  | "referral"
  | "laboratory"
  | "invoice"
  | "general";

export interface DocumentTemplate {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  category: DocumentTemplateCategory;
  description: string | null;
  body: string;
  version: number;
  active: boolean;
  updatedAt: string;
}

export interface DocumentTemplateInput {
  id?: string;
  name: string;
  category: DocumentTemplateCategory;
  description?: string;
  body: string;
  active: boolean;
}

export type ClinicalDocumentTemplateType = "medical_certificate" | "prescription";
export type ClinicalDocumentTemplateStatus = "draft" | "published" | "archived";
export type ClinicalTemplateScope = "personal" | "clinic_shared";

export interface TemplateMedicationLine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export interface ClinicalDocumentTemplateContent {
  html: string;
  /** Private Storage paths; short-lived URLs are resolved only for print preview. */
  branding?: {
    source: "none" | "personal" | "clinic";
    headerLogoPath?: string;
    watermarkPath?: string;
  };
  certificate?: {
    variant: "fitness_to_work" | "fitness_to_travel" | "general";
    remarks: string;
    restDays: string;
  };
  medications: TemplateMedicationLine[];
}

export interface Icd10ReferenceCondition {
  code: string;
  description: string;
  category: string | null;
}

export interface ClinicalDocumentTemplate {
  id: string;
  organizationId: string;
  ownerDoctorId: string | null;
  type: ClinicalDocumentTemplateType;
  title: string;
  conditionSystem: string | null;
  conditionCode: string | null;
  conditionDisplay: string | null;
  content: ClinicalDocumentTemplateContent;
  isDefault: boolean;
  status: ClinicalDocumentTemplateStatus;
  version: number;
  updatedAt: string;
}

export interface ClinicalDocumentTemplateInput {
  id?: string;
  type: ClinicalDocumentTemplateType;
  title: string;
  scope: ClinicalTemplateScope;
  conditionSystem?: string | null;
  conditionCode?: string | null;
  conditionDisplay?: string | null;
  content: ClinicalDocumentTemplateContent;
  isDefault: boolean;
  status: Exclude<ClinicalDocumentTemplateStatus, "archived">;
}

export interface EncounterTemplateContext {
  values: Record<string, string>;
  diagnosisSystem: string | null;
  diagnosisCode: string | null;
  diagnosisDisplay: string | null;
}

export type OrganizationModuleKey =
  | "core_visit"
  | "clinical_documentation"
  | "inventory"
  | "diagnostics"
  | "financial"
  | "remote_care"
  | "governance";

export interface OrganizationModule {
  id: string;
  organizationId: string;
  moduleKey: OrganizationModuleKey;
  enabled: boolean;
  updatedAt: string;
}

export interface GovernancePatientImportRow {
  name: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
}

export type FacilityBillingMode = "government_no_billing" | "private_hospital";

export interface FacilityClassification {
  organizationId: string;
  defaultPayorType: PayorType;
  isGovernmentNoBilling: boolean;
  canManage: boolean;
}

export type FacilityType =
  | "clinic"
  | "infirmary"
  | "hospital_level_1"
  | "hospital_level_2"
  | "hospital_level_3";
export type FacilityOwnership = "private" | "doh_retained" | "lgu" | "other_government";
/** none, PhilHealth No Balance Billing, DOH Zero Balance Billing, or the legacy facility-wide subsidy. */
export type BalanceBillingPolicy = "none" | "nbb" | "zbb" | "facility_wide_subsidy";

export interface OrganizationBillingProfile {
  organizationId: string;
  facilityType: FacilityType;
  ownership: FacilityOwnership;
  balanceBillingPolicy: BalanceBillingPolicy;
  hciAccreditationNumber: string | null;
  canManage: boolean;
}

export type PhilhealthSoaCategory =
  | "medicines"
  | "supplies"
  | "laboratory"
  | "other_services"
  | "professional_fee";

/** One visit charge with the Statement of Account split, in centavos. */
export interface PhilhealthClaimDocumentLine {
  id: string;
  service_date: string;
  item_code: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price_centavos: number;
  line_total_centavos: number;
  soa_category: PhilhealthSoaCategory;
  on_claim: boolean;
  discount_centavos: number;
  phic_centavos: number;
  excess_centavos: number;
}

/** Data behind the PHIC Statement of Account, Itemized Charges and Claim Signature Form. */
export interface PhilhealthClaimDocument {
  soa_number: string;
  /** "claimed_charges" until the PhilHealth fee-schedule engine computes PHIC amounts. */
  phic_basis: "claimed_charges" | "fee_schedule";
  facility: {
    name: string;
    address: string | null;
    hci_accreditation_number: string | null;
    facility_type: string | null;
    ownership: string | null;
  };
  patient: {
    id: string;
    number: string;
    name: string;
    family: string | null;
    given: string | null;
    middle: string | null;
    suffix: string | null;
    sex: string | null;
    birth_date: string | null;
    address: string | null;
  };
  member: {
    /** The patient's own PIN (the dependent PIN when the patient isn't the member). */
    pin: string | null;
    member_pin: string | null;
    category: string | null;
    relationship: string;
    eligibility_reference: string | null;
    /** Member's details; only set when the patient is a dependent. */
    family: string | null;
    given: string | null;
    middle: string | null;
    suffix: string | null;
    birth_date: string | null;
    sex: string | null;
  };
  encounter: {
    id: string;
    transaction_number: string;
    setting: string | null;
    admitted_at: string | null;
    discharged_at: string | null;
    attending_name: string | null;
    attending_accreditation: string | null;
    accommodation_type: AccommodationType | null;
    triage_level: number | null;
    core_presentation_code: string | null;
    core_presentation: string | null;
    discharge_outcome: DischargeOutcome | null;
    referred_from_facility: string | null;
    referred_from_reason: string | null;
    referred_to_facility: string | null;
    referred_to_reason: string | null;
  };
  diagnoses: { code: string; description: string; rank: number | null }[];
  claim: {
    id: string;
    state: ClaimLifecycleState;
    payer_type: string | null;
    primary_icd10_code: string | null;
    claimed_amount_centavos: number | null;
    approved_amount_centavos: number | null;
    adjudication_result: string | null;
    submitted_at: string | null;
    philhealth_claim_number: string | null;
  };
  lines: PhilhealthClaimDocumentLine[];
  payments_centavos: number;
  prepared_by: string | null;
  generated_at: string;
}

export type PhilhealthRelationship = "self" | "spouse" | "child" | "parent";

/** Legal name, sex, birth date and mailing address in the form PhilHealth claim forms print. */
export interface PatientPhilhealthIdentity {
  familyName: string;
  givenName: string;
  middleName: string | null;
  suffix: string | null;
  sex: "male" | "female";
  birthDate: string;
  street: string | null;
  barangay: string;
  city: string;
  province: string;
  postalCode: string | null;
}

/** The member a dependent patient is covered under. */
export interface PhilhealthMemberDetails {
  pin: string;
  familyName: string;
  givenName: string;
  middleName: string | null;
  suffix: string | null;
  birthDate: string;
  sex: "male" | "female";
}

export interface PatientPhilhealthProfile {
  patientId: string;
  displayName: string | null;
  identity: Partial<PatientPhilhealthIdentity>;
  coverage: {
    id: string;
    pin: string | null;
    category: PhilhealthMemberCategory | null;
    relationship: PhilhealthRelationship;
    eligibilityReference: string | null;
    member: Partial<PhilhealthMemberDetails> | null;
  } | null;
}

export interface PractitionerPhilhealthAccreditation {
  practitionerId: string;
  pan: string | null;
  prcLicense: string | null;
}

/** PhilHealth member categories; indigent, sponsored, kasambahay, senior and lifetime qualify for NBB. */
export type PhilhealthMemberCategory =
  | "employed"
  | "voluntary"
  | "indigent"
  | "senior"
  | "sponsored"
  | "lifetime"
  | "kasambahay";

export interface EncounterCondition {
  id: string;
  code: string;
  codeDisplay: string;
  diagnosisRank: number | null;
  verificationStatus: "provisional" | "differential" | "confirmed";
  caseRate: number | null;
  recordedByName: string | null;
  createdAt: string;
}

export * from "./pmr";
export * from "./surveillance";

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

export interface PhilippineRegionOption {
  psgc: number;
  code: string;
  name: string;
  designation: string;
  islandGroup: "Luzon" | "Visayas" | "Mindanao";
}

export const PHILIPPINE_REGIONS: readonly PhilippineRegionOption[] = [
  { psgc: 1300000000, code: "NCR", name: "National Capital Region (NCR)", designation: "National Capital Region", islandGroup: "Luzon" },
  { psgc: 1400000000, code: "CAR", name: "Cordillera Administrative Region (CAR)", designation: "Cordillera Administrative Region", islandGroup: "Luzon" },
  { psgc: 100000000, code: "Region I", name: "Region I (Ilocos Region)", designation: "Ilocos Region", islandGroup: "Luzon" },
  { psgc: 200000000, code: "Region II", name: "Region II (Cagayan Valley)", designation: "Cagayan Valley", islandGroup: "Luzon" },
  { psgc: 300000000, code: "Region III", name: "Region III (Central Luzon)", designation: "Central Luzon", islandGroup: "Luzon" },
  { psgc: 400000000, code: "Region IV-A", name: "Region IV-A (CALABARZON)", designation: "CALABARZON", islandGroup: "Luzon" },
  { psgc: 1700000000, code: "MIMAROPA", name: "MIMAROPA Region (Region IV-B)", designation: "MIMAROPA Region", islandGroup: "Luzon" },
  { psgc: 500000000, code: "Region V", name: "Region V (Bicol Region)", designation: "Bicol Region", islandGroup: "Luzon" },
  { psgc: 600000000, code: "Region VI", name: "Region VI (Western Visayas)", designation: "Western Visayas", islandGroup: "Visayas" },
  { psgc: 700000000, code: "Region VII", name: "Region VII (Central Visayas)", designation: "Central Visayas", islandGroup: "Visayas" },
  { psgc: 1800000000, code: "NIR", name: "Negros Island Region (NIR)", designation: "Negros Island Region", islandGroup: "Visayas" },
  { psgc: 800000000, code: "Region VIII", name: "Region VIII (Eastern Visayas)", designation: "Eastern Visayas", islandGroup: "Visayas" },
  { psgc: 900000000, code: "Region IX", name: "Region IX (Zamboanga Peninsula)", designation: "Zamboanga Peninsula", islandGroup: "Mindanao" },
  { psgc: 1000000000, code: "Region X", name: "Region X (Northern Mindanao)", designation: "Northern Mindanao", islandGroup: "Mindanao" },
  { psgc: 1100000000, code: "Region XI", name: "Region XI (Davao Region)", designation: "Davao Region", islandGroup: "Mindanao" },
  { psgc: 1200000000, code: "Region XII", name: "Region XII (SOCCSKSARGEN)", designation: "SOCCSKSARGEN", islandGroup: "Mindanao" },
  { psgc: 1600000000, code: "Region XIII", name: "Region XIII (Caraga)", designation: "Caraga", islandGroup: "Mindanao" },
  { psgc: 1900000000, code: "BARMM", name: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)", designation: "Bangsamoro Autonomous Region In Muslim Mindanao", islandGroup: "Mindanao" },
] as const;

export interface NbbPharmacyPosCatalogItem {
  stock_id: string;
  item_id: string;
  sku: string;
  name: string;
  unit_of_measure: string;
  available_quantity: number;
  standard_unit_price_in_centavos: number | bigint;
  currency: string;
}

export interface NbbPosCartItem {
  item_id: string;
  quantity: number;
}

export interface NbbPosCheckoutInput {
  organizationId: string;
  patientName: string;
  items: NbbPosCartItem[];
}

export interface NbbPosCheckoutResult {
  billing_event_id: string;
  pos_sale_id: string;
  invoice_id: string;
  receipt_number: string;
  standard_total_in_centavos: number | bigint;
  patient_balance_due_in_centavos: number | bigint;
}

export interface NbbReceiptTransactionItem {
  name: string;
  quantity: number;
  standardUnitPriceInCentavos: number;
  standardLineTotalInCentavos: number;
}

export interface NbbReceiptTransaction {
  id: string;
  billingEventId: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  status: string;
  completedAt: string;
  standardTotalInCentavos: number;
  patientBalanceDueCentavos: number;
  items: NbbReceiptTransactionItem[];
}

export type PharmacyPrescriptionOrderStatus =
  | "draft"
  | "submitted"
  | "under_pharmacist_review"
  | "ready_to_dispense"
  | "partially_dispensed"
  | "completed"
  | "cancelled"
  | "rejected";

export type PharmacyPrescriptionOrderLineStatus =
  | "entered"
  | "available"
  | "unavailable"
  | "pharmacist_verified"
  | "partially_dispensed"
  | "dispensed"
  | "cancelled"
  | "external_referral";

export interface PharmacyPrescriptionLineInput {
  originalMedication: string;
  itemId?: string | null;
  dosageInstruction?: string | null;
  quantity: number;
  unitOfMeasure?: string | null;
  notes?: string | null;
}

export interface CreatePharmacyPrescriptionTranscriptionInput {
  organizationId: string;
  patientId: string;
  encounterId: string;
  prescriptionReference: string;
  prescriberName: string;
  priority?: "routine" | "urgent" | "emergency";
  items: PharmacyPrescriptionLineInput[];
}

export interface CreateStandalonePharmacyInventoryOrderInput {
  organizationId: string;
  patientReference: string;
  wardReference?: string | null;
  prescriptionReference?: string | null;
  prescriberName: string;
  priority?: "routine" | "urgent" | "emergency";
  items: PharmacyPrescriptionLineInput[];
}

export interface PharmacyPrescriptionAvailability {
  item_id: string | null;
  requested_quantity: number;
  available_quantity: number;
  status: "available" | "unavailable";
}

export interface PharmacyPrescriptionOrderLine {
  id: string;
  organization_id: string;
  order_id: string;
  item_id: string | null;
  item_sku: string | null;
  original_medication: string;
  dosage_instruction: string | null;
  requested_quantity: number;
  dispensed_quantity: number;
  unit_of_measure: string | null;
  status: PharmacyPrescriptionOrderLineStatus;
  notes: string | null;
  pharmacist_reason: string | null;
  unit_price_in_centavos: number | bigint | null;
  line_total_in_centavos: number | bigint | null;
  usage_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PharmacyPrescriptionOrderSummary {
  id: string;
  organization_id: string;
  patient_id: string | null;
  encounter_id: string | null;
  patient_reference: string | null;
  ward_reference: string | null;
  physical_prescription_reference: string | null;
  prescriber_name: string | null;
  priority: "routine" | "urgent" | "emergency";
  status: PharmacyPrescriptionOrderStatus;
  submitted_by: string;
  submitted_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  pos_sale_id?: string | null;
  invoice_id?: string | null;
  receipt_number?: string | null;
  lines: PharmacyPrescriptionOrderLine[];
  events: PharmacyPrescriptionOrderEvent[];
}

export interface PharmacyPrescriptionOrderEvent {
  id: string;
  line_id: string | null;
  status: PharmacyPrescriptionOrderLineStatus | PharmacyPrescriptionOrderStatus;
  reason: string | null;
  metadata: Record<string, unknown>;
  actor_id: string;
  created_at: string;
}

export interface PharmacyPrescriptionReviewInput {
  orderId: string;
  reason?: string | null;
  lines: Array<{
    lineId: string;
    itemId: string;
    requestedQuantity?: number;
    unitOfMeasure?: string | null;
  }>;
}

export interface PharmacyPrescriptionCompletionInput {
  orderId: string;
  outcomes: Array<{
    lineId: string;
    action: "dispense" | "cancel" | "external_referral";
    quantity?: number;
    reason?: string;
  }>;
}

export interface PharmacyPrescriptionCompletionResult {
  order_id: string;
  status: PharmacyPrescriptionOrderStatus;
  completed: boolean;
  billing_event_id?: string | null;
  pos_sale_id?: string | null;
  invoice_id?: string | null;
  receipt_number?: string | null;
  billing_mode?: "standard" | "nbb" | null;
  standard_total_in_centavos?: number | bigint | null;
  patient_balance_due_in_centavos?: number | bigint | null;
}
