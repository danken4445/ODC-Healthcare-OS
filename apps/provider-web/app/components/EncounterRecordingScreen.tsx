"use client";

/**
 * Odyssey Healthcare OS - Focused Encounter Recording Screen
 *
 * BREAKPOINT / ORIENTATION MATRIX:
 * ---------------------------------------------------------------------------------------------------------------------
 * Device / Breakpoint           | Documentation Mode | Macro Layout Structure | Panel Behavior
 * ---------------------------------------------------------------------------------------------------------------------
 * <768px (Phone)                | Auto-forced Simple | 1-Column Stacked       | Patient/vitals collapsible drawer,
 *                               | (read-only switch) |                        | full-width SOAP note, stacked actions.
 * ---------------------------------------------------------------------------------------------------------------------
 * 768–1024px Portrait           | Doctor Selectable  | 2-Zone Vertical Stack  | Zone 1 (Top): Collapsible patient/vitals
 * (Tablet Portrait, iPad P)     | (Persisted pref)   |                        | Zone 2 (Bottom): Documentation workspace
 *                               |                    |                        | full width; figure & region stack.
 * ---------------------------------------------------------------------------------------------------------------------
 * 768–1024px Landscape          | Doctor Selectable  | 3-Column Grid          | Col 1 (22%, min 280px): Sticky vitals/pt
 * (iPad / Tablet Landscape)     | (Persisted pref)   | (Proportional fr)      | Col 2 (1fr): Flex-scaled anatomy figure
 *                               |                    |                        | Col 3 (26%, min 260px): Region panel.
 * ---------------------------------------------------------------------------------------------------------------------
 * 1024–1366px Landscape         | Doctor Selectable  | 3-Column Grid          | Vitals cards reflow 2-up in Col 1;
 * (Small Laptop / iPad Pro L)   | (Persisted pref)   | (Expanded breathing)   | Orders form reflows to 2-col fields.
 * ---------------------------------------------------------------------------------------------------------------------
 * >1366px (Desktop)             | Doctor Selectable  | 3-Column Fluid Grid    | Middle documentation panel (1fr) grows
 *                               | (Persisted pref)   | (Zero dead gutters)    | to absorb space without dead margins.
 * ---------------------------------------------------------------------------------------------------------------------
 * Sizing governed by @container encounter (inline-size) with @media (orientation: landscape) guards.
 */

import {
  createDiagnosticServiceRequest,
  createBrowserSupabaseClient,
  createPatientQrPayload,
  acquireEncounterLock,
  finishClinicalEncounter,
  getCurrentStaffDepartment,
  getInventoryWorkspace,
  getLaboratoryServices,
  getMyEncounterViewMode,
  getOrganizationClinicalRecords,
  getOrganizationPatient,
  getEncounterLock,
  getPatientCoverages,
  getPortalAccess,
  getSpecialistOptions,
  hasOrganizationPermission,
  heartbeatEncounterLock,
  issueMedicalCertificate,
  issuePrescription,
  issuePrescriptionRegimen,
  recordEncounterRegionDiagnosis,
  releaseEncounterLock,
  saveMyEncounterViewMode,
  saveSoapNote,
  tagInventoryUsage,
} from "@odyssey/supabase-client";
import type {
  EncounterSummary,
  EncounterViewMode,
  AnatomyView,
  CoverageSummary,
  EncounterRegionDiagnosis,
  DocumentReferenceSummary,
  InventoryWorkspace,
  LaboratoryServiceSummary,
  MedicationRequestSummary,
  OrganizationClinicalRecords,
  PatientSummary,
  SpecialistOption,
} from "@odyssey/types";
import { getEncounterRegionDiagnoses, getHumanNameDisplay } from "@odyssey/types";
import {
  Badge,
  buildClinicalVitalReadings,
  Button,
  ClinicalPatientCard,
  ClinicalVitalsPanel,
  EncounterSaveConfirmedModal,
  Field,
  Input,
  MUSCULOSKELETAL_REGIONS,
  MusculoskeletalFigure,
  MusculoskeletalRegionPanel,
  AccessState,
  SaveConfirmedModal,
  type BodyRegionDefinition,
} from "@odyssey/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EncounterDevBar } from "./EncounterDevBar";
import { EncounterSoapEditor } from "./EncounterSoapEditor";
import { ClinicalDocumentationWorkspace } from "./ClinicalDocumentationWorkspace";
import { ClinicalOrdersAndCharges } from "./ClinicalOrdersAndCharges";
import { EncounterDiagnosisPanel } from "./EncounterDiagnosisPanel";
import { LongitudinalRecord } from "./LongitudinalRecord";
import { ClinicalTemplatePicker, type TemplateApplication } from "./template-studio";
import {
  generateRandomEncounterData,
  isDeveloperModeActive,
  setDeveloperModeActive,
} from "./encounter-test-data";

function clinicalText(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const text = (value as Record<string, unknown>).text;
  return typeof text === "string" ? text : "";
}

function dateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function dosageText(value: unknown): string {
  return Array.isArray(value) ? clinicalText(value[0]) : "";
}

function jsonDisplay(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ["display", "name", "text", "value"]) {
    if (typeof record[key] === "string" && record[key].trim()) return record[key].trim();
  }
  return null;
}

type EncounterAction =
  | "prescription"
  | "certificate"
  | "laboratory"
  | "referral"
  | "tagging";

type EncounterAccessState = "loading" | "unauthorized" | "error" | "ready";
type SoapAutosaveState = "idle" | "pending" | "saving" | "saved" | "error";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function openExportPreview({
  title,
  patientName,
  patientDetails,
  issuedAt,
  body,
}: {
  title: string;
  patientName: string;
  patientDetails: string;
  issuedAt: string;
  body: string;
}): boolean {
  const preview = window.open("", "_blank");
  if (!preview) return false;
  preview.opener = null;
  preview.document.open();
  preview.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#eef2f6;color:#172033;font:16px/1.55 Arial,sans-serif}.toolbar{display:flex;justify-content:flex-end;padding:16px;max-width:820px;margin:auto}.toolbar button{border:0;border-radius:6px;background:#155e75;color:#fff;padding:10px 14px;font:700 14px Arial;cursor:pointer}.document{box-sizing:border-box;width:min(100% - 32px,820px);min-height:1050px;margin:0 auto 32px;padding:64px;background:#fff;box-shadow:0 2px 12px #1720331a}.eyebrow{margin:0;color:#526174;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.document h1{margin:8px 0 28px;font-size:30px}.metadata{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 32px;padding:16px 0;border-top:1px solid #dce4ed;border-bottom:1px solid #dce4ed}.metadata strong,.body h2{display:block;font-size:13px}.metadata span{display:block;font-size:15px}.body{white-space:pre-wrap}.footer{margin-top:64px;padding-top:16px;border-top:1px solid #dce4ed;color:#526174;font-size:13px}@media print{body{background:#fff}.toolbar{display:none}.document{width:100%;min-height:0;margin:0;padding:32px;box-shadow:none}}@media(max-width:600px){.document{width:100%;padding:28px 24px;margin:0}.metadata{grid-template-columns:1fr}}</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button></div><main class="document"><p class="eyebrow">Odyssey Healthcare</p><h1>${escapeHtml(title)}</h1><div class="metadata"><div><strong>Patient</strong><span>${escapeHtml(patientName)}</span></div><div><strong>Patient details</strong><span>${escapeHtml(patientDetails)}</span></div><div><strong>Issued</strong><span>${escapeHtml(issuedAt)}</span></div></div><section class="body">${escapeHtml(body)}</section><footer class="footer">This document was generated from the patient’s clinical encounter record.</footer></main></body></html>`);
  preview.document.close();
  preview.focus();
  return true;
}

export function EncounterRecordingScreen() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const [accessState, setAccessState] = useState<EncounterAccessState>("loading");
  const [encounter, setEncounter] = useState<EncounterSummary | null>(null);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [records, setRecords] = useState<OrganizationClinicalRecords | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<CoverageSummary[]>([]);
  const [coverageLabel, setCoverageLabel] = useState<string | null>(null);
  const [lockHolderName, setLockHolderName] = useState<string | null>(null);
  const [versionConflictOpen, setVersionConflictOpen] = useState(false);
  const lockOwnedRef = useRef(false);
  const [status, setStatus] = useState("Loading the secure encounter record…");
  const [busy, setBusy] = useState(false);
  const [canPrescribe, setCanPrescribe] = useState(false);
  const [canOrderDiagnostics, setCanOrderDiagnostics] = useState(false);
  const [canTagInventory, setCanTagInventory] = useState(false);
  const [canViewInventory, setCanViewInventory] = useState(false);
  const [inventory, setInventory] = useState<InventoryWorkspace | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departmentSelection, setDepartmentSelection] = useState("");
  const [laboratoryServices, setLaboratoryServices] = useState<
    LaboratoryServiceSummary[]
  >([]);
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [selectedSpecialistRoleId, setSelectedSpecialistRoleId] = useState("");

  // Developer Debug Mode (Easter Egg) State
  const [debugMode, setDebugMode] = useState(false);
  const [activeProfileName, setActiveProfileName] = useState<string>("");
  const [debugToast, setDebugToast] = useState<string | null>(null);

  // Form input states for the Encounter phase
  const [soapInput, setSoapInput] = useState<string>("");
  const [soapDirty, setSoapDirty] = useState<boolean>(false);
  const [soapAutosaveState, setSoapAutosaveState] = useState<SoapAutosaveState>("idle");
  const [soapLastSavedAt, setSoapLastSavedAt] = useState<Date | null>(null);
  const [latestSoapNoteId, setLatestSoapNoteId] = useState<string | null>(null);
  const [soapAutosaveRevision, setSoapAutosaveRevision] = useState(0);
  const soapInputRef = useRef("");
  const latestSoapNoteIdRef = useRef<string | null>(null);
  const lastSavedSoapTextRef = useRef("");
  const soapSaveInFlightRef = useRef(false);
  const soapSavePromiseRef = useRef<Promise<boolean> | null>(null);
  const [rxMedication, setRxMedication] = useState<string>("");
  const [rxDosage, setRxDosage] = useState<string>("");
  const [rxNote, setRxNote] = useState<string>("");
  const [certTitle, setCertTitle] = useState<string>("Medical Certificate");
  const [certStatement, setCertStatement] = useState<string>("");
  const [prescriptionTemplate, setPrescriptionTemplate] = useState<TemplateApplication | null>(null);
  const [additionalPrescriptionLines, setAdditionalPrescriptionLines] = useState<TemplateApplication["medications"]>([]);
  const [certificateTemplate, setCertificateTemplate] = useState<TemplateApplication | null>(null);
  const [labServiceId, setLabServiceId] = useState<string>("");
  const [labPriority, setLabPriority] = useState<
    "routine" | "urgent" | "asap" | "stat"
  >("routine");
  const [labNote, setLabNote] = useState<string>("");
  const [referralPriority, setReferralPriority] = useState<
    "routine" | "urgent" | "asap"
  >("routine");
  const [referralNote, setReferralNote] = useState<string>("");
  const [tagStockId, setTagStockId] = useState<string>("");
  const [tagQuantity, setTagQuantity] = useState<string>("1");
  const [preferredMode, setPreferredMode] = useState<EncounterViewMode>("visual");
  const [forceSimpleMode, setForceSimpleMode] = useState(false);
  const [anatomyView, setAnatomyView] = useState<AnatomyView>("front");
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionDefinition>(
    MUSCULOSKELETAL_REGIONS.find((region) => region.code === "chest") ?? { code: "chest", display: "Chest" },
  );
  const [diagnosisBusy, setDiagnosisBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<EncounterAction>("prescription");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const completionDialogRef = useRef<HTMLDialogElement>(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [soapSaveConfirmation, setSoapSaveConfirmation] = useState<{
    noteSnippet: string;
    revisionNumber?: number;
    timestamp: Date;
  } | null>(null);
  const [orderSaveConfirmation, setOrderSaveConfirmation] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    recordType: "prescription" | "certificate" | "order";
    summaryItems: Array<{ label: string; value: ReactNode; highlight?: boolean; badgeVariant?: "default" | "success" | "warning" | "danger" | "info" }>;
    detailsSnippet?: { title: string; content: string };
    tertiaryAction?: { label: string; onClick: () => void };
  } | null>(null);

  // Check persisted debug mode on client mount
  useEffect(() => {
    if (isDeveloperModeActive()) {
      setDebugMode(true);
    }
  }, []);

  useEffect(() => {
    // Phone threshold is strictly < 768px. Tablets (768px+) and desktop remain doctor-selectable.
    const mobile = window.matchMedia("(max-width: 767px)");
    const update = () => setForceSimpleMode(mobile.matches);
    update();
    mobile.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const dialog = completionDialogRef.current;
    if (!dialog) return;
    if (completionDialogOpen && !dialog.open) dialog.showModal();
    if (!completionDialogOpen && dialog.open) dialog.close();
  }, [completionDialogOpen]);

  const loadEncounter = useCallback(async () => {
    setAccessState("loading");
    setEncounter(null);
    setPatient(null);
    setRecords(null);
    setOrganizationId(null);
    setCoverages([]);
    setCoverageLabel(null);
    setLockHolderName(null);
    lockOwnedRef.current = false;
    const client = createBrowserSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      setAccessState("unauthorized");
      setStatus("Sign-in is required to view this encounter.");
      return;
    }

    const access = await getPortalAccess(client, "provider");
    if (access.error) {
      setAccessState("error");
      setStatus("We could not verify your encounter access.");
      return;
    }
    if (!access.data?.allowed || !access.data.organizationIds.length) {
      setAccessState("unauthorized");
      setStatus("This account is not authorized to record this encounter.");
      return;
    }

    const permissionResults = await Promise.all(
      access.data.organizationIds.map((candidateOrganizationId) =>
        hasOrganizationPermission(
          client,
          candidateOrganizationId,
          "can_start_consultation",
        ),
      ),
    );
    const permissionError = permissionResults.find((result) => result.error)?.error;
    if (permissionError) {
      setAccessState("error");
      setStatus("We could not verify your encounter access.");
      return;
    }
    const authorizedOrganizationIds = access.data.organizationIds.filter(
      (_candidateOrganizationId, index) => permissionResults[index]?.data,
    );
    if (!authorizedOrganizationIds.length) {
      setAccessState("unauthorized");
      setStatus("You do not have permission to record this encounter.");
      return;
    }

    const encounterLookups = await Promise.all(
      authorizedOrganizationIds.map((candidateOrganizationId) =>
        client
          .from("encounters")
          .select("id, organization_id")
          .eq("id", encounterId)
          .eq("organization_id", candidateOrganizationId)
          .maybeSingle(),
      ),
    );
    const lookupError = encounterLookups.find((result) => result.error)?.error;
    if (lookupError) {
      setAccessState("error");
      setStatus("We could not verify your encounter access.");
      return;
    }
    const clinicId = encounterLookups.find((result) => result.data)?.data?.organization_id;
    if (!clinicId) {
      setAccessState("unauthorized");
      setStatus("This encounter is not available to your account.");
      return;
    }

    const clinicalResult = await getOrganizationClinicalRecords(client, clinicId);
    if (clinicalResult.error) {
      setAccessState("error");
      setStatus("We could not load this encounter securely.");
      return;
    }
    const currentEncounter = clinicalResult.data.encounters.find(
      (item) => item.id === encounterId,
    );
    if (!currentEncounter) {
      setAccessState("unauthorized");
      setStatus("This encounter is unavailable in your assigned clinic.");
      return;
    }

    const coverageDate = (currentEncounter.period_start ?? new Date().toISOString()).slice(0, 10);
    const { data: assignedRole } = await client
      .from("practitioner_roles")
      .select("id, practitioner_id")
      .eq("id", currentEncounter.practitioner_role_id ?? "")
      .maybeSingle();
    if (assignedRole) {
      const { data: activeGrant } = await client
        .from("practitioner_coverage_grants")
        .select("covered_practitioner_role_id")
        .eq("organization_id", clinicId)
        .eq("covering_practitioner_role_id", assignedRole.id)
        .lte("valid_from", coverageDate)
        .gt("valid_to", coverageDate)
        .limit(1)
        .maybeSingle();
      if (activeGrant) {
        const { data: coveredRole } = await client
          .from("practitioner_roles")
          .select("practitioner_id")
          .eq("id", activeGrant.covered_practitioner_role_id)
          .maybeSingle();
        if (coveredRole) {
          const { data: coveredDoctor } = await client
            .from("practitioners")
            .select("name")
            .eq("id", coveredRole.practitioner_id)
            .maybeSingle();
          if (coveredDoctor) setCoverageLabel(`Covering for ${getHumanNameDisplay(coveredDoctor.name)}`);
        }
      }
    }

    const patientResult = await getOrganizationPatient(
      client,
      clinicId,
      currentEncounter.patient_id,
    );
    if (patientResult.error || !patientResult.data) {
      setAccessState("error");
      setStatus("We could not load this encounter securely.");
      return;
    }

    const [coverageResult, preferenceResult] = await Promise.all([
      getPatientCoverages(client, clinicId, currentEncounter.patient_id),
      getMyEncounterViewMode(client),
    ]);

    const [prescribePermission, diagnosticsPermission, inventoryPermission, inventoryViewPermission] =
      await Promise.all([
        hasOrganizationPermission(client, clinicId, "can_start_consultation"),
        hasOrganizationPermission(client, clinicId, "can_order_diagnostics"),
        hasOrganizationPermission(client, clinicId, "can_tag_inventory_usage"),
        hasOrganizationPermission(client, clinicId, "can_view_inventory"),
      ]);
    if (
      prescribePermission.error ||
      diagnosticsPermission.error ||
      inventoryPermission.error ||
      inventoryViewPermission.error
    ) {
      setAccessState("error");
      setStatus("We could not verify the encounter tools securely.");
      return;
    }

    const [departmentResult, inventoryResult, laboratoryResult, specialistResult] =
      await Promise.all([
        inventoryViewPermission.data
          ? getCurrentStaffDepartment(client, clinicId)
          : Promise.resolve(null),
        inventoryViewPermission.data
          ? getInventoryWorkspace(client, clinicId)
          : Promise.resolve(null),
        diagnosticsPermission.data
          ? getLaboratoryServices(client, clinicId)
          : Promise.resolve(null),
        diagnosticsPermission.data
          ? getSpecialistOptions(client, clinicId)
          : Promise.resolve(null),
      ]);
    if (
      (departmentResult && departmentResult.error) ||
      (inventoryResult && inventoryResult.error) ||
      (laboratoryResult && laboratoryResult.error) ||
      (specialistResult && specialistResult.error)
    ) {
      setAccessState("error");
      setStatus("We could not load the encounter tools securely.");
      return;
    }

    setOrganizationId(clinicId);
    setEncounter(currentEncounter);
    setPatient(patientResult.data);
    setCoverages(coverageResult.error ? [] : coverageResult.data);
    if (!preferenceResult.error) setPreferredMode(preferenceResult.data);
    setRecords(clinicalResult.data);
    setCanPrescribe(prescribePermission.data);
    setCanOrderDiagnostics(diagnosticsPermission.data);
    setCanViewInventory(inventoryViewPermission.data);
    setCanTagInventory(inventoryPermission.data);
    if (departmentResult) {
      setDepartmentId(departmentResult.data);
      setDepartmentSelection(departmentResult.data ?? "");
    }
    if (inventoryResult) setInventory(inventoryResult.data);
    if (laboratoryResult) setLaboratoryServices(laboratoryResult.data);
    if (specialistResult) setSpecialists(specialistResult.data);
    setAccessState("ready");
    setStatus("Encounter record ready.");
  }, [encounterId]);

  useEffect(() => {
    void loadEncounter();
  }, [loadEncounter]);

  useEffect(() => {
    if (!encounter || encounter.status !== "in_progress") return;
    let cancelled = false;
    const client = createBrowserSupabaseClient();
    const refreshPresence = async () => {
      if (!lockOwnedRef.current) {
        const current = await getEncounterLock(client, encounter.id);
        if (!cancelled && current.data) setLockHolderName(current.data.practitioner_name);
        if (!current.data && !cancelled) {
          const acquired = await acquireEncounterLock(client, encounter.id);
          if (!acquired.error) {
            lockOwnedRef.current = true;
            setLockHolderName(null);
          }
        }
        return;
      }
      const heartbeat = await heartbeatEncounterLock(client, encounter.id);
      if (heartbeat.error) {
        lockOwnedRef.current = false;
        const current = await getEncounterLock(client, encounter.id);
        if (!cancelled) setLockHolderName(current.data?.practitioner_name ?? null);
      }
    };
    void refreshPresence();
    const timer = window.setInterval(() => void refreshPresence(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (lockOwnedRef.current) {
        lockOwnedRef.current = false;
        void releaseEncounterLock(client, encounter.id);
      }
    };
  }, [encounter]);

  const currentSoapNote = useMemo(
    () => records?.observations.find(
      (item) => item.encounter_id === encounterId && item.code === "SOAP-NOTE",
    ),
    [encounterId, records?.observations],
  );

  // Initialize or synchronize SOAP input if not dirtied
  useEffect(() => {
    if (
      currentSoapNote &&
      !soapDirty &&
      (!latestSoapNoteIdRef.current || currentSoapNote.id === latestSoapNoteIdRef.current)
    ) {
      const text = clinicalText(currentSoapNote.value);
      setSoapInput(text);
      soapInputRef.current = text;
      lastSavedSoapTextRef.current = text;
      latestSoapNoteIdRef.current = currentSoapNote.id;
      setLatestSoapNoteId(currentSoapNote.id);
    }
  }, [currentSoapNote, soapDirty]);

  useEffect(() => {
    soapInputRef.current = soapInput;
  }, [soapInput]);

  useEffect(() => {
    latestSoapNoteIdRef.current = null;
    lastSavedSoapTextRef.current = "";
    setLatestSoapNoteId(null);
    setSoapLastSavedAt(null);
    setSoapAutosaveState("idle");
  }, [encounterId]);

  const priorEncounters = useMemo(
    () => (records?.encounters ?? [])
      .filter((item) => item.patient_id === encounter?.patient_id && item.id !== encounterId)
      .sort((a, b) => (b.period_start ?? "").localeCompare(a.period_start ?? "")),
    [encounter?.patient_id, encounterId, records?.encounters],
  );
  const filteredPriorEncounters = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return priorEncounters;
    return priorEncounters.filter((prior) => {
      const related = [
        prior.service_type,
        prior.status,
        ...records?.observations.filter((item) => item.encounter_id === prior.id).flatMap((item) => [item.code, item.code_display, clinicalText(item.value), item.note]) ?? [],
        ...records?.medicationRequests.filter((item) => item.encounter_id === prior.id).flatMap((item) => [item.medication_display, item.medication_code, item.note]) ?? [],
        ...records?.documentReferences.filter((item) => item.encounter_id === prior.id).flatMap((item) => [item.content_title, item.description]) ?? [],
        ...records?.serviceRequests.filter((item) => item.encounter_id === prior.id).flatMap((item) => [item.code_display, item.code, item.note]) ?? [],
      ];
      return related.some((value) => value?.toLowerCase().includes(query));
    });
  }, [historyQuery, priorEncounters, records]);
  const effectiveMode: EncounterViewMode = forceSimpleMode ? "simple" : preferredMode;
  const activeCoverage = coverages.find((coverage) => coverage.status === "active") ?? coverages[0] ?? null;
  const regionDiagnoses = useMemo<EncounterRegionDiagnosis[]>(
    () => (records?.encounters ?? [])
      .filter((item) => item.patient_id === encounter?.patient_id)
      .flatMap(getEncounterRegionDiagnoses),
    [encounter?.patient_id, records?.encounters],
  );
  const patientObservations = useMemo(
    () => (records?.observations ?? []).filter((observation) => observation.patient_id === encounter?.patient_id),
    [encounter?.patient_id, records?.observations],
  );
  const vitalReadings = useMemo(
    () => buildClinicalVitalReadings(patientObservations),
    [patientObservations],
  );
  const patientDetails = `${patient?.birth_date ?? "Birth date not recorded"} · ${patient?.gender ?? "Gender not recorded"}`;
  const heldQuantityByStockId = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const hold of inventory?.holds ?? []) {
      quantities.set(hold.stock_id, (quantities.get(hold.stock_id) ?? 0) + Number(hold.quantity));
    }
    return quantities;
  }, [inventory?.holds]);
  const availableTagQuantity = tagStockId
    ? Math.max(
      0,
      Number(inventory?.stock.find((stock) => stock.id === tagStockId)?.quantity ?? 0) -
        (heldQuantityByStockId.get(tagStockId) ?? 0),
    )
    : null;
  const completionBlocker = !latestSoapNoteId
    ? "Save clinical documentation before completing this encounter."
    : soapDirty
      ? "Save or discard the current documentation changes before completing."
      : null;

  // Core Test Fill function
  const applyTestFill = useCallback(
    (
      scope:
        | "all"
        | "soap"
        | "orders"
        | "rx"
        | "cert"
        | "lab"
        | "referral"
        | "tagging",
    ) => {
      const data = generateRandomEncounterData({
        laboratoryServices,
        specialists,
        inventory,
        currentDepartmentId: departmentSelection || departmentId,
      });

      setActiveProfileName(data.profile.name);

      if (scope === "all" || scope === "soap") {
        setSoapInput(data.soap);
        setSoapDirty(true);
      }

      if (scope === "all" || scope === "orders" || scope === "rx") {
        setRxMedication(data.prescription.medication);
        setRxDosage(data.prescription.dosage);
        setRxNote(data.prescription.note);
      }

      if (scope === "all" || scope === "orders" || scope === "cert") {
        setCertTitle(data.certificate.title);
        setCertStatement(data.certificate.statement);
      }

      if (scope === "all" || scope === "orders" || scope === "lab") {
        setLabServiceId(data.laboratory.serviceId);
        setLabPriority(data.laboratory.priority);
        setLabNote(data.laboratory.note);
      }

      if (scope === "all" || scope === "orders" || scope === "referral") {
        setSelectedSpecialistRoleId(data.referral.specialistRoleId);
        setReferralPriority(data.referral.priority);
        setReferralNote(data.referral.note);
      }

      if (scope === "all" || scope === "orders" || scope === "tagging") {
        if (data.inventory.departmentId && !departmentId) {
          setDepartmentSelection(data.inventory.departmentId);
        }
        setTagStockId(data.inventory.stockId);
        setTagQuantity(data.inventory.quantity);
      }

      const scopeLabels: Record<typeof scope, string> = {
        all: "All encounter inputs",
        soap: "SOAP documentation",
        orders: "All orders & charges",
        rx: "Prescription",
        cert: "Medical Certificate",
        lab: "Laboratory order",
        referral: "Specialist referral",
        tagging: "Item tagging",
      };

      setDebugToast(`✨ Test Fill applied: ${scopeLabels[scope]} (${data.profile.name})`);
      setStatus(`Test Fill generated random clinical inputs for ${data.profile.name}.`);
    },
    [
      departmentId,
      departmentSelection,
      inventory,
      laboratoryServices,
      specialists,
    ],
  );

  const persistSoapNote = useCallback(async (source: "auto" | "manual") => {
    const text = soapInputRef.current.trim();
    if (!text) return false;

    // If a save operation is already in-flight, wait for it to complete
    if (soapSaveInFlightRef.current && soapSavePromiseRef.current) {
      const inFlightSuccess = await soapSavePromiseRef.current;
      if (source === "manual" && inFlightSuccess) {
        setStatus("Consultation note saved.");
        setSoapSaveConfirmation({
          noteSnippet: text,
          revisionNumber: soapAutosaveRevision > 0 ? soapAutosaveRevision : 1,
          timestamp: soapLastSavedAt ?? new Date(),
        });
      }
      return inFlightSuccess;
    }

    // If identical text is already saved in the database, don't spam duplicate records
    if (text === lastSavedSoapTextRef.current) {
      setSoapDirty(false);
      setSoapAutosaveState("saved");
      if (source === "manual") {
        setStatus("Consultation note saved.");
        setSoapSaveConfirmation({
          noteSnippet: text,
          revisionNumber: soapAutosaveRevision > 0 ? soapAutosaveRevision : 1,
          timestamp: soapLastSavedAt ?? new Date(),
        });
      }
      return true;
    }

    const saveExecution = (async () => {
      soapSaveInFlightRef.current = true;
      setSoapAutosaveState("saving");
      const result = await saveSoapNote(createBrowserSupabaseClient(), {
        encounterId,
        text,
        supersedesId: latestSoapNoteIdRef.current ?? undefined,
        expectedVersion: encounter?.version,
      });
      soapSaveInFlightRef.current = false;

      if (result.error) {
        if (result.error.message === "ENCOUNTER_VERSION_CONFLICT" || result.error.details === "ENCOUNTER_VERSION_CONFLICT") {
          setVersionConflictOpen(true);
          setStatus("This chart changed since you opened it.");
          return false;
        }
        setSoapAutosaveState("error");
        setStatus(`Unable to save the consultation note: ${result.error.message}`);
        return false;
      }

      latestSoapNoteIdRef.current = result.data.observationId;
      lastSavedSoapTextRef.current = text;
      setLatestSoapNoteId(result.data.observationId);
      setEncounter((current) => current ? { ...current, version: result.data.version } : current);
      const savedDate = new Date();
      setSoapLastSavedAt(savedDate);

      const hasNewerChanges = soapInputRef.current.trim() !== text;
      setSoapDirty(hasNewerChanges);
      setSoapAutosaveState(hasNewerChanges ? "pending" : "saved");
      const nextRev = soapAutosaveRevision + 1;
      setSoapAutosaveRevision(nextRev);

      if (source === "manual") {
        setStatus("Consultation note saved.");
        setSoapSaveConfirmation({
          noteSnippet: text,
          revisionNumber: nextRev,
          timestamp: savedDate,
        });
      }
      return true;
    })();

    soapSavePromiseRef.current = saveExecution;
    try {
      return await saveExecution;
    } finally {
      if (soapSavePromiseRef.current === saveExecution) {
        soapSavePromiseRef.current = null;
      }
    }
  }, [encounter, encounterId, soapAutosaveRevision, soapLastSavedAt]);

  useEffect(() => {
    if (
      !soapDirty ||
      !soapInput.trim() ||
      encounter?.status !== "in_progress"
    ) {
      return;
    }

    if (soapInput.trim() === lastSavedSoapTextRef.current) {
      setSoapDirty(false);
      setSoapAutosaveState("saved");
      return;
    }

    setSoapAutosaveState("pending");
    const timeout = window.setTimeout(() => {
      void persistSoapNote("auto");
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [encounter?.status, persistSoapNote, soapAutosaveRevision, soapDirty, soapInput]);

  // Easter Egg detection in SOAP documentation textarea
  function handleSoapChange(val: string) {
    setSoapInput(val);
    setSoapDirty(true);

    const trimmedUpper = val.trim().toUpperCase();

    // Check if the user typed or entered "ODC" (case-insensitive)
    if (trimmedUpper === "ODC") {
      setDebugMode(true);
      setDeveloperModeActive(true);
      applyTestFill("all");
      setDebugToast(
        "🎉 Easter Egg Unlocked: ODC Developer Debug Mode Activated! Test Fill executed.",
      );
      setStatus(
        "Easter Egg Active: Developer Mode unlocked and Test Fill applied across all encounter inputs.",
      );
    } else if (!debugMode && trimmedUpper.includes("ODC")) {
      setDebugMode(true);
      setDeveloperModeActive(true);
      setDebugToast(
        "🎉 Easter Egg Unlocked: ODC Developer Debug Mode Activated! Use 'Test Fill' to generate randomized inputs.",
      );
      setStatus("Easter Egg Active: Developer Mode unlocked.");
    }
  }

  async function selectEncounterMode(mode: EncounterViewMode) {
    if (forceSimpleMode && mode === "visual") return;
    setPreferredMode(mode);
    const result = await saveMyEncounterViewMode(createBrowserSupabaseClient(), mode);
    if (result.error) setStatus(`Unable to save view preference: ${result.error.message}`);
  }

  async function addRegionDiagnosis(text: string) {
    setDiagnosisBusy(true);
    const result = await recordEncounterRegionDiagnosis(createBrowserSupabaseClient(), {
      encounterId,
      regionCode: selectedRegion.code,
      regionDisplay: selectedRegion.display,
      anatomyView,
      diagnosisText: text,
    });
    setDiagnosisBusy(false);
    if (result.error) {
      setStatus(`Unable to add diagnosis: ${result.error.message}`);
      return;
    }
    await loadEncounter();
    setStatus(`${selectedRegion.display} diagnosis added to this encounter.`);
  }

  function handleClearDrafts() {
    setSoapInput(currentSoapNote ? clinicalText(currentSoapNote.value) : "");
    setSoapDirty(false);
    setRxMedication("");
    setRxDosage("");
    setRxNote("");
    setCertTitle("Medical Certificate");
    setCertStatement("");
    setPrescriptionTemplate(null);
    setAdditionalPrescriptionLines([]);
    setCertificateTemplate(null);
    setLabServiceId("");
    setLabPriority("routine");
    setLabNote("");
    setSelectedSpecialistRoleId("");
    setReferralPriority("routine");
    setReferralNote("");
    setTagStockId("");
    setTagQuantity("1");
    setDebugToast("Draft encounter inputs cleared.");
  }

  function handleExitDevMode() {
    setDebugMode(false);
    setDeveloperModeActive(false);
    setDebugToast(null);
    setStatus("Developer debug mode disabled.");
  }

  function previewPrescription(prescriptionOrList: MedicationRequestSummary | MedicationRequestSummary[]) {
    const list = Array.isArray(prescriptionOrList) ? prescriptionOrList : [prescriptionOrList];
    const first = list[0];
    if (!first) return;

    const body = list
      .map((p, idx) => {
        const prefix = list.length > 1 ? `℞ ${idx + 1}. ` : "Medication: ";
        return [
          `${prefix}${p.medication_display ?? p.medication_code}`,
          `Directions: ${dosageText(p.dosage_instruction) || "Not recorded"}`,
          p.note ? `Note: ${p.note}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const opened = openExportPreview({
      title: "Medical Prescription",
      patientName: patient?.displayName ?? "Patient",
      patientDetails,
      issuedAt: dateTime(first.authored_on),
      body,
    });
    if (!opened) setStatus("Allow pop-ups to preview and export the prescription.");
  }

  function previewCertificate(document: DocumentReferenceSummary) {
    const opened = openExportPreview({
      title: document.content_title ?? "Medical Certificate",
      patientName: patient?.displayName ?? "Patient",
      patientDetails,
      issuedAt: dateTime(document.date_at),
      body: document.description ?? "No statement was recorded.",
    });
    if (!opened) setStatus("Allow pop-ups to preview and export the medical certificate.");
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!soapInputRef.current.trim()) return;
    await persistSoapNote("manual");
  }

  async function completeEncounter() {
    if (completionBlocker) {
      setStatus(completionBlocker);
      return;
    }
    setBusy(true);
    const result = await finishClinicalEncounter(createBrowserSupabaseClient(), encounterId, encounter?.version);
    setBusy(false);
    if (result.error) {
      if (result.error.message === "ENCOUNTER_VERSION_CONFLICT" || result.error.details === "ENCOUNTER_VERSION_CONFLICT") {
        setVersionConflictOpen(true);
        setStatus("This chart changed since you opened it.");
        return;
      }
      setStatus(`Unable to complete encounter: ${result.error.message}`);
      return;
    }
    await loadEncounter();
    setCompletionDialogOpen(false);
    setStatus("Encounter completed and shared with the patient.");
  }

  async function issueEncounterPrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const medication = (rxMedication || String(fields.get("medication") ?? "")).trim();
    const dosage = (rxDosage || String(fields.get("dosage") ?? "")).trim();
    const note = (rxNote || String(fields.get("note") ?? "")).trim();

    setBusy(true);
    const regimen = [
      { medication, dosage, note },
      ...additionalPrescriptionLines.map((line) => ({ medication: line.name, dosage: [line.dosage, line.frequency, line.duration].filter(Boolean).join(" · "), note: line.notes })),
    ];
    const result = regimen.length > 1
      ? await issuePrescriptionRegimen(createBrowserSupabaseClient(), { encounterId, medications: regimen, templateId: prescriptionTemplate?.templateId, templateVersion: prescriptionTemplate?.templateVersion })
      : await issuePrescription(createBrowserSupabaseClient(), { encounterId, medication, dosage, note, templateId: prescriptionTemplate?.templateId, templateVersion: prescriptionTemplate?.templateVersion });
    setBusy(false);
    if (result.error)
      return setStatus(`Unable to issue prescription: ${result.error.message}`);
    setRxMedication("");
    setRxDosage("");
    setRxNote("");
    setPrescriptionTemplate(null);
    setAdditionalPrescriptionLines([]);
    form.reset();
    await loadEncounter();
    setStatus("Prescription issued.");
    setOrderSaveConfirmation({
      title: "Prescription Issued & Recorded",
      subtitle: "Medication regimen has been digitally recorded in the patient's EHR prescription history.",
      badge: "PRESCRIPTION COMMITTED",
      recordType: "prescription",
      summaryItems: [
        { label: "Medication", value: medication, highlight: true },
        { label: "Dosage / Directions", value: dosage },
        ...(additionalPrescriptionLines.length > 0
          ? [{ label: "Total Regimen", value: `${additionalPrescriptionLines.length + 1} lines` }]
          : []),
      ],
      detailsSnippet: note ? { title: "Prescription Note", content: note } : undefined,
    });
  }

  async function issueEncounterCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = (certTitle || String(fields.get("title") ?? "")).trim();
    const statement = (certStatement || String(fields.get("statement") ?? "")).trim();

    setBusy(true);
    const result = await issueMedicalCertificate(createBrowserSupabaseClient(), {
      encounterId,
      title,
      statement,
      templateId: certificateTemplate?.templateId,
      templateVersion: certificateTemplate?.templateVersion,
    });
    setBusy(false);
    if (result.error)
      return setStatus(`Unable to issue certificate: ${result.error.message}`);
    setCertTitle("Medical Certificate");
    setCertStatement("");
    setCertificateTemplate(null);
    form.reset();
    await loadEncounter();
    setStatus("Medical certificate issued.");
    setOrderSaveConfirmation({
      title: "Medical Certificate Issued & Saved",
      subtitle: "The medical certificate has been archived and attached to this encounter record.",
      badge: "DOCUMENT COMMITTED",
      recordType: "certificate",
      summaryItems: [
        { label: "Document Title", value: title, highlight: true },
        { label: "Encounter ID", value: `ENC-${encounterId.slice(0, 8).toUpperCase()}` },
      ],
      detailsSnippet: statement ? { title: "Certificate Statement", content: statement } : undefined,
    });
  }

  async function createEncounterRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const category = String(fields.get("category")) as
      | "laboratory"
      | "referral";
    const priority =
      (category === "laboratory" ? labPriority : referralPriority) ||
      (String(fields.get("priority")) as
        | "routine"
        | "urgent"
        | "asap"
        | "stat");
    const note =
      (category === "laboratory" ? labNote : referralNote) ||
      String(fields.get("note") ?? "").trim();
    const performerPractitionerRoleId =
      category === "referral"
        ? (selectedSpecialistRoleId || String(fields.get("specialistRoleId") ?? ""))
        : null;
    const laboratoryServiceId =
      category === "laboratory"
        ? (labServiceId || String(fields.get("laboratoryServiceId") ?? ""))
        : null;

    setBusy(true);
    const result = await createDiagnosticServiceRequest(
      createBrowserSupabaseClient(),
      {
        encounterId,
        category,
        priority,
        note,
        performerPractitionerRoleId,
        laboratoryServiceId,
      },
    );
    setBusy(false);
    if (result.error)
      return setStatus(`Unable to place request: ${result.error.message}`);
    form.reset();
    if (category === "laboratory") {
      setLabServiceId("");
      setLabPriority("routine");
      setLabNote("");
    } else {
      setSelectedSpecialistRoleId("");
      setReferralPriority("routine");
      setReferralNote("");
    }
    await loadEncounter();
    setStatus(
      category === "laboratory"
        ? "Laboratory order placed."
        : "Specialist referral placed.",
    );
    setOrderSaveConfirmation({
      title: `${category === "laboratory" ? "Laboratory Order" : "Specialist Referral"} Saved`,
      subtitle: `Your ${category === "laboratory" ? "lab request" : "referral request"} has been placed and attached to this encounter record.`,
      badge: "ORDER COMMITTED",
      recordType: "order",
      summaryItems: [
        { label: "Category", value: category === "laboratory" ? "Laboratory Diagnostic" : "Specialist Referral", highlight: true },
        { label: "Priority", value: priority.toUpperCase(), badgeVariant: priority === "stat" || priority === "urgent" ? "danger" : "info" },
      ],
      detailsSnippet: note ? { title: "Order Notes / Instructions", content: note } : undefined,
    });
  }

  async function tagEncounterItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const stockId = tagStockId || String(fields.get("stockId") ?? "");
    const quantity = Number(tagQuantity || fields.get("quantity"));
    const selectedAvailableQuantity = Math.max(
      0,
      Number(inventory?.stock.find((stock) => stock.id === stockId)?.quantity ?? 0) -
        (heldQuantityByStockId.get(stockId) ?? 0),
    );

    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > selectedAvailableQuantity) {
      setStatus(`Enter a quantity up to ${selectedAvailableQuantity.toLocaleString()} unreserved units for the selected department.`);
      return;
    }

    setBusy(true);
    const result = await tagInventoryUsage(createBrowserSupabaseClient(), {
      encounterId,
      stockId,
      quantity,
      departmentId: departmentSelection || null,
    });
    setBusy(false);
    if (result.error)
      return setStatus(`Unable to tag consumable: ${result.error.message}`);
    setTagStockId("");
    setTagQuantity("1");
    form.reset();
    await loadEncounter();
    setStatus("Item tagged for this encounter and held for billing.");
  }

  if (accessState !== "ready") {
    return (
      <AccessState
        actionHref="/"
        actionLabel="Return to provider workspace"
        description={
          accessState === "loading"
            ? "We are verifying your clinical permissions."
            : accessState === "unauthorized"
              ? "You do not have permission to view or record this encounter. A link alone does not grant access."
              : "We could not securely verify this encounter. Please return to the provider workspace and try again."
        }
        eyebrow="Encounter recording"
        variant={accessState}
      />
    );
  }

  return (
    <main className="encounter-shell">
      <header className="encounter-header">
        <div>
          <Link className="encounter-back" href="/">← Back to daily queue</Link>
          <p className="eyebrow">Focused encounter recording</p>
          <h1>{patient?.displayName ?? "Patient encounter"}</h1>
          {coverageLabel && <p className="encounter-coverage-indicator">{coverageLabel}</p>}
          <p>{encounter?.service_type ?? "Clinical consultation"} · {patientDetails} · Started {dateTime(encounter?.period_start ?? null)}</p>
        </div>
        <div className="encounter-header-actions">
          {debugMode && (
            <span
              className="dev-easter-egg-tag dev-easter-egg-tag--header"
              title="ODC Easter Egg Debug Mode Active"
            >
              🧪 Debug Mode Active
            </span>
          )}
          {encounter && <Badge variant={encounter.status === "in_progress" ? "success" : "muted"}>{encounter.status.replaceAll("_", " ")}</Badge>}
          {encounter?.status === "in_progress" && (
            <div className="encounter-completion-control">
              <Button
                disabled={busy || Boolean(completionBlocker)}
                onClick={() => setCompletionDialogOpen(true)}
                title={completionBlocker ?? "Review completion before closing the encounter"}
              >
                Complete encounter
              </Button>
              {completionBlocker ? <span>{completionBlocker}</span> : null}
            </div>
          )}
        </div>
      </header>

      <dialog
        className="encounter-completion-dialog"
        onCancel={() => setCompletionDialogOpen(false)}
        onClose={() => setCompletionDialogOpen(false)}
        ref={completionDialogRef}
      >
        <form method="dialog">
          <p className="eyebrow">Close encounter</p>
          <h2>Complete this encounter?</h2>
          <p>The note is saved and this action shares the completed record with the patient. Orders and documents already added remain attached to this encounter.</p>
          <div>
            <Button onClick={() => setCompletionDialogOpen(false)} type="button" variant="outline">Keep documenting</Button>
            <Button disabled={busy} onClick={() => void completeEncounter()} type="button">{busy ? "Completing…" : "Complete encounter"}</Button>
          </div>
        </form>
      </dialog>

      {/* Developer Debug Mode Toolbar */}
      {debugMode && (
        <EncounterDevBar
          activeProfileName={activeProfileName}
          onTestFillAll={() => applyTestFill("all")}
          onTestFillSoap={() => applyTestFill("soap")}
          onTestFillOrders={() => applyTestFill("orders")}
          onClearDrafts={handleClearDrafts}
          onExitDevMode={handleExitDevMode}
        />
      )}

      {/* Easter Egg / Debug Notification Toast */}
      {debugToast && (
        <div className="encounter-dev-toast" role="status" aria-live="polite">
          <div className="dev-toast-content">
            <span className="dev-toast-icon">⚡</span>
            <span>{debugToast}</span>
          </div>
          <button
            type="button"
            className="dev-toast-close"
            onClick={() => setDebugToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <p className="encounter-status" role="status" aria-live="polite">{status}</p>
      {lockHolderName && (
        <p className="encounter-presence" role="status">
          Dr. {lockHolderName} is editing this chart. You can still save your work.
        </p>
      )}

      {versionConflictOpen && (
        <div className="encounter-conflict-dialog" role="dialog" aria-modal="true" aria-labelledby="encounter-conflict-heading">
          <h2 id="encounter-conflict-heading">This chart changed since you opened it</h2>
          <p>Your typed draft is still here. Reload latest updates the chart context without discarding this draft.</p>
          <div className="encounter-conflict-dialog__actions">
            <Button type="button" variant="outline" onClick={() => setVersionConflictOpen(false)}>Keep editing</Button>
            <Button type="button" onClick={() => { setVersionConflictOpen(false); void loadEncounter(); }}>Reload latest</Button>
          </div>
        </div>
      )}

      {encounter && patient && records && (
        <div className="encounter-layout">
          <aside className="encounter-context" aria-label="Patient details and vitals">
            <details className="encounter-context-drawer" open>
              <summary className="encounter-context-drawer__summary">
                <div className="encounter-context-drawer__header">
                  <span className="eyebrow">Patient &amp; vitals</span>
                  <strong>{patient.displayName}</strong>
                  <span className="encounter-context-drawer__meta">{patientDetails}</span>
                </div>
                <span className="encounter-context-drawer__chevron" aria-hidden="true">▾</span>
              </summary>
              <div className="encounter-context-drawer__content">
                <ClinicalPatientCard
                  bloodType={patient.blood_type}
                  birthDate={patient.birth_date}
                  compact
                  displayName={patient.displayName}
                  gender={patient.gender}
                  photoUrl={patient.photo_url}
                  planName={jsonDisplay(activeCoverage?.payor) ?? activeCoverage?.coverage_type?.replaceAll("_", " ")}
                  policyNumber={activeCoverage?.subscriber_id}
                  qrPayload={createPatientQrPayload(organizationId ?? encounter.organization_id, patient.id)}
                />
                <ClinicalVitalsPanel readings={vitalReadings} />
              </div>
            </details>
          </aside>

          <section className="encounter-recording" aria-labelledby="encounter-recording-heading">
            <ClinicalDocumentationWorkspace
              forceSimpleMode={forceSimpleMode}
              headingId="encounter-recording-heading"
              mode={effectiveMode}
              onModeChange={(mode) => void selectEncounterMode(mode)}
              simpleContent={
                <EncounterSoapEditor
                  busy={busy}
                  canEdit={encounter.status === "in_progress"}
                  currentNoteId={latestSoapNoteId}
                  debugMode={debugMode}
                  encounterId={encounterId}
                  autosaveState={soapAutosaveState}
                  isDirty={soapDirty}
                  lastSavedAt={soapLastSavedAt ? soapLastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null}
                  onChange={handleSoapChange}
                  onRetryAutosave={() => void persistSoapNote("manual")}
                  onSubmit={saveNote}
                  onTestFillAll={() => applyTestFill("all")}
                  onTestFillSoap={() => applyTestFill("soap")}
                  value={soapInput}
                />
              }
              visualContent={
                <section className="encounter-assessment-workspace" aria-label="Visual assessment workspace">
                <MusculoskeletalFigure
                  activeRegionCodes={[...new Set(regionDiagnoses.map((diagnosis) => diagnosis.regionCode))]}
                  anatomyView={anatomyView}
                  onRegionSelect={setSelectedRegion}
                  onViewChange={setAnatomyView}
                  selectedRegionCode={selectedRegion.code}
                />
                <MusculoskeletalRegionPanel
                  busy={diagnosisBusy}
                  diagnoses={regionDiagnoses}
                  encounterOpen={encounter.status === "in_progress"}
                  onDiagnosisSubmit={addRegionDiagnosis}
                  onRegionChange={setSelectedRegion}
                  selectedRegion={selectedRegion}
                />
              </section>
              }
            />

            <EncounterDiagnosisPanel
              canEdit={encounter.status === "in_progress" || encounter.status === "finished"}
              encounterId={encounterId}
            />

            {encounter.status === "in_progress" && (
              <ClinicalOrdersAndCharges
                actions={[
                  ...(canPrescribe ? [{ id: "prescription" as const, label: "Prescription" }, { id: "certificate" as const, label: "Medical certificate" }] : []),
                  ...(canOrderDiagnostics ? [{ id: "laboratory" as const, label: "Laboratory order" }, { id: "referral" as const, label: "Specialist referral" }] : []),
                  ...(canTagInventory ? [{ id: "tagging" as const, label: "Item tagging" }] : []),
                ]}
                activeAction={activeAction}
                onActionChange={setActiveAction}
                headingAside={
                    debugMode ? (
                      <Button
                        id="odc-orders-test-fill-btn"
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => applyTestFill("orders")}
                        title="Randomly populate all order and charge forms"
                      >
                        ⚡ Test Fill All Orders
                      </Button>
                    ) : null
                }
              >
                <div className="encounter-actions-grid">
                  {canPrescribe && activeAction === "prescription" && (
                    <section className="encounter-action-card">
                      <div className="encounter-card-header">
                        <h3>Prescription</h3>
                        {debugMode && (
                          <button
                            type="button"
                            id="odc-rx-fill-btn"
                            className="encounter-card-fill-btn"
                            onClick={() => applyTestFill("rx")}
                            title="Randomly generate prescription inputs"
                          >
                            ⚡ Test Fill
                          </button>
                        )}
                      </div>
                      <form className="stack encounter-action-form" onSubmit={issueEncounterPrescription}>
                        <ClinicalTemplatePicker encounterId={encounterId} type="prescription" onApply={(template) => { setPrescriptionTemplate(template); setAdditionalPrescriptionLines(template?.medications.slice(1) ?? []); if (template) { const first = template.medications[0]; setRxMedication(first?.name ?? ""); setRxDosage([first?.dosage, first?.frequency, first?.duration].filter(Boolean).join(" · ")); setRxNote([template.body, first?.notes].filter(Boolean).join("\n\n")); } }} />
                        <Field label="Medication">
                          <Input
                            id="odc-rx-medication"
                            name="medication"
                            maxLength={240}
                            autoComplete="off"
                            value={rxMedication}
                            onChange={(e) => setRxMedication(e.target.value)}
                            required
                          />
                        </Field>
                        <Field label="Dosage and directions">
                          <textarea
                            id="odc-rx-dosage"
                            className="odyssey-input"
                            name="dosage"
                            rows={3}
                            maxLength={1000}
                            value={rxDosage}
                            onChange={(e) => setRxDosage(e.target.value)}
                            required
                          />
                        </Field>
                        <Field className="encounter-field-full" label="Note">
                          <Input
                            id="odc-rx-note"
                            name="note"
                            maxLength={1000}
                            value={rxNote}
                            onChange={(e) => setRxNote(e.target.value)}
                          />
                        </Field>
                        {additionalPrescriptionLines.map((line, index) => (
                          <fieldset
                            className="encounter-field-full template-issued-medication"
                            key={`${line.name}-${index}`}
                            style={{
                              position: "relative",
                              border: "1px dashed var(--odyssey-border, #cbd5e1)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              marginBottom: "8px",
                              background: "#f8fafc",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                              <legend style={{ fontWeight: 600, color: "#0f766e", fontSize: "0.875rem" }}>
                                Additional medication #{index + 2}
                              </legend>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setAdditionalPrescriptionLines((lines) =>
                                    lines.filter((_, itemIndex) => itemIndex !== index)
                                  )
                                }
                                style={{ color: "#b91c1c", fontSize: "0.8rem", padding: "2px 8px" }}
                              >
                                ✕ Remove
                              </Button>
                            </div>
                            <Field label="Medication">
                              <Input
                                value={line.name}
                                placeholder="Medication name and strength"
                                onChange={(event) =>
                                  setAdditionalPrescriptionLines((lines) =>
                                    lines.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, name: event.target.value } : item
                                    )
                                  )
                                }
                                required
                              />
                            </Field>
                            <Field label="Dosage and directions">
                              <Input
                                value={[line.dosage, line.frequency, line.duration].filter(Boolean).join(" · ")}
                                placeholder="Dosage, frequency, duration"
                                onChange={(event) =>
                                  setAdditionalPrescriptionLines((lines) =>
                                    lines.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, dosage: event.target.value, frequency: "", duration: "" }
                                        : item
                                    )
                                  )
                                }
                                required
                              />
                            </Field>
                            <Field label="Note">
                              <Input
                                value={line.notes ?? ""}
                                placeholder="Optional instruction (e.g. after meals)"
                                onChange={(event) =>
                                  setAdditionalPrescriptionLines((lines) =>
                                    lines.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, notes: event.target.value } : item
                                    )
                                  )
                                }
                              />
                            </Field>
                          </fieldset>
                        ))}
                        <div style={{ marginTop: "6px", marginBottom: "10px" }}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setAdditionalPrescriptionLines((lines) => [
                                ...lines,
                                { name: "", dosage: "", frequency: "", duration: "", notes: "" },
                              ])
                            }
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            ➕ Add another medication to prescription
                          </Button>
                        </div>
                        <Button className="encounter-form-submit" disabled={busy} type="submit">Issue prescription</Button>
                      </form>
                      {(() => {
                        const encounterMeds = records.medicationRequests.filter((item) => item.encounter_id === encounterId);
                        if (!encounterMeds.length) return null;
                        return (
                          <div className="encounter-current-records">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                              <h4 style={{ margin: 0 }}>Issued prescription ({encounterMeds.length} {encounterMeds.length === 1 ? "medication" : "medications"})</h4>
                              <Button
                                className="encounter-export-button"
                                onClick={() => previewPrescription(encounterMeds)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Preview and export prescription
                              </Button>
                            </div>
                            <article>
                              {encounterMeds.map((item, idx) => (
                                <div key={item.id} style={{ marginBottom: idx < encounterMeds.length - 1 ? "8px" : "0", paddingBottom: idx < encounterMeds.length - 1 ? "8px" : "0", borderBottom: idx < encounterMeds.length - 1 ? "1px solid var(--odyssey-border, #e2e8f0)" : "none" }}>
                                  <strong>{encounterMeds.length > 1 ? `${idx + 1}. ` : ""}{item.medication_display ?? item.medication_code}</strong>
                                  <p>{dosageText(item.dosage_instruction)}</p>
                                  {item.note && <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{item.note}</p>}
                                </div>
                              ))}
                            </article>
                          </div>
                        );
                      })()}
                    </section>
                  )}
                  {canPrescribe && activeAction === "certificate" && (
                    <section className="encounter-action-card">
                      <div className="encounter-card-header">
                        <h3>Medical certificate</h3>
                        {debugMode && (
                          <button
                            type="button"
                            id="odc-cert-fill-btn"
                            className="encounter-card-fill-btn"
                            onClick={() => applyTestFill("cert")}
                            title="Randomly generate medical certificate inputs"
                          >
                            ⚡ Test Fill
                          </button>
                        )}
                      </div>
                      <form className="stack encounter-action-form" onSubmit={issueEncounterCertificate}>
                        <ClinicalTemplatePicker encounterId={encounterId} type="medical_certificate" onApply={(template) => { setCertificateTemplate(template); if (template) { setCertTitle(template.title); setCertStatement(template.body); } }} />
                        <Field label="Certificate title">
                          <Input
                            id="odc-cert-title"
                            name="title"
                            value={certTitle}
                            onChange={(e) => setCertTitle(e.target.value)}
                            maxLength={200}
                            required
                          />
                        </Field>
                        <Field className="encounter-field-full" label="Statement">
                          <textarea
                            id="odc-cert-statement"
                            className="odyssey-input"
                            name="statement"
                            rows={5}
                            maxLength={5000}
                            value={certStatement}
                            onChange={(e) => setCertStatement(e.target.value)}
                            required
                          />
                        </Field>
                        <Button className="encounter-form-submit" disabled={busy} type="submit">Issue certificate</Button>
                      </form>
                      <CurrentRecords title="Issued medical certificates" items={records.documentReferences.filter((item) => item.encounter_id === encounterId && item.type_code === "medical-certificate")} render={(item) => <><strong>{item.content_title ?? item.type_display ?? "Medical certificate"}</strong><p>{item.description ?? "No description recorded."}</p><Button className="encounter-export-button" onClick={() => previewCertificate(item)} size="sm" type="button" variant="outline">Preview and export</Button></>} />
                    </section>
                  )}
                  {canOrderDiagnostics && activeAction === "laboratory" && (
                    <section className="encounter-action-card">
                      <div className="encounter-card-header">
                        <h3>Laboratory order</h3>
                        {debugMode && (
                          <button
                            type="button"
                            id="odc-lab-fill-btn"
                            className="encounter-card-fill-btn"
                            onClick={() => applyTestFill("lab")}
                            title="Randomly generate laboratory order inputs"
                          >
                            ⚡ Test Fill
                          </button>
                        )}
                      </div>
                      <form className="stack encounter-action-form" onSubmit={createEncounterRequest}>
                        <input name="category" type="hidden" value="laboratory" />
                        <Field label="Laboratory service">
                          <select
                            id="odc-lab-service-select"
                            className="odyssey-input"
                            name="laboratoryServiceId"
                            value={labServiceId}
                            onChange={(e) => setLabServiceId(e.target.value)}
                            required
                          >
                            <option disabled value="">Select a laboratory service</option>
                            {laboratoryServices.filter((service) => service.active).map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} · PHP {service.labCost.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <PriorityField
                          value={labPriority}
                          onChange={(val) => setLabPriority(val)}
                        />
                        <Field className="encounter-field-full" label="Clinical note">
                          <textarea
                            id="odc-lab-note"
                            className="odyssey-input"
                            name="note"
                            rows={3}
                            maxLength={5000}
                            value={labNote}
                            onChange={(e) => setLabNote(e.target.value)}
                          />
                        </Field>
                        <Button className="encounter-form-submit" disabled={busy} type="submit">Place lab order</Button>
                      </form>
                    </section>
                  )}
                  {canOrderDiagnostics && activeAction === "referral" && (
                    <section className="encounter-action-card">
                      <div className="encounter-card-header">
                        <h3>Specialist referral</h3>
                        {debugMode && (
                          <button
                            type="button"
                            id="odc-referral-fill-btn"
                            className="encounter-card-fill-btn"
                            onClick={() => applyTestFill("referral")}
                            title="Randomly generate specialist referral inputs"
                          >
                            ⚡ Test Fill
                          </button>
                        )}
                      </div>
                      <form className="stack encounter-action-form" onSubmit={createEncounterRequest}>
                        <input name="category" type="hidden" value="referral" />
                        <Field label="Specialist" hint="The affiliated clinic or hospital is shown with each specialist.">
                          <select
                            id="odc-referral-specialist-select"
                            className="odyssey-input"
                            name="specialistRoleId"
                            value={selectedSpecialistRoleId}
                            onChange={(event) => setSelectedSpecialistRoleId(event.target.value)}
                            required
                          >
                            <option disabled value="">Select a specialist</option>
                            {specialists.map((specialist) => (
                              <option key={specialist.practitionerRoleId} value={specialist.practitionerRoleId}>
                                {specialist.displayName} · {specialist.organizationName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <PriorityField
                          value={referralPriority}
                          onChange={(val) => setReferralPriority(val as "routine" | "urgent" | "asap")}
                        />
                        <Field className="encounter-field-full" label="Clinical note">
                          <textarea
                            id="odc-referral-note"
                            className="odyssey-input"
                            name="note"
                            rows={3}
                            maxLength={5000}
                            value={referralNote}
                            onChange={(e) => setReferralNote(e.target.value)}
                          />
                        </Field>
                        <Button className="encounter-form-submit" disabled={busy} type="submit">Place referral</Button>
                      </form>
                    </section>
                  )}
                  {canTagInventory && activeAction === "tagging" && (
                    <section className="encounter-action-card">
                      <div className="encounter-card-header">
                        <h3>Item tagging</h3>
                        {debugMode && (
                          <button
                            type="button"
                            id="odc-tag-fill-btn"
                            className="encounter-card-fill-btn"
                            onClick={() => applyTestFill("tagging")}
                            title="Randomly select available stock and quantity"
                          >
                            ⚡ Test Fill
                          </button>
                        )}
                      </div>
                      <p className="hint">Tagging holds the item for this patient and adds it to the draft bill.</p>
                      <form className="stack encounter-action-form" onSubmit={tagEncounterItem}>
                        <Field label="Department">
                          <select
                            id="odc-tag-department-select"
                            className="odyssey-input"
                            name="departmentId"
                            value={departmentSelection}
                            onChange={(event) => setDepartmentSelection(event.target.value)}
                            disabled={Boolean(departmentId)}
                            required
                          >
                            <option disabled value="">Select a department</option>
                            {inventory?.departments.filter((department) => department.active).map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name} ({department.code})
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Item and available stock">
                          <select
                            id="odc-tag-stock-select"
                            className="odyssey-input"
                            name="stockId"
                            value={tagStockId}
                            onChange={(e) => setTagStockId(e.target.value)}
                            required
                          >
                            <option disabled value="">Select available stock</option>
                            {inventory?.stock.filter((stock) => {
                              const availableQuantity = Number(stock.quantity) - (heldQuantityByStockId.get(stock.id) ?? 0);
                              return availableQuantity > 0 && (!departmentSelection || stock.department_id === departmentSelection);
                            }).map((stock) => {
                              const item = inventory.items.find((candidate) => candidate.id === stock.item_id);
                              const department = inventory.departments.find((candidate) => candidate.id === stock.department_id);
                              const availableQuantity = Math.max(0, Number(stock.quantity) - (heldQuantityByStockId.get(stock.id) ?? 0));
                              return (
                                <option key={stock.id} value={stock.id}>
                                  {item?.name ?? "Item"} · {department?.name ?? "Department"} ({availableQuantity.toLocaleString()} available {item?.unit_of_measure ?? "units"})
                                </option>
                              );
                            })}
                          </select>
                        </Field>
                        <Field label="Quantity used">
                          <Input
                            id="odc-tag-quantity"
                            name="quantity"
                            type="number"
                            min="0.001"
                            step="0.001"
                            max={availableTagQuantity ?? undefined}
                            value={tagQuantity}
                            onChange={(e) => setTagQuantity(e.target.value)}
                            required
                          />
                          {availableTagQuantity !== null && (
                            <small className="hint" role="status">
                              {availableTagQuantity.toLocaleString()} unreserved units can be held from this department.
                            </small>
                          )}
                        </Field>
                        <Button className="encounter-form-submit" disabled={busy} type="submit">Tag item</Button>
                      </form>
                      <CurrentRecords title="Tagged items" items={(inventory?.usages ?? []).filter((usage) => usage.encounter_id === encounterId)} render={(usage) => { const item = inventory?.items.find((candidate) => candidate.id === usage.item_id); return <><strong>{item?.name ?? "Item"}</strong><p>{Number(usage.quantity).toLocaleString()} {item?.unit_of_measure ?? "units"} · {usage.currency} {(Number(usage.unit_price) * Number(usage.quantity)).toFixed(2)}</p></>; }} />
                    </section>
                  )}
                </div>
                {canOrderDiagnostics && <CurrentRecords title="Current orders and referrals" items={records.serviceRequests.filter((item) => item.encounter_id === encounterId)} render={(item) => <><strong>{item.code_display ?? item.code}</strong><p>{item.category} · {item.status.replaceAll("_", " ")}</p>{item.note && <p>{item.note}</p>}</>} />}
                <section className="encounter-added-actions" aria-labelledby="encounter-added-actions-heading">
                  <h3 id="encounter-added-actions-heading">Added to this encounter</h3>
                  <ul>
                    {records.medicationRequests.filter((item) => item.encounter_id === encounterId).map((item) => <li key={`rx-${item.id}`}>Prescription: {item.medication_display ?? item.medication_code}</li>)}
                    {records.documentReferences.filter((item) => item.encounter_id === encounterId && item.type_code === "medical-certificate").map((item) => <li key={`certificate-${item.id}`}>Certificate: {item.content_title ?? item.type_display ?? "Medical certificate"}</li>)}
                    {records.serviceRequests.filter((item) => item.encounter_id === encounterId).map((item) => <li key={`request-${item.id}`}>{item.category.replaceAll("_", " ")}: {item.code_display ?? item.code}</li>)}
                    {(inventory?.usages ?? []).filter((item) => item.encounter_id === encounterId).map((item) => <li key={`usage-${item.id}`}>Tagged item: {inventory?.items.find((candidate) => candidate.id === item.item_id)?.name ?? "Item"}</li>)}
                    {!records.medicationRequests.some((item) => item.encounter_id === encounterId) && !records.documentReferences.some((item) => item.encounter_id === encounterId && item.type_code === "medical-certificate") && !records.serviceRequests.some((item) => item.encounter_id === encounterId) && !(inventory?.usages ?? []).some((item) => item.encounter_id === encounterId) ? <li className="is-empty">No orders, documents, or tagged items yet.</li> : null}
                  </ul>
                </section>
              </ClinicalOrdersAndCharges>
            )}

            <LongitudinalRecord count={priorEncounters.length}>
                <label className="encounter-history__search" htmlFor="encounter-history-search">
                  <span>Search earlier encounters</span>
                  <Input id="encounter-history-search" onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search diagnosis, medication, order…" type="search" value={historyQuery} />
                </label>
                {!priorEncounters.length ? <p className="hint">No earlier encounters are recorded at this clinic.</p> : filteredPriorEncounters.length ? filteredPriorEncounters.map((prior) => (
                  <HistoricalEncounter encounter={prior} key={prior.id} records={records} />
                )) : <p className="hint">No earlier encounter matches this search.</p>}
            </LongitudinalRecord>
          </section>
        </div>
      )}

      {/* Confirmed Save Modal for SOAP Consultation Notes */}
      {soapSaveConfirmation && (
        <EncounterSaveConfirmedModal
          isOpen={Boolean(soapSaveConfirmation)}
          onClose={() => setSoapSaveConfirmation(null)}
          patientName={patient?.displayName ?? "Patient"}
          encounterId={encounterId}
          noteSnippet={soapSaveConfirmation.noteSnippet}
          revisionNumber={soapSaveConfirmation.revisionNumber}
          timestamp={soapSaveConfirmation.timestamp}
          onContinueEncounter={() => setSoapSaveConfirmation(null)}
          onFinishEncounter={() => {
            setSoapSaveConfirmation(null);
            setCompletionDialogOpen(true);
          }}
        />
      )}

      {/* Confirmed Save Modal for Orders, Prescriptions, Certificates */}
      {orderSaveConfirmation && (
        <SaveConfirmedModal
          isOpen={Boolean(orderSaveConfirmation)}
          onClose={() => setOrderSaveConfirmation(null)}
          title={orderSaveConfirmation.title}
          subtitle={orderSaveConfirmation.subtitle}
          badge={orderSaveConfirmation.badge}
          badgeVariant="success"
          recordType={orderSaveConfirmation.recordType}
          patientName={patient?.displayName ?? "Patient"}
          patientSubtitle="Active Clinical Encounter"
          recordId={`ENC-${encounterId.slice(0, 8).toUpperCase()}`}
          summaryItems={orderSaveConfirmation.summaryItems}
          detailsSnippet={orderSaveConfirmation.detailsSnippet}
          tertiaryAction={orderSaveConfirmation.tertiaryAction}
          primaryAction={{
            label: "Continue Consultation",
            onClick: () => setOrderSaveConfirmation(null),
          }}
        />
      )}
    </main>
  );
}

function HistoricalEncounter({ encounter, records }: { encounter: EncounterSummary; records: OrganizationClinicalRecords }) {
  const observations = records.observations.filter((item) => item.encounter_id === encounter.id);
  const medications = records.medicationRequests.filter((item) => item.encounter_id === encounter.id);
  const documents = records.documentReferences.filter((item) => item.encounter_id === encounter.id);
  const requests = records.serviceRequests.filter((item) => item.encounter_id === encounter.id);
  const reports = records.diagnosticReports.filter((item) => item.encounter_id === encounter.id);
  return (
    <details className="history-encounter">
      <summary>
        <span><strong>{encounter.service_type ?? "Clinical visit"}</strong><small>{dateTime(encounter.period_start)} · {encounter.status.replaceAll("_", " ")}</small></span>
        <span className="history-count">{observations.length + medications.length + documents.length + requests.length + reports.length} record{observations.length + medications.length + documents.length + requests.length + reports.length === 1 ? "" : "s"}</span>
      </summary>
      <div className="history-entries">
        {observations.map((item) => <article key={item.id}><strong>{item.code_display ?? item.code}</strong><p>{clinicalText(item.value) || item.note || "No narrative recorded."}</p></article>)}
        {medications.map((item) => <article key={item.id}><strong>Prescription: {item.medication_display ?? item.medication_code}</strong><p>{dosageText(item.dosage_instruction)}</p>{item.note && <p>{item.note}</p>}</article>)}
        {documents.map((item) => <article key={item.id}><strong>{item.content_title ?? item.type_display ?? "Clinical document"}</strong><p>{item.description ?? "No description recorded."}</p></article>)}
        {requests.map((item) => <article key={item.id}><strong>{item.category.replaceAll("_", " ")}: {item.code_display ?? item.code}</strong><p>{item.status.replaceAll("_", " ")} · {item.priority ?? "routine"}</p>{item.note && <p>{item.note}</p>}</article>)}
        {reports.map((item) => <article key={item.id}><strong>Diagnostic report: {item.code_display ?? item.code}</strong><p>{item.conclusion ?? "No conclusion recorded."}</p></article>)}
      </div>
    </details>
  );
}

function PriorityField({
  value = "routine",
  onChange,
}: {
  value?: "routine" | "urgent" | "asap" | "stat";
  onChange?: (val: "routine" | "urgent" | "asap" | "stat") => void;
}) {
  return (
    <Field label="Priority">
      <select
        className="odyssey-input"
        name="priority"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value as "routine" | "urgent" | "asap" | "stat") : undefined}
      >
        <option value="routine">Routine</option>
        <option value="urgent">Urgent</option>
        <option value="asap">ASAP</option>
        <option value="stat">STAT</option>
      </select>
    </Field>
  );
}

function CurrentRecords<T extends { id: string }>({
  title,
  items,
  render,
}: {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
}) {
  if (!items.length) return null;
  return (
    <div className="encounter-current-records">
      <h4>{title}</h4>
      {items.map((item) => <article key={item.id}>{render(item)}</article>)}
    </div>
  );
}
