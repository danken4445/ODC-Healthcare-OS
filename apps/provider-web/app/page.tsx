"use client";

import {
  createBrowserSupabaseClient,
  createClinicService,
  finishClinicalEncounter,
  getClinicServices,
  getCurrentUserEmail,
  getPortalAccess,
  getCurrentStaffOrganization,
  getDailyAppointmentQueue,
  getSpecificDayRange,
  getUpcomingDayRange,
  getOrganizationClinicalRecords,
  getOrganizationFeeSettings,
  getServicePractitionerOptions,
  getServiceReassignmentCandidates,
  getProviderAppointmentSlots,
  getProviderWeeklyAvailability,
  getInventoryWorkspace,
  getCurrentStaffDepartment,
  hasOrganizationPermission,
  issueMedicalCertificate,
  issuePrescription,
  recordTriageVitalSigns,
  setAppointmentSlotUnavailable,
  saveProviderWeeklyAvailability,
  saveSoapNote,
  signInWithPassword,
  signOut,
  startAppointmentEncounter,
  subscribeToAppointmentQueue,
  subscribeToClinicalHistory,
  subscribeToInventory,
  tagInventoryUsage,
  retireClinicService,
  updateClinicService,
  createDiagnosticServiceRequest,
  getDiagnosticsWorkspace,
  getSpecialistOptions,
  getLaboratoryServices,
  markClinicalNotificationRead,
  markPractitionerAbsent,
  reassignAppointment,
  recordDiagnosticReport,
  subscribeToDiagnostics,
  updateReferralStatus,
  listPhilhealthCorePresentations,
  type DayRange,
} from "@odyssey/supabase-client";
import {
  getHumanNameDisplay,
  TRIAGE_LEVEL_LABELS,
  type PhilhealthCorePresentation,
} from "@odyssey/types";
import type {
  AppointmentQueueItem,
  AppointmentSlotSummary,
  ClinicServiceSummary,
  ClinicServiceInput,
  OrganizationClinicalRecords,
  InventoryWorkspace,
  DiagnosticsWorkspace,
  SpecialistOption,
  LaboratoryServiceSummary,
  ProviderWeeklyAvailabilityRow,
  WeeklyAvailabilityWindow,
  ReassignmentCandidate,
} from "@odyssey/types";
import {
  AppointmentStatusBadge,
  Button,
  Card,
  DataTable,
  EncounterSaveConfirmedModal,
  Field,
  Input,
  TriageSaveConfirmedModal,
  useOptionalAppointmentNotifications,
  type TriageVitalsSummary,
} from "@odyssey/ui";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "./components/WorkspaceHeader";
import { DoctorOverview } from "./components/DoctorOverview";
import { Stethoscope } from "lucide-react";
import { WeeklyScheduleBuilder } from "./components/WeeklyScheduleBuilder";
import { ProfessionalFeesTab } from "./components/ProfessionalFeesTab";
import { AvailabilityStudio } from "./components/AvailabilityStudio";
import { QueueBoard } from "./components/QueueBoard";
import {
  generateRandomTriageData,
  isDeveloperModeActive,
  setDeveloperModeActive,
} from "./components/encounter-test-data";
import { useCurrentPractitionerRole } from "./hooks/useCurrentPractitionerRole";

const CROSS_DOCTOR_ASSIGNMENT_MESSAGE =
  "This appointment is assigned to another doctor. Ask an authorized coordinator to reassign it.";

function formatTime(value: string | null): string {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function clinicalText(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return "";
  const text = (value as Record<string, unknown>).text;
  return typeof text === "string" ? text : "";
}

function dosageText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return clinicalText(value[0]);
}

function triageValue(value: unknown, key: string): string {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return "";
  const item = (value as Record<string, unknown>)[key];
  return typeof item === "string" || typeof item === "number"
    ? String(item)
    : "";
}

function triageBloodPressure(
  value: unknown,
  key: "systolic" | "diastolic",
): string {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return "";
  const bloodPressure = (value as Record<string, unknown>).blood_pressure;
  if (
    typeof bloodPressure !== "object" ||
    bloodPressure === null ||
    Array.isArray(bloodPressure)
  )
    return "";
  const reading = (bloodPressure as Record<string, unknown>)[key];
  return typeof reading === "number" ? String(reading) : "";
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("doctor@synthetic.odyssey.test");
  const [password, setPassword] = useState("");
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");
  const [queueView, setQueueView] = useState<
    "today" | "tomorrow" | "upcoming" | "custom"
  >("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [queue, setQueue] = useState<AppointmentQueueItem[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotSummary[]>([]);
  const [services, setServices] = useState<ClinicServiceSummary[]>([]);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState("Offline");
  const [status, setStatus] = useState(
    "Sign in as the assigned doctor or nurse to see today's queue.",
  );
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [practitionerName, setPractitionerName] = useState<string | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [serviceBusy, setServiceBusy] = useState(false);
  const [editingService, setEditingService] =
    useState<ClinicServiceSummary | null>(null);
  const [scheduleServiceId, setScheduleServiceId] = useState("");
  const [weeklyAvailability, setWeeklyAvailability] = useState<
    ProviderWeeklyAvailabilityRow[]
  >([]);
  const [clinicalRecords, setClinicalRecords] =
    useState<OrganizationClinicalRecords | null>(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    null,
  );
  const [clinicalBusy, setClinicalBusy] = useState(false);
  const [canPrescribe, setCanPrescribe] = useState(false);
  const [canManageAppointments, setCanManageAppointments] = useState(false);
  const [canReassignAppointments, setCanReassignAppointments] = useState(false);
  const [reassignDialog, setReassignDialog] = useState<{
    appointment: AppointmentQueueItem;
    candidates: ReassignmentCandidate[];
  } | null>(null);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceDoctors, setAbsenceDoctors] = useState<ReassignmentCandidate[]>([]);
  const [absenceRoleId, setAbsenceRoleId] = useState("");
  const [canManageProfessionalFees, setCanManageProfessionalFees] = useState(false);
  const [canEncodePharmacyPrescriptions, setCanEncodePharmacyPrescriptions] = useState(false);
  const [queueScope, setQueueScope] = useState<"mine" | "clinic">("mine");
  const [selectedDoctorRoleId, setSelectedDoctorRoleId] = useState("");
  const [inventory, setInventory] = useState<InventoryWorkspace | null>(null);
  const [canViewInventory, setCanViewInventory] = useState(false);
  const [canTagInventory, setCanTagInventory] = useState(false);
  const [inventoryDepartmentId, setInventoryDepartmentId] = useState<
    string | null
  >(null);
  const [inventoryDepartmentSelection, setInventoryDepartmentSelection] =
    useState("");
  const [inventoryBusy, setInventoryBusy] = useState(false);
  const [canTriage, setCanTriage] = useState(false);
  const [selectedTriageAppointmentId, setSelectedTriageAppointmentId] =
    useState<string | null>(null);

  // Developer Debug Mode (Easter Egg) for Triage
  const [triageDebugMode, setTriageDebugMode] = useState(false);
  const [triageToast, setTriageToast] = useState<string | null>(null);
  const [triageProfileName, setTriageProfileName] = useState<string | null>(
    null,
  );

  // Determine if the signed-in user is a Nurse
  const isNurse = useMemo(() => {
    if (
      roleCodes.includes("nurse") &&
      !roleCodes.includes("doctor") &&
      !roleCodes.includes("specialist")
    ) {
      return true;
    }
    if (canTriage && !canPrescribe) {
      return true;
    }
    if (signedInAs?.toLowerCase().includes("nurse")) {
      return true;
    }
    return false;
  }, [roleCodes, canTriage, canPrescribe, signedInAs]);

  // Ensure Nurse accounts cannot navigate to doctor-specific tabs
  useEffect(() => {
    if (isNurse && (activeTab === "chart" || activeTab === "schedule")) {
      setActiveTab("queue");
    }
  }, [isNurse, activeTab]);

  // Controlled form states for Triage
  const [triageSystolic, setTriageSystolic] = useState("");
  const [triageDiastolic, setTriageDiastolic] = useState("");
  const [triagePulse, setTriagePulse] = useState("");
  const [triageRespiratory, setTriageRespiratory] = useState("");
  const [triageTemp, setTriageTemp] = useState("");
  const [triageOxygen, setTriageOxygen] = useState("");
  const [triageWeight, setTriageWeight] = useState("");
  const [triageHeight, setTriageHeight] = useState("");
  const [triagePain, setTriagePain] = useState("");
  const [triageAcuity, setTriageAcuity] = useState<
    "routine" | "urgent" | "emergency"
  >("routine");
  const [triageChiefComplaint, setTriageChiefComplaint] = useState("");
  const [triageNotes, setTriageNotes] = useState("");
  const [triageLevel, setTriageLevel] = useState("");
  const [triageCorePresentation, setTriageCorePresentation] = useState("");
  const [corePresentations, setCorePresentations] = useState<
    PhilhealthCorePresentation[]
  >([]);

  useEffect(() => {
    if (!canTriage || corePresentations.length) return;
    void listPhilhealthCorePresentations(createBrowserSupabaseClient()).then(
      (result) => {
        if (result.data) setCorePresentations(result.data);
      },
    );
  }, [canTriage, corePresentations.length]);
  const [triageDirty, setTriageDirty] = useState(false);
  const [triageSaveConfirmation, setTriageSaveConfirmation] = useState<{
    patientName: string;
    appointmentId: string;
    vitals: TriageVitalsSummary;
    chiefComplaint: string | null;
    notes: string | null;
    isCorrection: boolean;
  } | null>(null);
  const [encounterSaveConfirmation, setEncounterSaveConfirmation] = useState<{
    patientName: string;
    encounterId: string;
    noteSnippet: string;
    timestamp: Date;
  } | null>(null);

  useEffect(() => {
    if (isDeveloperModeActive()) {
      setTriageDebugMode(true);
    }
  }, []);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsWorkspace | null>(
    null,
  );
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [selectedSpecialistRoleId, setSelectedSpecialistRoleId] = useState("");
  const [laboratoryServices, setLaboratoryServices] = useState<
    LaboratoryServiceSummary[]
  >([]);
  const [canOrderDiagnostics, setCanOrderDiagnostics] = useState(false);
  const [canRecordLabResults, setCanRecordLabResults] = useState(false);
  const [canUpdateReferrals, setCanUpdateReferrals] = useState(false);
  const [canManageTemplates, setCanManageTemplates] = useState(false);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);

  const {
    practitionerRoleId: providerRoleId,
    isLoading: providerRoleLoading,
    error: providerRoleError,
  } = useCurrentPractitionerRole(organizationId, canPrescribe);

  const queueDoctorOptions = useMemo(() => {
    const doctors = new Map<string, string>();
    queue.forEach((appointment) => {
      if (appointment.practitioner_role_id) {
        doctors.set(
          appointment.practitioner_role_id,
          appointment.assignedDoctorName,
        );
      }
    });
    return [...doctors.entries()]
      .map(([roleId, name]) => ({ roleId, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [queue]);

  const visibleQueue = useMemo(() => {
    if (isNurse) return queue;
    if (queueScope === "clinic" && canManageAppointments) {
      return selectedDoctorRoleId
        ? queue.filter(
            (appointment) =>
              appointment.practitioner_role_id === selectedDoctorRoleId,
          )
        : queue;
    }
    return providerRoleId
      ? queue.filter(
          (appointment) =>
            appointment.practitioner_role_id === providerRoleId,
        )
      : [];
  }, [
    canManageAppointments,
    isNurse,
    providerRoleId,
    queue,
    queueScope,
    selectedDoctorRoleId,
  ]);

  const ownedServices = services.filter(
    (service) => service.owner_practitioner_role_id === providerRoleId,
  );
  const selectedWeeklyAvailability = useMemo(
    () =>
      weeklyAvailability.filter(
        (window) => window.clinic_service_id === scheduleServiceId,
      ),
    [scheduleServiceId, weeklyAvailability],
  );
  const selectedEncounter = clinicalRecords?.encounters.find(
    (encounter) => encounter.id === selectedEncounterId,
  );
  const selectedAppointment = queue.find(
    (appointment) => appointment.id === selectedEncounter?.appointment_id,
  );
  const priorEncounters =
    clinicalRecords?.encounters.filter(
      (encounter) =>
        encounter.patient_id === selectedEncounter?.patient_id &&
        encounter.id !== selectedEncounterId,
    ) ?? [];
  const currentSoapNote = clinicalRecords?.observations.find(
    (item) =>
      item.encounter_id === selectedEncounterId && item.code === "SOAP-NOTE",
  );
  const currentEncounterTriage = clinicalRecords?.observations.find(
    (item) =>
      item.encounter_id === selectedEncounterId &&
      item.code === "TRIAGE-VITALS",
  );
  const legacySoapDraft = ["SOAP-S", "SOAP-O", "SOAP-A", "SOAP-P"]
    .map((code) =>
      clinicalRecords?.observations.find(
        (item) =>
          item.encounter_id === selectedEncounterId && item.code === code,
      ),
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => `${item.code_display}:\n${clinicalText(item.value)}`)
    .join("\n\n");
  const currentSoapDraft = currentSoapNote
    ? clinicalText(currentSoapNote.value)
    : legacySoapDraft;
  const selectedTriageAppointment = queue.find(
    (appointment) => appointment.id === selectedTriageAppointmentId,
  );
  const selectedTriageEncounter = clinicalRecords?.encounters.find(
    (encounter) => encounter.appointment_id === selectedTriageAppointmentId,
  );
  const currentTriage = clinicalRecords?.observations.find(
    (observation) =>
      observation.encounter_id === selectedTriageEncounter?.id &&
      observation.code === "TRIAGE-VITALS",
  );

  useEffect(() => {
    if (!triageDirty) {
      setTriageSystolic(triageBloodPressure(currentTriage?.value, "systolic"));
      setTriageDiastolic(
        triageBloodPressure(currentTriage?.value, "diastolic"),
      );
      setTriagePulse(triageValue(currentTriage?.value, "pulse_bpm"));
      setTriageRespiratory(
        triageValue(currentTriage?.value, "respiratory_rate"),
      );
      setTriageTemp(triageValue(currentTriage?.value, "temperature_c"));
      setTriageOxygen(
        triageValue(currentTriage?.value, "oxygen_saturation_percent"),
      );
      setTriageWeight(triageValue(currentTriage?.value, "weight_kg"));
      setTriageHeight(triageValue(currentTriage?.value, "height_cm"));
      setTriagePain(triageValue(currentTriage?.value, "pain_score"));
      setTriageAcuity(
        (triageValue(currentTriage?.value, "acuity") as
          "routine" | "urgent" | "emergency") || "routine",
      );
      setTriageChiefComplaint(
        triageValue(currentTriage?.value, "chief_complaint"),
      );
      setTriageNotes(triageValue(currentTriage?.value, "notes"));
      setTriageLevel(triageValue(currentTriage?.value, "triage_level"));
      setTriageCorePresentation(
        triageValue(currentTriage?.value, "core_presentation_code"),
      );
    }
  }, [currentTriage, selectedTriageAppointmentId, triageDirty]);

  useEffect(() => {
    setTriageDirty(false);
    setTriageToast(null);
  }, [selectedTriageAppointmentId]);

  function applyTestFillTriage() {
    const data = generateRandomTriageData();
    setTriageSystolic(String(data.systolicBp));
    setTriageDiastolic(String(data.diastolicBp));
    setTriagePulse(String(data.pulseBpm));
    setTriageRespiratory(String(data.respiratoryRate));
    setTriageTemp(String(data.temperatureC));
    setTriageOxygen(String(data.oxygenSaturation));
    setTriageWeight(String(data.weightKg));
    setTriageHeight(String(data.heightCm));
    setTriagePain(String(data.painScore));
    setTriageAcuity(data.acuity);
    setTriageChiefComplaint(data.chiefComplaint);
    setTriageNotes(data.notes);
    setTriageProfileName(data.profileName);
    setTriageDirty(true);
    setTriageToast(`✨ Test Fill applied: ${data.profileName}`);
    setStatus(
      `Test Fill generated randomized triage assessment for ${data.profileName}.`,
    );
  }

  function handleTriageTextChange(
    field: "chiefComplaint" | "notes",
    value: string,
  ) {
    if (field === "chiefComplaint") {
      setTriageChiefComplaint(value);
    } else {
      setTriageNotes(value);
    }
    setTriageDirty(true);

    const trimmedUpper = value.trim().toUpperCase();
    if (trimmedUpper === "ODC") {
      setTriageDebugMode(true);
      setDeveloperModeActive(true);
      const data = generateRandomTriageData();
      setTriageSystolic(String(data.systolicBp));
      setTriageDiastolic(String(data.diastolicBp));
      setTriagePulse(String(data.pulseBpm));
      setTriageRespiratory(String(data.respiratoryRate));
      setTriageTemp(String(data.temperatureC));
      setTriageOxygen(String(data.oxygenSaturation));
      setTriageWeight(String(data.weightKg));
      setTriageHeight(String(data.heightCm));
      setTriagePain(String(data.painScore));
      setTriageAcuity(data.acuity);
      setTriageChiefComplaint(data.chiefComplaint);
      setTriageNotes(data.notes);
      setTriageProfileName(data.profileName);
      setTriageToast(
        `🎉 Easter Egg Unlocked: ODC Developer Mode Activated! Triage data generated: ${data.profileName}`,
      );
      setStatus(
        `Easter Egg Active: Developer Mode unlocked and Test Fill applied for ${data.profileName}.`,
      );
    } else if (!triageDebugMode && trimmedUpper.includes("ODC")) {
      setTriageDebugMode(true);
      setDeveloperModeActive(true);
      setTriageToast(
        "🎉 Easter Egg Unlocked: ODC Developer Mode Activated! Click 'Test Fill' to randomize.",
      );
      setStatus("Easter Egg Active: Developer Mode unlocked.");
    }
  }

  function handleClearTriageDrafts() {
    setTriageSystolic(triageBloodPressure(currentTriage?.value, "systolic"));
    setTriageDiastolic(triageBloodPressure(currentTriage?.value, "diastolic"));
    setTriagePulse(triageValue(currentTriage?.value, "pulse_bpm"));
    setTriageRespiratory(triageValue(currentTriage?.value, "respiratory_rate"));
    setTriageTemp(triageValue(currentTriage?.value, "temperature_c"));
    setTriageOxygen(
      triageValue(currentTriage?.value, "oxygen_saturation_percent"),
    );
    setTriageWeight(triageValue(currentTriage?.value, "weight_kg"));
    setTriageHeight(triageValue(currentTriage?.value, "height_cm"));
    setTriagePain(triageValue(currentTriage?.value, "pain_score"));
    setTriageAcuity(
      (triageValue(currentTriage?.value, "acuity") as
        "routine" | "urgent" | "emergency") || "routine",
    );
    setTriageChiefComplaint(
      triageValue(currentTriage?.value, "chief_complaint"),
    );
    setTriageNotes(triageValue(currentTriage?.value, "notes"));
    setTriageLevel(triageValue(currentTriage?.value, "triage_level"));
    setTriageCorePresentation(
      triageValue(currentTriage?.value, "core_presentation_code"),
    );
    setTriageDirty(false);
    setTriageToast("Draft triage inputs cleared.");
  }

  const loadQueue = useCallback(
    async (clinicId = organizationId, view = queueView, date = customDate) => {
      if (!clinicId) return;
      let range: DayRange | null | undefined = undefined;
      if (view === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        range = getSpecificDayRange(tomorrow);
      } else if (view === "upcoming") {
        range = null;
      } else if (view === "custom" && date) {
        range = getSpecificDayRange(date);
      }
      const result = await getDailyAppointmentQueue(
        createBrowserSupabaseClient(),
        clinicId,
        range,
        ["proposed", "pending", "booked", "arrived", "fulfilled"],
      );
      if (result.error) {
        setStatus(`Queue query failed: ${result.error.message}`);
        return;
      }
      setQueue(result.data);
    },
    [organizationId, queueView, customDate],
  );

  const loadAvailability = useCallback(
    async (clinicId = organizationId) => {
      if (!clinicId || !canPrescribe || !providerRoleId) return;
      const client = createBrowserSupabaseClient();
      const [slotResult, serviceResult, weeklyResult] = await Promise.all([
        getProviderAppointmentSlots(client, clinicId, { scope: "mine" }),
        getClinicServices(client, clinicId),
        getProviderWeeklyAvailability(client, clinicId),
      ]);
      if (slotResult.error || serviceResult.error || weeklyResult.error) {
        setStatus(
          `Availability query failed: ${slotResult.error?.message ?? serviceResult.error?.message ?? weeklyResult.error?.message}`,
        );
        return;
      }
      setSlots(slotResult.data);
      setServices(serviceResult.data);
      setWeeklyAvailability(weeklyResult.data);
    },
    [canPrescribe, organizationId, providerRoleId],
  );

  const loadClinicalRecords = useCallback(
    async (clinicId = organizationId) => {
      if (!clinicId) return;
      const result = await getOrganizationClinicalRecords(
        createBrowserSupabaseClient(),
        clinicId,
      );
      if (result.error)
        return setStatus(
          `Clinical record query failed: ${result.error.message}`,
        );
      setClinicalRecords(result.data);
    },
    [organizationId],
  );

  const loadInventory = useCallback(
    async (clinicId = organizationId) => {
      if (!clinicId) return;
      const result = await getInventoryWorkspace(
        createBrowserSupabaseClient(),
        clinicId,
      );
      if (result.error)
        return setStatus(`Inventory query failed: ${result.error.message}`);
      setInventory(result.data);
    },
    [organizationId],
  );

  const loadDiagnostics = useCallback(
    async (clinicId = organizationId) => {
      if (!clinicId) return;
      const [workspaceResult, specialistResult, laboratoryServiceResult] =
        await Promise.all([
          getDiagnosticsWorkspace(createBrowserSupabaseClient(), clinicId),
          getSpecialistOptions(createBrowserSupabaseClient(), clinicId),
          getLaboratoryServices(createBrowserSupabaseClient(), clinicId),
        ]);
      if (workspaceResult.error)
        return setStatus(
          `Diagnostics query failed: ${workspaceResult.error.message}`,
        );
      setDiagnostics(workspaceResult.data);
      if (!specialistResult.error) setSpecialists(specialistResult.data);
      if (!laboratoryServiceResult.error)
        setLaboratoryServices(laboratoryServiceResult.data);
    },
    [organizationId],
  );

  const appointmentNotifications = useOptionalAppointmentNotifications();

  useEffect(() => {
    if (
      appointmentNotifications?.latestNotification &&
      signedInAs &&
      organizationId
    ) {
      void loadQueue();
      void loadAvailability();
    }
  }, [
    appointmentNotifications?.latestNotification,
    signedInAs,
    organizationId,
    loadQueue,
    loadAvailability,
  ]);

  useEffect(() => {
    void getCurrentUserEmail(createBrowserSupabaseClient()).then((result) => {
      if (!result.error && result.data) {
        void openProviderPortal(result.data);
      }
    });
  }, []);

  useEffect(() => {
    if (providerRoleError) {
      setStatus(`Provider role query failed: ${providerRoleError}`);
    }
  }, [providerRoleError]);

  useEffect(() => {
    if (!canManageAppointments && queueScope !== "mine") {
      setQueueScope("mine");
      setSelectedDoctorRoleId("");
    }
  }, [canManageAppointments, queueScope]);

  useEffect(() => {
    if (
      selectedDoctorRoleId &&
      !queueDoctorOptions.some(
        (doctor) => doctor.roleId === selectedDoctorRoleId,
      )
    ) {
      setSelectedDoctorRoleId("");
    }
  }, [queueDoctorOptions, selectedDoctorRoleId]);

  useEffect(() => {
    const bookableServices = services.filter(
      (service) =>
        service.owner_practitioner_role_id === providerRoleId &&
        service.booking_enabled,
    );
    if (!bookableServices.some((service) => service.id === scheduleServiceId)) {
      setScheduleServiceId(bookableServices[0]?.id ?? "");
    }
  }, [providerRoleId, scheduleServiceId, services]);

  useEffect(() => {
    if (!signedInAs || !organizationId) return;
    void loadQueue();
    void loadAvailability();
    void loadClinicalRecords();
    const unsubscribe = subscribeToAppointmentQueue(
      createBrowserSupabaseClient(),
      organizationId,
      () => {
        void loadQueue();
        void loadAvailability();
      },
      (connectionStatus) => {
        setLiveStatus(
          connectionStatus === "SUBSCRIBED" ? "Live" : connectionStatus,
        );
      },
    );
    const unsubscribeClinical = subscribeToClinicalHistory(
      createBrowserSupabaseClient(),
      organizationId,
      () => {
        void loadClinicalRecords();
        void loadQueue();
      },
    );
    const unsubscribeInventory = canViewInventory
      ? subscribeToInventory(
          createBrowserSupabaseClient(),
          organizationId,
          () => void loadInventory(),
        )
      : () => undefined;
    const unsubscribeDiagnostics = subscribeToDiagnostics(
      createBrowserSupabaseClient(),
      organizationId,
      () => {
        void loadDiagnostics();
        void loadClinicalRecords();
      },
    );
    return () => {
      unsubscribe();
      unsubscribeClinical();
      unsubscribeInventory();
      unsubscribeDiagnostics();
    };
  }, [
    canViewInventory,
    loadAvailability,
    loadClinicalRecords,
    loadInventory,
    loadDiagnostics,
    loadQueue,
    organizationId,
    signedInAs,
  ]);

  async function loadStaffClinic() {
    const result = await getCurrentStaffOrganization(
      createBrowserSupabaseClient(),
    );
    if (result.error)
      return setStatus(`Clinic access failed: ${result.error.message}`);
    const departmentResult = await getCurrentStaffDepartment(
      createBrowserSupabaseClient(),
      result.data,
    );
    if (departmentResult.error)
      return setStatus(
        `Department context query failed: ${departmentResult.error.message}`,
      );
    const [
      inventoryPermission,
      inventoryViewPermission,
      triagePermission,
      consultationPermission,
      orderPermission,
      labPermission,
      referralPermission,
      templatePermission,
      appointmentManagementPermission,
      reassignmentPermission,
      professionalFeesPermission,
      pharmacyEncoderPermission,
      feeSettings,
    ] = await Promise.all([
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_view_inventory",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_tag_inventory_usage",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_record_triage",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_start_consultation",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_order_diagnostics",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_record_lab_results",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_update_referrals",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_manage_document_templates",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_manage_appointments",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_reassign_appointments",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_manage_professional_fees",
      ),
      hasOrganizationPermission(
        createBrowserSupabaseClient(),
        result.data,
        "can_encode_pharmacy_prescriptions",
      ),
      getOrganizationFeeSettings(
        createBrowserSupabaseClient(),
        result.data,
      ),
    ]);
    if (
      inventoryViewPermission.error ||
      inventoryPermission.error ||
      triagePermission.error ||
      consultationPermission.error ||
      orderPermission.error ||
      labPermission.error ||
      referralPermission.error ||
      templatePermission.error ||
      appointmentManagementPermission.error ||
      reassignmentPermission.error ||
      professionalFeesPermission.error ||
      pharmacyEncoderPermission.error
    )
      return setStatus(
        `Workspace permission query failed: ${inventoryViewPermission.error?.message ?? inventoryPermission.error?.message ?? triagePermission.error?.message ?? consultationPermission.error?.message ?? orderPermission.error?.message ?? labPermission.error?.message ?? referralPermission.error?.message ?? templatePermission.error?.message ?? appointmentManagementPermission.error?.message ?? reassignmentPermission.error?.message ?? professionalFeesPermission.error?.message ?? pharmacyEncoderPermission.error?.message}`,
      );
    setOrganizationId(result.data);
    setInventoryDepartmentId(departmentResult.data);
    setInventoryDepartmentSelection(departmentResult.data ?? "");
    setCanViewInventory(inventoryViewPermission.data);
    setCanTagInventory(inventoryPermission.data);
    setCanTriage(triagePermission.data);
    setCanPrescribe(consultationPermission.data);
    setCanOrderDiagnostics(orderPermission.data);
    setCanRecordLabResults(labPermission.data);
    setCanUpdateReferrals(referralPermission.data);
    setCanManageTemplates(templatePermission.data);
    setCanManageAppointments(appointmentManagementPermission.data);
    setCanReassignAppointments(reassignmentPermission.data);
    setCanEncodePharmacyPrescriptions(pharmacyEncoderPermission.data);
    setCanManageProfessionalFees(
      Boolean(professionalFeesPermission.data) &&
        feeSettings.data?.fee_model !== "fixed_rate",
    );

    // Fetch practitioner display name if available
    try {
      const userResult = await createBrowserSupabaseClient().auth.getUser();
      if (userResult.data?.user?.id) {
        const { data: practitionerData } = await createBrowserSupabaseClient()
          .from("practitioners")
          .select("name")
          .eq("auth_user_id", userResult.data.user.id)
          .eq("organization_id", result.data)
          .maybeSingle();
        if (practitionerData?.name) {
          setPractitionerName(getHumanNameDisplay(practitionerData.name));
        }
      }
    } catch {
      // Fall through to signedInAs display
    }

    await Promise.all([
      loadQueue(result.data),
      loadClinicalRecords(result.data),
      inventoryViewPermission.data ? loadInventory(result.data) : Promise.resolve(),
      loadDiagnostics(result.data),
    ]);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signInWithPassword(
      createBrowserSupabaseClient(),
      email,
      password,
    );
    if (result.error)
      return setStatus(`Sign-in failed: ${result.error.message}`);
    await openProviderPortal(result.data);
  }

  async function openProviderPortal(emailAddress: string) {
    const client = createBrowserSupabaseClient();
    const accessResult = await getPortalAccess(client, "provider");
    if (accessResult.error) {
      await signOut(client);
      return setStatus(`Portal access failed: ${accessResult.error.message}`);
    }
    if (!accessResult.data.allowed) {
      await signOut(client);
      setSignedInAs(null);
      setOrganizationId(null);
      return setStatus(
        "This account is not authorized for the Provider workspace. Use the portal assigned to your role.",
      );
    }
    setRoleCodes(accessResult.data.roleCodes ?? []);
    setSignedInAs(emailAddress);
    setStatus("Signed in. Loading your assigned clinic queue.");
    await loadStaffClinic();
  }

  async function handleStart(appointmentId: string) {
    const appointment = queue.find((item) => item.id === appointmentId);
    if (
      !canPrescribe ||
      !providerRoleId ||
      appointment?.practitioner_role_id !== providerRoleId
    ) {
      setStatus(CROSS_DOCTOR_ASSIGNMENT_MESSAGE);
      return;
    }
    setStartingId(appointmentId);
    const result = await startAppointmentEncounter(
      createBrowserSupabaseClient(),
      appointmentId,
    );
    setStartingId(null);
    if (result.error) {
      if (
        result.error.code === "P0002" ||
        result.error.message.includes("Assigned appointment not found")
      ) {
        setStatus(CROSS_DOCTOR_ASSIGNMENT_MESSAGE);
        return;
      }
      setStatus(`Unable to start encounter: ${result.error.message}`);
      return;
    }
    setStatus(`Encounter ${result.data} is in progress.`);
    router.push(`/encounters/${result.data}`);
  }

  async function openReassignDialog(appointment: AppointmentQueueItem) {
    if (!canReassignAppointments || !organizationId || !appointment.clinic_service_id) return;
    const result = await getServiceReassignmentCandidates(
      createBrowserSupabaseClient(),
      organizationId,
      appointment.clinic_service_id,
      appointment.practitioner_role_id,
    );
    if (result.error) return setStatus(`Unable to load eligible doctors: ${result.error.message}`);
    setReassignDialog({ appointment, candidates: result.data });
  }

  async function handleReassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reassignDialog) return;
    const fields = new FormData(event.currentTarget);
    setReassignBusy(true);
    const result = await reassignAppointment(createBrowserSupabaseClient(), {
      appointmentId: reassignDialog.appointment.id,
      newPractitionerRoleId: String(fields.get("newPractitionerRoleId") ?? ""),
      reason: String(fields.get("reason") ?? ""),
    });
    setReassignBusy(false);
    if (result.error) return setStatus(`Unable to reassign appointment: ${result.error.message}`);
    setReassignDialog(null);
    setStatus("Appointment reassigned. Queue label and billing were preserved.");
    await Promise.all([loadQueue(), loadClinicalRecords()]);
  }

  async function openAbsenceDialog() {
    if (!canReassignAppointments || !organizationId) return;
    const absentRoleId = selectedDoctorRoleId || providerRoleId || "";
    if (!absentRoleId) return setStatus("Select a doctor before marking absence.");
    const result = await getServicePractitionerOptions(createBrowserSupabaseClient(), organizationId);
    if (result.error) return setStatus(`Unable to load covering doctors: ${result.error.message}`);
    setAbsenceRoleId(absentRoleId);
    setAbsenceDoctors(result.data.filter((doctor) => doctor.roleCode === "doctor" && doctor.practitionerRoleId !== absentRoleId));
    setAbsenceDialogOpen(true);
  }

  async function handleMarkAbsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!absenceRoleId) return;
    const fields = new FormData(event.currentTarget);
    setReassignBusy(true);
    const result = await markPractitionerAbsent(createBrowserSupabaseClient(), {
      practitionerRoleId: absenceRoleId,
      date: String(fields.get("date") ?? ""),
      coveringPractitionerRoleId: String(fields.get("coveringPractitionerRoleId") ?? ""),
      reason: String(fields.get("reason") ?? ""),
    });
    setReassignBusy(false);
    if (result.error) return setStatus(`Unable to mark absence: ${result.error.message}`);
    setAbsenceDialogOpen(false);
    setStatus(`Absence recorded: ${result.data.movedCount} moved, ${result.data.notMovableCount} not movable.`);
    await Promise.all([loadQueue(), loadClinicalRecords()]);
  }

  function handleQueueConsultation(appointment: AppointmentQueueItem) {
    if (
      !canPrescribe ||
      !providerRoleId ||
      appointment.practitioner_role_id !== providerRoleId
    ) {
      setStatus(CROSS_DOCTOR_ASSIGNMENT_MESSAGE);
      return;
    }
    if (appointment.delivery_mode === "virtual") {
      router.push(`/teleconsult/${appointment.id}`);
      return;
    }

    if (appointment.encounterStatus === "in_progress") {
      const encounter = clinicalRecords?.encounters.find(
        (item) => item.appointment_id === appointment.id,
      );
      if (encounter) {
        router.push(`/encounters/${encounter.id}`);
      } else {
        void handleStart(appointment.id);
      }
      return;
    }

    void handleStart(appointment.id);
  }

  async function handleTriage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTriageAppointmentId) return;
    const fields = new FormData(event.currentTarget);
    setClinicalBusy(true);

    const systolicBp = Number(triageSystolic || fields.get("systolicBp"));
    const diastolicBp = Number(triageDiastolic || fields.get("diastolicBp"));
    const pulseBpm = Number(triagePulse || fields.get("pulseBpm"));
    const respiratoryRate = Number(
      triageRespiratory || fields.get("respiratoryRate"),
    );
    const temperatureC = Number(triageTemp || fields.get("temperatureC"));
    const oxygenSaturation = Number(
      triageOxygen || fields.get("oxygenSaturation"),
    );
    const weightKg =
      triageWeight || fields.get("weightKg")
        ? Number(triageWeight || fields.get("weightKg"))
        : null;
    const heightCm =
      triageHeight || fields.get("heightCm")
        ? Number(triageHeight || fields.get("heightCm"))
        : null;
    const painScore =
      triagePain || fields.get("painScore")
        ? Number(triagePain || fields.get("painScore"))
        : null;
    const acuity = (triageAcuity || String(fields.get("acuity"))) as
      "routine" | "urgent" | "emergency";
    const chiefComplaint =
      (
        triageChiefComplaint || String(fields.get("chiefComplaint") ?? "")
      ).trim() || null;
    const notes =
      (triageNotes || String(fields.get("notes") ?? "")).trim() || null;
    const isCorrection = Boolean(currentTriage);

    const result = await recordTriageVitalSigns(createBrowserSupabaseClient(), {
      appointmentId: selectedTriageAppointmentId,
      systolicBp,
      diastolicBp,
      pulseBpm,
      respiratoryRate,
      temperatureC,
      oxygenSaturation,
      weightKg,
      heightCm,
      painScore,
      acuity,
      chiefComplaint,
      notes,
      supersedesId: currentTriage?.id,
      triageLevel: triageLevel ? Number(triageLevel) : null,
      corePresentationCode: triageCorePresentation || null,
    });
    setClinicalBusy(false);
    if (result.error)
      return setStatus(`Unable to save triage: ${result.error.message}`);
    setTriageDirty(false);
    setTriageToast(null);
    setStatus(
      isCorrection
        ? "Triage vital-sign correction saved."
        : "Triage complete. The appointment is ready for the doctor.",
    );

    // Show Confirmed Save Modal for Triage
    setTriageSaveConfirmation({
      patientName: selectedTriageAppointment?.patientName || "Patient",
      appointmentId: selectedTriageAppointmentId,
      vitals: {
        systolicBp,
        diastolicBp,
        pulseBpm,
        respiratoryRate,
        temperatureC,
        oxygenSaturation,
        weightKg,
        heightCm,
        painScore,
        acuity,
      },
      chiefComplaint,
      notes,
      isCorrection,
    });

    await Promise.all([loadClinicalRecords(), loadQueue()]);
  }

  async function handleSoap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const noteText = String(fields.get("text") ?? "");
    setClinicalBusy(true);
    const result = await saveSoapNote(createBrowserSupabaseClient(), {
      encounterId: selectedEncounterId,
      text: noteText,
      supersedesId: currentSoapNote?.id,
    });
    setClinicalBusy(false);
    if (result.error)
      return setStatus(`Unable to save SOAP note: ${result.error.message}`);
    form.reset();
    setStatus(
      currentSoapNote ? "SOAP note revision saved." : "SOAP note saved.",
    );

    // Show Confirmed Save Modal for Encounter SOAP Note
    setEncounterSaveConfirmation({
      patientName: selectedAppointment?.patientName || "Patient",
      encounterId: selectedEncounterId,
      noteSnippet: noteText,
      timestamp: new Date(),
    });

    await loadClinicalRecords();
  }

  async function handlePrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setClinicalBusy(true);
    const result = await issuePrescription(createBrowserSupabaseClient(), {
      encounterId: selectedEncounterId,
      medication: String(fields.get("medication") ?? ""),
      dosage: String(fields.get("dosage") ?? ""),
      note: String(fields.get("note") ?? ""),
    });
    setClinicalBusy(false);
    if (result.error)
      return setStatus(`Unable to issue prescription: ${result.error.message}`);
    form.reset();
    setStatus("Prescription issued.");
    await loadClinicalRecords();
  }

  async function handleCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setClinicalBusy(true);
    const result = await issueMedicalCertificate(
      createBrowserSupabaseClient(),
      {
        encounterId: selectedEncounterId,
        title: String(fields.get("title") ?? ""),
        statement: String(fields.get("statement") ?? ""),
      },
    );
    setClinicalBusy(false);
    if (result.error)
      return setStatus(`Unable to issue certificate: ${result.error.message}`);
    form.reset();
    setStatus("Medical certificate issued.");
    await loadClinicalRecords();
  }

  async function handleInventoryUsage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setInventoryBusy(true);
    const result = await tagInventoryUsage(createBrowserSupabaseClient(), {
      encounterId: selectedEncounterId,
      stockId: String(fields.get("stockId") ?? ""),
      quantity: Number(fields.get("quantity")),
      departmentId: inventoryDepartmentSelection || null,
    });
    setInventoryBusy(false);
    if (result.error)
      return setStatus(`Unable to tag consumable: ${result.error.message}`);
    form.reset();
    setStatus(
      "Consumable held for the patient and added to the draft bill. Stock will deduct when billing is finalized.",
    );
    await loadInventory();
  }

  async function handleFinishEncounter() {
    if (!selectedEncounterId) return;
    setClinicalBusy(true);
    const result = await finishClinicalEncounter(
      createBrowserSupabaseClient(),
      selectedEncounterId,
    );
    setClinicalBusy(false);
    if (result.error)
      return setStatus(`Unable to complete encounter: ${result.error.message}`);
    setSelectedEncounterId(null);
    setStatus("Encounter completed and shared with the patient.");
    await Promise.all([loadQueue(), loadClinicalRecords()]);
  }

  async function handleCreateAvailability(
    serviceId: string,
    windows: WeeklyAvailabilityWindow[],
  ) {
    if (!organizationId) return setStatus("No staff clinic is assigned.");
    const selectedService = services.find(
      (service) => service.id === serviceId,
    );
    if (!selectedService) {
      setStatus("Choose a service for this weekly schedule.");
      return;
    }
    setAvailabilityBusy(true);
    const result = await saveProviderWeeklyAvailability(
      createBrowserSupabaseClient(),
      selectedService.id,
      windows,
    );
    setAvailabilityBusy(false);
    if (result.error)
      return setStatus(
        `Unable to save weekly availability: ${result.error.message}`,
      );
    const savedDays = windows
      .map((window) => WEEKDAYS[window.dayOfWeek])
      .join(", ");
    setStatus(
      `Weekly hours saved for ${savedDays} in Asia/Manila time. ${result.data} future appointment slots are now bookable.`,
    );
    await loadAvailability();
  }

  async function handleAvailabilityToggle(
    slot: AppointmentSlotSummary,
    unavailable: boolean,
  ) {
    setAvailabilityBusy(true);
    const result = await setAppointmentSlotUnavailable(
      createBrowserSupabaseClient(),
      slot.id,
      unavailable,
    );
    setAvailabilityBusy(false);
    if (result.error)
      return setStatus(
        `Unable to update availability: ${result.error.message}`,
      );
    setStatus(
      unavailable ? "Availability withdrawn." : "Availability reopened.",
    );
    await loadAvailability();
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!organizationId) return setStatus("No staff clinic is assigned.");
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const durationMinutes = Number(fields.get("durationMinutes"));
    const basePriceValue = String(fields.get("basePrice") ?? "").trim();
    const basePrice = basePriceValue ? Number(basePriceValue) : null;
    if (
      !name ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 5 ||
      durationMinutes > 480 ||
      (basePrice !== null && (!Number.isFinite(basePrice) || basePrice < 0))
    ) {
      return setStatus(
        "Enter a name, unique code, duration from 5–480 minutes, and a valid fee.",
      );
    }
    const input: ClinicServiceInput = {
      name,
      durationMinutes,
      basePrice,
      description: String(fields.get("description") ?? ""),
      bookingEnabled: fields.get("bookingEnabled") === "on",
      deliveryModes: [
        ...(fields.get("deliveryInPerson") === "on"
          ? ["in_person" as const]
          : []),
        ...(fields.get("deliveryVirtual") === "on" ? ["virtual" as const] : []),
      ],
    };
    const scheduleChanged = Boolean(
      editingService &&
      (editingService.name !== name ||
        editingService.duration_minutes !== durationMinutes ||
        editingService.booking_enabled !== input.bookingEnabled),
    );
    setServiceBusy(true);
    const result = editingService
      ? await updateClinicService(
          createBrowserSupabaseClient(),
          organizationId,
          editingService.id,
          input,
        )
      : await createClinicService(
          createBrowserSupabaseClient(),
          organizationId,
          input,
        );
    setServiceBusy(false);
    if (result.error)
      return setStatus(`Unable to save service: ${result.error.message}`);
    setEditingService(null);
    form.reset();
    setStatus(
      editingService
        ? scheduleChanged
          ? "Service updated. Re-save weekly availability for this service."
          : "Service updated."
        : "Service added to your catalog.",
    );
    await loadAvailability();
  }

  async function handleRetireService(service: ClinicServiceSummary) {
    if (
      !window.confirm(
        `Retire ${service.name}? Existing appointments will be kept.`,
      )
    )
      return;
    setServiceBusy(true);
    const result = await retireClinicService(
      createBrowserSupabaseClient(),
      service.id,
    );
    setServiceBusy(false);
    if (result.error)
      return setStatus(`Unable to retire service: ${result.error.message}`);
    if (editingService?.id === service.id) setEditingService(null);
    setStatus("Service retired and removed from future booking.");
    await loadAvailability();
  }

  async function handleSignOut() {
    try {
      await signOut(createBrowserSupabaseClient());
    } catch {
      // Continue clearing client state even if remote sign-out fails
    }
    setSignedInAs(null);
    setOrganizationId(null);
    setRoleCodes([]);
    setPractitionerName(null);
    setQueue([]);
    setSlots([]);
    setServices([]);
    setWeeklyAvailability([]);
    setLiveStatus("Offline");
    setClinicalRecords(null);
    setSelectedEncounterId(null);
    setInventory(null);
    setCanTagInventory(false);
    setInventoryDepartmentId(null);
    setInventoryDepartmentSelection("");
    setCanTriage(false);
    setCanManageAppointments(false);
    setQueueScope("mine");
    setSelectedDoctorRoleId("");
    setSelectedTriageAppointmentId(null);
    setDiagnostics(null);
    setSpecialists([]);
    setSelectedSpecialistRoleId("");
    setLaboratoryServices([]);
    setCanOrderDiagnostics(false);
    setCanRecordLabResults(false);
    setCanUpdateReferrals(false);
    setStatus("Signed out.");
  }

  async function handleDiagnosticOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId) return;
    const fields = new FormData(event.currentTarget);
    const category = String(fields.get("category")) as
      "laboratory" | "referral";
    setDiagnosticsBusy(true);
    const result = await createDiagnosticServiceRequest(
      createBrowserSupabaseClient(),
      {
        encounterId: selectedEncounterId,
        category,
        priority: String(fields.get("priority")) as
          "routine" | "urgent" | "asap" | "stat",
        note: String(fields.get("note") ?? ""),
        performerPractitionerRoleId:
          category === "referral"
            ? String(fields.get("specialistRoleId") ?? "")
            : null,
        laboratoryServiceId:
          category === "laboratory"
            ? String(fields.get("laboratoryServiceId") ?? "")
            : null,
      },
    );
    setDiagnosticsBusy(false);
    if (result.error)
      return setStatus(`Unable to place request: ${result.error.message}`);
    event.currentTarget.reset();
    setSelectedSpecialistRoleId("");
    setStatus(
      `${category === "laboratory" ? "Lab order" : "Referral"} placed.`,
    );
    await loadDiagnostics();
  }

  async function handleLabResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setDiagnosticsBusy(true);
    const result = await recordDiagnosticReport(createBrowserSupabaseClient(), {
      serviceRequestId: String(fields.get("serviceRequestId")),
      conclusion: String(fields.get("conclusion") ?? ""),
      results: [
        {
          display: String(fields.get("resultDisplay")),
          value: String(fields.get("value")),
          unit: String(fields.get("unit") ?? ""),
          referenceRange: { text: String(fields.get("referenceRange") ?? "") },
        },
      ],
    });
    setDiagnosticsBusy(false);
    if (result.error)
      return setStatus(`Unable to record result: ${result.error.message}`);
    event.currentTarget.reset();
    setStatus(
      "Final diagnostic report published and ordering provider notified.",
    );
    await loadDiagnostics();
  }

  const currentDepartmentName =
    inventory?.departments.find((d) => d.id === inventoryDepartmentId)?.name ??
    null;

  return (
    <main className="workspace-shell">
      {!signedInAs ? (
        <>
          <p className="eyebrow">Provider workspace</p>
          <h1>My queue today</h1>
          <form onSubmit={handleSignIn} className="stack narrow-form">
            <Field label="Email">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
              />
            </Field>
            <Button type="submit">Sign in</Button>
            <p className="hint">Local reset password: LocalOnly-2026!</p>
          </form>
        </>
      ) : (
        <>
          <WorkspaceHeader
            signedInAs={signedInAs}
            practitionerName={practitionerName}
            isNurse={isNurse}
            organizationId={organizationId}
            department={currentDepartmentName}
            roleId={providerRoleId}
            liveStatus={liveStatus}
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (isNurse && (tab === "chart" || tab === "schedule")) {
                setActiveTab("queue");
              } else {
                setActiveTab(tab);
              }
            }}
            queueCount={visibleQueue.length}
            notificationsCount={diagnostics?.notifications.length ?? 0}
            hasActiveEncounter={Boolean(selectedEncounterId)}
            canManageTemplates={canManageTemplates && !isNurse}
            canManageProfessionalFees={canManageProfessionalFees}
            canEncodePharmacyPrescriptions={canEncodePharmacyPrescriptions}
            onSignOut={handleSignOut}
          />

          {reassignDialog && (
            <dialog open className="encounter-completion-dialog" aria-labelledby="reassign-heading">
              <form onSubmit={handleReassign}>
                <p className="eyebrow">Appointment reassignment</p>
                <h2 id="reassign-heading">Move {reassignDialog.appointment.patientName}</h2>
                <p>Queue label and billing stay unchanged. Select an active doctor assigned to this service.</p>
                <Field label="New doctor">
                  <select className="odyssey-input" name="newPractitionerRoleId" required defaultValue="">
                    <option value="" disabled>Select a doctor</option>
                    {reassignDialog.candidates.map((candidate) => (
                      <option key={candidate.practitionerRoleId} value={candidate.practitionerRoleId}>{candidate.displayName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reason">
                  <Input name="reason" minLength={2} maxLength={1000} required placeholder="Reason for reassignment" />
                </Field>
                <div>
                  <Button type="button" variant="outline" onClick={() => setReassignDialog(null)}>Cancel</Button>
                  <Button type="submit" disabled={reassignBusy || reassignDialog.candidates.length === 0}>{reassignBusy ? "Reassigning…" : "Confirm reassignment"}</Button>
                </div>
              </form>
            </dialog>
          )}

          {absenceDialogOpen && (
            <dialog open className="encounter-completion-dialog" aria-labelledby="absence-heading">
              <form onSubmit={handleMarkAbsent}>
                <p className="eyebrow">Coverage</p>
                <h2 id="absence-heading">Mark doctor absent</h2>
                <p>Appointments that cannot move are reported individually and remain scheduled without a replacement slot.</p>
                <Field label="Date">
                  <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </Field>
                <Field label="Covering doctor">
                  <select className="odyssey-input" name="coveringPractitionerRoleId" required defaultValue="">
                    <option value="" disabled>Select a covering doctor</option>
                    {absenceDoctors.map((doctor) => <option key={doctor.practitionerRoleId} value={doctor.practitionerRoleId}>{doctor.displayName}</option>)}
                  </select>
                </Field>
                <Field label="Reason">
                  <Input name="reason" minLength={2} maxLength={1000} required placeholder="Reason for absence" />
                </Field>
                <div>
                  <Button type="button" variant="outline" onClick={() => setAbsenceDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={reassignBusy || absenceDoctors.length === 0}>{reassignBusy ? "Updating…" : "Create coverage and reassign"}</Button>
                </div>
              </form>
            </dialog>
          )}

          {/* Vesper Clinical Overview Dashboard */}
          {activeTab === "all" && (
            <DoctorOverview
              doctorName={
                practitionerName ||
                (signedInAs
                  ? isNurse
                    ? signedInAs.split("@")[0].toLowerCase().includes("nurse")
                      ? "Nurse"
                      : `Nurse ${signedInAs.split("@")[0]}`
                    : `Dr. ${signedInAs.split("@")[0]}`
                  : isNurse
                    ? "Nurse"
                    : "Clinician")
              }
              department={currentDepartmentName}
              queue={visibleQueue}
              diagnostics={diagnostics}
              clinicalRecords={clinicalRecords}
              activeEncounterId={selectedEncounterId}
              startingAppointmentId={startingId}
              currentPractitionerRoleId={providerRoleId}
              canStartConsultation={canPrescribe}
              isNurse={isNurse}
              onStartConsultation={handleQueueConsultation}
              onOpenTriage={(appointment) => {
                setSelectedTriageAppointmentId(appointment.id);
                setActiveTab("queue");
              }}
              onNavigateTab={(tab) => {
                if (isNurse && (tab === "chart" || tab === "schedule")) {
                  setActiveTab("queue");
                } else {
                  setActiveTab(tab);
                }
              }}
            />
          )}

          {/* Legacy session container preserved for tests */}
          <div className="session" style={{ display: "none" }}>
            <span>Signed in as {signedInAs}</span>
            <span className="session-actions">
              <Link href="/teleconsult">Meeting rooms</Link>
              <Link href="/payouts">My payouts</Link>
              <span
                className="live-indicator"
                data-live={liveStatus === "Live"}
              >
                {liveStatus} queue
              </span>
              <Button variant="secondary" onClick={handleSignOut}>
                Log out
              </Button>
            </span>
          </div>

          {activeTab === "diagnostics" && (
            <>
              {!!diagnostics?.notifications.length && (
                <section aria-labelledby="notifications-heading">
                  <h2 id="notifications-heading">Diagnostics notifications</h2>
                  <div className="record-list">
                    {diagnostics.notifications.map((notification) => (
                      <article key={notification.id}>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>
                          {new Date(notification.created_at).toLocaleString()}
                        </small>{" "}
                        {!notification.read_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void markClinicalNotificationRead(
                                createBrowserSupabaseClient(),
                                notification.id,
                              ).then(() => loadDiagnostics())
                            }
                          >
                            Mark read
                          </Button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {canRecordLabResults && (
                <section aria-labelledby="lab-worklist-heading">
                  <h2 id="lab-worklist-heading">Laboratory worklist</h2>
                  {!diagnostics?.serviceRequests.some(
                    (request) =>
                      request.category === "laboratory" &&
                      request.status === "active",
                  ) && <p className="hint">No active laboratory orders.</p>}
                  <div className="clinical-grid">
                    {diagnostics?.serviceRequests
                      .filter(
                        (request) =>
                          request.category === "laboratory" &&
                          request.status === "active",
                      )
                      .map((request) => (
                        <Card key={request.id}>
                          <h3>{request.code_display ?? request.code}</h3>
                          <p className="hint">
                            {request.priority ?? "routine"} · ordered{" "}
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                          {request.note && <p>{request.note}</p>}
                          <form className="stack" onSubmit={handleLabResult}>
                            <input
                              type="hidden"
                              name="serviceRequestId"
                              value={request.id}
                            />
                            <Field label="Result name">
                              <Input name="resultDisplay" required />
                            </Field>
                            <Field label="Value">
                              <Input name="value" required />
                            </Field>
                            <Field label="Unit">
                              <Input name="unit" />
                            </Field>
                            <Field label="Reference range">
                              <Input name="referenceRange" />
                            </Field>
                            <Field label="Conclusion">
                              <textarea
                                className="odyssey-input"
                                name="conclusion"
                                rows={3}
                                maxLength={5000}
                              />
                            </Field>
                            <Button type="submit" disabled={diagnosticsBusy}>
                              Publish final report
                            </Button>
                          </form>
                        </Card>
                      ))}
                  </div>
                </section>
              )}
              {canUpdateReferrals && (
                <section aria-labelledby="referrals-heading">
                  <h2 id="referrals-heading">My specialist referrals</h2>
                  <QueueBoard
                    appointments={visibleQueue}
                    renderAction={(appointment) =>
                      !canPrescribe ||
                      !providerRoleId ||
                      appointment.practitioner_role_id !== providerRoleId ? (
                        <span className="hint">Assigned to another doctor</span>
                      ) : appointment.encounterStatus === "in_progress" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const encounter = clinicalRecords?.encounters.find(
                              (item) => item.appointment_id === appointment.id,
                            );
                            if (encounter)
                              router.push(`/encounters/${encounter.id}`);
                          }}
                        >
                          Open chart
                        </Button>
                      ) : appointment.delivery_mode === "virtual" ? (
                        <Link href={`/teleconsult/${appointment.id}`}>
                          <Button size="sm">Open room</Button>
                        </Link>
                      ) : appointment.status === "arrived" &&
                        appointment.triageStatus === "complete" ? (
                        <Button
                          size="sm"
                          disabled={startingId !== null}
                          onClick={() => void handleStart(appointment.id)}
                        >
                          {startingId === appointment.id
                            ? "Starting…"
                            : "Start consultation"}
                        </Button>
                      ) : canTriage && appointment.status === "arrived" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            setSelectedTriageAppointmentId(appointment.id)
                          }
                        >
                          Record triage
                        </Button>
                      ) : (
                        <span className="hint">Awaiting check-in</span>
                      )
                    }
                  />
                  <DataTable
                    caption="Referrals routed specifically to your specialist role."
                    data={
                      diagnostics?.serviceRequests.filter(
                        (request) => request.category === "referral",
                      ) ?? []
                    }
                    emptyMessage="No referrals are assigned to you."
                    getRowId={(request) => request.id}
                    columns={[
                      {
                        id: "request",
                        header: "Referral",
                        cell: (request) => request.code_display ?? request.code,
                      },
                      {
                        id: "priority",
                        header: "Priority",
                        cell: (request) => request.priority ?? "routine",
                      },
                      {
                        id: "status",
                        header: "Status",
                        cell: (request) => request.status.replaceAll("_", " "),
                      },
                      {
                        id: "action",
                        header: "",
                        cell: (request) =>
                          request.status === "completed" ||
                          request.status === "revoked" ? null : (
                            <Button
                              size="sm"
                              onClick={() =>
                                void updateReferralStatus(
                                  createBrowserSupabaseClient(),
                                  request.id,
                                  "completed",
                                ).then((result) => {
                                  if (result.error)
                                    setStatus(
                                      `Unable to update referral: ${result.error.message}`,
                                    );
                                  else void loadDiagnostics();
                                })
                              }
                            >
                              Complete
                            </Button>
                          ),
                      },
                    ]}
                  />
                </section>
              )}
            </>
          )}

          {activeTab === "queue" && (
            <section
              aria-labelledby="queue-heading"
              style={{ marginTop: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <h1
                    id="queue-heading"
                    style={{ fontSize: "1.5rem", margin: 0 }}
                  >
                    {isNurse
                      ? "Nurse triage queue"
                      : queueScope === "clinic" && canManageAppointments
                        ? "Clinic queue"
                        : "My queue today"}
                  </h1>
                  <h2
                    style={{
                      fontSize: "1.05rem",
                      margin: "0.2rem 0 0 0",
                      color: "var(--odyssey-muted-foreground)",
                    }}
                  >
                    Live queue
                  </h2>
                </div>
                {canReassignAppointments && !isNurse && (
                  <Button size="sm" variant="outline" onClick={() => void openAbsenceDialog()}>
                    Mark doctor absent
                  </Button>
                )}
              </div>
              {!isNurse && (
                <div className="queue-scope-controls">
                  <fieldset>
                    <legend>Patient scope</legend>
                    <div className="queue-scope-controls__buttons">
                      <Button
                        size="sm"
                        variant={queueScope === "mine" ? "default" : "outline"}
                        aria-pressed={queueScope === "mine"}
                        onClick={() => {
                          setQueueScope("mine");
                          setSelectedDoctorRoleId("");
                        }}
                      >
                        My patients
                      </Button>
                      {canManageAppointments && (
                        <Button
                          size="sm"
                          variant={
                            queueScope === "clinic" ? "default" : "outline"
                          }
                          aria-pressed={queueScope === "clinic"}
                          onClick={() => setQueueScope("clinic")}
                        >
                          All
                        </Button>
                      )}
                    </div>
                  </fieldset>
                  {canManageAppointments && queueScope === "clinic" && (
                    <label className="queue-doctor-filter">
                      <span>Assigned doctor</span>
                      <select
                        className="odyssey-input"
                        value={selectedDoctorRoleId}
                        onChange={(event) =>
                          setSelectedDoctorRoleId(event.target.value)
                        }
                      >
                        <option value="">All doctors</option>
                        {queueDoctorOptions.map((doctor) => (
                          <option key={doctor.roleId} value={doctor.roleId}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {providerRoleLoading && (
                    <span className="hint" role="status">
                      Loading practitioner assignment…
                    </span>
                  )}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Queue view:
                </span>
                <Button
                  size="sm"
                  variant={queueView === "today" ? "default" : "outline"}
                  onClick={() => {
                    setQueueView("today");
                    void loadQueue(organizationId, "today");
                  }}
                >
                  Today&apos;s queue
                </Button>
                <Button
                  size="sm"
                  variant={queueView === "tomorrow" ? "default" : "outline"}
                  onClick={() => {
                    setQueueView("tomorrow");
                    void loadQueue(organizationId, "tomorrow");
                  }}
                >
                  Tomorrow
                </Button>
                <Button
                  size="sm"
                  variant={queueView === "upcoming" ? "default" : "outline"}
                  onClick={() => {
                    setQueueView("upcoming");
                    void loadQueue(organizationId, "upcoming");
                  }}
                >
                  All upcoming
                </Button>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginLeft: "0.25rem",
                  }}
                >
                  <input
                    type="date"
                    className="odyssey-input"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                    value={customDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDate(val);
                      if (val) {
                        setQueueView("custom");
                        void loadQueue(organizationId, "custom", val);
                      }
                    }}
                  />
                </span>
              </div>
              <DataTable
                caption={
                  queueView === "today"
                    ? "Clinical appointments scheduled for today."
                    : queueView === "tomorrow"
                      ? "Clinical appointments scheduled for tomorrow."
                      : queueView === "custom"
                        ? `Clinical appointments scheduled for ${customDate}.`
                        : "Clinical appointments scheduled for the next 7 days."
                }
                data={visibleQueue}
                emptyMessage={
                  queueView === "today"
                    ? "Your queue is empty today."
                    : queueView === "upcoming"
                      ? "No upcoming appointments."
                      : "No appointments for this period."
                }
                getRowId={(appointment) => appointment.id}
                columns={[
                  {
                    id: "queue",
                    header: "Queue",
                    cell: (appointment) =>
                      appointment.queue_label ?? "—",
                  },
                  {
                    id: "time",
                    header: "Time",
                    cell: (appointment) => formatTime(appointment.start_at),
                  },
                  {
                    id: "patient",
                    header: "Patient",
                    cell: (appointment) => appointment.patientName,
                  },
                  {
                    id: "assigned-doctor",
                    header: "Assigned Doctor",
                    cell: (appointment) => appointment.assignedDoctorName,
                  },
                  {
                    id: "mode",
                    header: "Visit",
                    cell: (appointment) =>
                      appointment.delivery_mode === "virtual"
                        ? "Virtual"
                        : "Clinic",
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (appointment) =>
                      appointment.encounterStatus === "in_progress" ? (
                        <span className="encounter-status">
                          {isNurse ? "In doctor consult" : "In progress"}
                        </span>
                      ) : appointment.delivery_mode === "virtual" ? (
                        <span className="encounter-status">
                          {isNurse
                            ? "Virtual consult (Doctor)"
                            : "Virtual visit"}
                        </span>
                      ) : appointment.triageStatus === "complete" ? (
                        <span className="encounter-status">
                          Triage complete
                        </span>
                      ) : appointment.status !== "arrived" ? (
                        canTriage ? (
                          <span className="hint">Awaiting check-in</span>
                        ) : (
                          <AppointmentStatusBadge status={appointment.status} />
                        )
                      ) : canPrescribe ? (
                        <AppointmentStatusBadge status={appointment.status} />
                      ) : (
                        <span className="hint">
                          {isNurse ? "Ready for triage" : "Awaiting triage"}
                        </span>
                      ),
                  },
                  {
                    id: "action",
                    header: "",
                    cell: (appointment) => {
                      if (isNurse) {
                        if (appointment.encounterStatus === "in_progress") {
                          return (
                            <span className="hint">
                              In consultation with doctor
                            </span>
                          );
                        }
                        if (appointment.delivery_mode === "virtual") {
                          return (
                            <span className="hint">
                              Virtual consult (Doctor)
                            </span>
                          );
                        }
                        if (appointment.status === "arrived") {
                          if (appointment.triageStatus !== "complete") {
                            return (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setSelectedTriageAppointmentId(appointment.id)
                                }
                              >
                                Record triage for {appointment.patientName}
                              </Button>
                            );
                          }
                          return (
                            <div
                              style={{
                                display: "inline-flex",
                                gap: "0.5rem",
                                alignItems: "center",
                              }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedTriageAppointmentId(appointment.id)
                                }
                              >
                                Review triage
                              </Button>
                              <span className="hint">Ready for doctor</span>
                            </div>
                          );
                        }
                        return <span className="hint">Awaiting check-in</span>;
                      }

                      // Doctor actions
                      if (
                        canReassignAppointments &&
                        appointment.status !== "fulfilled" &&
                        appointment.status !== "cancelled"
                      ) {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void openReassignDialog(appointment)}
                          >
                            Reassign
                          </Button>
                        );
                      }
                      const isAssignedToCurrentPractitioner =
                        providerRoleId !== null &&
                        appointment.practitioner_role_id === providerRoleId;
                      const canOpenConsultation =
                        canPrescribe && isAssignedToCurrentPractitioner;

                      if (
                        canTriage &&
                        appointment.delivery_mode !== "virtual" &&
                        appointment.status === "arrived" &&
                        appointment.encounterStatus !== "in_progress"
                      ) {
                        return (
                          <Button
                            size="sm"
                            variant={
                              appointment.triageStatus === "complete"
                                ? "outline"
                                : "default"
                            }
                            onClick={() =>
                              setSelectedTriageAppointmentId(appointment.id)
                            }
                          >
                            {appointment.triageStatus === "complete"
                              ? "Review triage"
                              : `Record triage for ${appointment.patientName}`}
                          </Button>
                        );
                      }

                      if (!canOpenConsultation) {
                        return (
                          <span className="hint">
                            {isAssignedToCurrentPractitioner
                              ? "Consultation access required"
                              : "Assigned to another doctor"}
                          </span>
                        );
                      }

                      return appointment.delivery_mode === "virtual" ? (
                        <span className="table-actions">
                          <Link href={`/teleconsult/${appointment.id}`}>
                            <Button size="sm">
                              {appointment.encounterStatus === "in_progress"
                                ? "Rejoin room"
                                : "Open room"}
                            </Button>
                          </Link>
                          {(appointment.encounterStatus === "in_progress" ||
                            appointment.encounterStatus === "finished") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const encounter =
                                  clinicalRecords?.encounters.find(
                                    (item) =>
                                      item.appointment_id === appointment.id,
                                  );
                                if (encounter)
                                  router.push(`/encounters/${encounter.id}`);
                              }}
                            >
                              Open chart
                            </Button>
                          )}
                        </span>
                      ) : appointment.encounterStatus === "in_progress" ||
                        appointment.encounterStatus === "finished" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const encounter = clinicalRecords?.encounters.find(
                              (item) => item.appointment_id === appointment.id,
                            );
                            if (encounter)
                              router.push(`/encounters/${encounter.id}`);
                          }}
                        >
                          Open chart
                        </Button>
                      ) : appointment.status !== "arrived" ? (
                        <span className="hint">Awaiting check-in</span>
                      ) : appointment.triageStatus !== "complete" ? (
                        <span className="hint">Awaiting nurse triage</span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={startingId !== null}
                          onClick={() => void handleStart(appointment.id)}
                          aria-label={`Start appointment for ${appointment.patientName}`}
                        >
                          {startingId === appointment.id
                            ? "Starting…"
                            : "Mark in progress"}
                        </Button>
                      );
                    },
                  },
                ]}
              />
            </section>
          )}

          {(activeTab === "queue" || activeTab === "chart") &&
            canTriage &&
            selectedTriageAppointment && (
              <section aria-labelledby="triage-heading">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">
                      {selectedTriageAppointment.patientName}
                    </p>
                    <h2 id="triage-heading">Triage assessment</h2>
                  </div>
                  <div className="encounter-heading-aside">
                    {triageDebugMode && (
                      <Button
                        id="odc-triage-test-fill-btn"
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={applyTestFillTriage}
                        title="Randomly generate triage vital signs and assessment"
                      >
                        ⚡ Test Fill Triage
                      </Button>
                    )}
                    {triageDebugMode && (
                      <Button
                        id="odc-triage-clear-btn"
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={handleClearTriageDrafts}
                        title="Clear draft triage inputs"
                      >
                        🧹 Clear
                      </Button>
                    )}
                    {triageDebugMode && (
                      <span
                        className="dev-easter-egg-tag dev-easter-egg-tag--header"
                        title="ODC Easter Egg Debug Mode Active"
                      >
                        🧪 Dev Mode Active
                      </span>
                    )}
                    <span className="hint">
                      {currentTriage
                        ? "Correcting this assessment creates an immutable new version."
                        : "Finalize the assessment before handing the patient to the doctor."}
                    </span>
                  </div>
                </div>

                {/* Triage Easter Egg / Test Fill Toast */}
                {triageToast && (
                  <div
                    className="encounter-dev-toast"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="dev-toast-content">
                      <span className="dev-toast-icon">⚡</span>
                      <span>{triageToast}</span>
                    </div>
                    <button
                      type="button"
                      className="dev-toast-close"
                      onClick={() => setTriageToast(null)}
                      aria-label="Dismiss notification"
                    >
                      ×
                    </button>
                  </div>
                )}

                <Card>
                  <form className="stack" onSubmit={handleTriage}>
                    <div className="two-column">
                      <Field label="Systolic blood pressure (mmHg)">
                        <Input
                          id="triage-systolic-bp"
                          name="systolicBp"
                          type="number"
                          min="40"
                          max="300"
                          required
                          key={`${currentTriage?.id ?? "new"}-systolic`}
                          value={triageSystolic}
                          onChange={(e) => {
                            setTriageSystolic(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Diastolic blood pressure (mmHg)">
                        <Input
                          id="triage-diastolic-bp"
                          name="diastolicBp"
                          type="number"
                          min="20"
                          max="200"
                          required
                          key={`${currentTriage?.id ?? "new"}-diastolic`}
                          value={triageDiastolic}
                          onChange={(e) => {
                            setTriageDiastolic(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Pulse (bpm)">
                        <Input
                          id="triage-pulse-bpm"
                          name="pulseBpm"
                          type="number"
                          min="20"
                          max="300"
                          required
                          key={`${currentTriage?.id ?? "new"}-pulse`}
                          value={triagePulse}
                          onChange={(e) => {
                            setTriagePulse(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Respiratory rate (breaths/min)">
                        <Input
                          id="triage-respiratory-rate"
                          name="respiratoryRate"
                          type="number"
                          min="4"
                          max="100"
                          required
                          key={`${currentTriage?.id ?? "new"}-respiratory`}
                          value={triageRespiratory}
                          onChange={(e) => {
                            setTriageRespiratory(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Temperature (°C)">
                        <Input
                          id="triage-temperature-c"
                          name="temperatureC"
                          type="number"
                          min="25"
                          max="45"
                          step="0.1"
                          required
                          key={`${currentTriage?.id ?? "new"}-temperature`}
                          value={triageTemp}
                          onChange={(e) => {
                            setTriageTemp(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Oxygen saturation (%)">
                        <Input
                          id="triage-oxygen-saturation"
                          name="oxygenSaturation"
                          type="number"
                          min="0"
                          max="100"
                          required
                          key={`${currentTriage?.id ?? "new"}-oxygen`}
                          value={triageOxygen}
                          onChange={(e) => {
                            setTriageOxygen(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Weight (kg)">
                        <Input
                          id="triage-weight-kg"
                          name="weightKg"
                          type="number"
                          min="0.1"
                          max="700"
                          step="0.1"
                          key={`${currentTriage?.id ?? "new"}-weight`}
                          value={triageWeight}
                          onChange={(e) => {
                            setTriageWeight(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Height (cm)">
                        <Input
                          id="triage-height-cm"
                          name="heightCm"
                          type="number"
                          min="20"
                          max="300"
                          step="0.1"
                          key={`${currentTriage?.id ?? "new"}-height`}
                          value={triageHeight}
                          onChange={(e) => {
                            setTriageHeight(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Pain score (0–10)">
                        <Input
                          id="triage-pain-score"
                          name="painScore"
                          type="number"
                          min="0"
                          max="10"
                          key={`${currentTriage?.id ?? "new"}-pain`}
                          value={triagePain}
                          onChange={(e) => {
                            setTriagePain(e.target.value);
                            setTriageDirty(true);
                          }}
                        />
                      </Field>
                      <Field label="Acuity">
                        <select
                          id="triage-acuity"
                          className="odyssey-input"
                          name="acuity"
                          key={`${currentTriage?.id ?? "new"}-acuity`}
                          value={triageAcuity}
                          onChange={(e) => {
                            setTriageAcuity(
                              e.target.value as
                                "routine" | "urgent" | "emergency",
                            );
                            setTriageDirty(true);
                          }}
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </Field>
                    </div>
                    <div className="triage-philhealth-fields">
                      <Field label="Emergency triage level">
                        <select
                          id="triage-level"
                          className="odyssey-input"
                          name="triageLevel"
                          value={triageLevel}
                          onChange={(e) => {
                            setTriageLevel(e.target.value);
                            setTriageDirty(true);
                          }}
                        >
                          <option value="">Not assessed</option>
                          {Object.entries(TRIAGE_LEVEL_LABELS).map(
                            ([level, label]) => (
                              <option key={level} value={level}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
                      <Field label="Core presentation (PhilHealth)">
                        <select
                          id="triage-core-presentation"
                          className="odyssey-input"
                          name="corePresentation"
                          value={triageCorePresentation}
                          onChange={(e) => {
                            setTriageCorePresentation(e.target.value);
                            setTriageDirty(true);
                          }}
                        >
                          <option value="">None</option>
                          {corePresentations.map((presentation) => (
                            <option
                              key={presentation.code}
                              value={presentation.code}
                            >
                              {presentation.display}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <p className="triage-philhealth-hint">
                        Required for PhilHealth patients in the emergency room.
                        Pick the presentation closest to the chief complaint.
                      </p>
                    </div>
                    <Field
                      label={
                        <>
                          Chief complaint
                          {triageDebugMode ? (
                            <span className="dev-field-badge">
                              Dev Mode · Type ODC to randomize
                            </span>
                          ) : (
                            <span className="dev-field-hint">
                              Tip: Type ODC for Test Fill
                            </span>
                          )}
                        </>
                      }
                    >
                      <textarea
                        id="triage-chief-complaint"
                        className="odyssey-input"
                        name="chiefComplaint"
                        rows={3}
                        maxLength={2000}
                        key={`${currentTriage?.id ?? "new"}-complaint`}
                        value={triageChiefComplaint}
                        onChange={(e) =>
                          handleTriageTextChange(
                            "chiefComplaint",
                            e.target.value,
                          )
                        }
                        placeholder="Primary reason for visit (Easter egg: Type 'ODC' to trigger Test Fill)"
                      />
                    </Field>
                    <Field
                      label={
                        <>
                          Triage notes
                          {triageDebugMode && (
                            <span className="dev-field-badge">Dev Mode</span>
                          )}
                        </>
                      }
                    >
                      <textarea
                        id="triage-notes"
                        className="odyssey-input"
                        name="notes"
                        rows={4}
                        maxLength={5000}
                        key={`${currentTriage?.id ?? "new"}-notes`}
                        value={triageNotes}
                        onChange={(e) =>
                          handleTriageTextChange("notes", e.target.value)
                        }
                        placeholder="Initial nurse observations, physical appearance, mobility, precautions"
                      />
                    </Field>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <Button type="submit" disabled={clinicalBusy}>
                        {clinicalBusy
                          ? "Saving…"
                          : currentTriage
                            ? "Save triage correction"
                            : "Complete triage"}
                      </Button>
                      {triageDebugMode && (
                        <Button
                          id="odc-triage-quick-randomize-btn"
                          type="button"
                          variant="outline"
                          onClick={applyTestFillTriage}
                          title="Randomize triage vital signs and assessment"
                        >
                          ⚡ Test Fill (Randomize)
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>
              </section>
            )}

          {activeTab === "chart" && !isNurse && !selectedEncounterId && (
            <div className="vesper-empty-card" style={{ marginTop: "24px" }}>
              <div className="vesper-empty-icon-wrap">
                <Stethoscope size={32} />
              </div>
              <h2
                className="vesper-card__title"
                style={{ fontSize: "1.25rem", margin: "8px 0" }}
              >
                No Active Consultation
              </h2>
              <p
                className="vesper-card__subtitle"
                style={{
                  maxWidth: "440px",
                  margin: "0 auto 24px",
                  lineHeight: "1.5",
                }}
              >
                There is no patient currently open in consultation. Select an
                arrived patient from your Daily Queue to start a new
                consultation or resume an in-progress visit.
              </p>
              <button
                type="button"
                className="vesper-btn-primary"
                onClick={() => setActiveTab("queue")}
              >
                Open Daily Queue
              </button>
            </div>
          )}

          {activeTab === "chart" && !isNurse && selectedEncounterId && (
            <section aria-labelledby="chart-heading">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {selectedAppointment?.patientName ?? "Patient"}
                  </p>
                  <h2 id="chart-heading">Consultation chart</h2>
                </div>
                {canPrescribe && (
                  <Button
                    disabled={clinicalBusy}
                    onClick={() => void handleFinishEncounter()}
                  >
                    Complete encounter
                  </Button>
                )}
              </div>
              <div className="clinical-grid consultation-layout">
                <Card className="vitals-panel">
                  <h3>Triage vital signs</h3>
                  {currentEncounterTriage ? (
                    <>
                      <p>
                        BP{" "}
                        {triageBloodPressure(
                          currentEncounterTriage.value,
                          "systolic",
                        )}
                        /
                        {triageBloodPressure(
                          currentEncounterTriage.value,
                          "diastolic",
                        )}{" "}
                        mmHg
                        {" · "}Pulse{" "}
                        {triageValue(currentEncounterTriage.value, "pulse_bpm")}{" "}
                        bpm
                        {" · "}Respiratory rate{" "}
                        {triageValue(
                          currentEncounterTriage.value,
                          "respiratory_rate",
                        )}
                        /min
                      </p>
                      <p>
                        Temperature{" "}
                        {triageValue(
                          currentEncounterTriage.value,
                          "temperature_c",
                        )}{" "}
                        °C
                        {" · "}Oxygen saturation{" "}
                        {triageValue(
                          currentEncounterTriage.value,
                          "oxygen_saturation_percent",
                        )}
                        %
                        {triageValue(
                          currentEncounterTriage.value,
                          "pain_score",
                        ) &&
                          ` · Pain ${triageValue(currentEncounterTriage.value, "pain_score")}/10`}
                      </p>
                      <p>
                        <strong>Acuity: </strong>
                        {triageValue(currentEncounterTriage.value, "acuity")}
                      </p>
                      {triageValue(
                        currentEncounterTriage.value,
                        "chief_complaint",
                      ) && (
                        <p>
                          <strong>Chief complaint: </strong>
                          {triageValue(
                            currentEncounterTriage.value,
                            "chief_complaint",
                          )}
                        </p>
                      )}
                      {triageValue(currentEncounterTriage.value, "notes") && (
                        <p>
                          {triageValue(currentEncounterTriage.value, "notes")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="hint">No triage assessment is recorded.</p>
                  )}
                </Card>
                <Card className="soap-panel">
                  <h3>SOAP note</h3>
                  <form className="stack" onSubmit={handleSoap}>
                    <Field
                      label="Complete SOAP note"
                      hint="Record subjective, objective, assessment, and plan in this single note."
                    >
                      <textarea
                        className="odyssey-input"
                        name="text"
                        rows={10}
                        maxLength={20000}
                        key={
                          currentSoapNote?.id ??
                          `new-soap-note-${selectedEncounterId}`
                        }
                        defaultValue={currentSoapDraft}
                        placeholder={
                          "Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:"
                        }
                        required
                      />
                    </Field>
                    <div className="form-actions">
                      <Button type="submit" disabled={clinicalBusy}>
                        Save SOAP note
                      </Button>
                      {currentSoapNote ? (
                        <span className="save-status">Saved</span>
                      ) : null}
                    </div>
                  </form>
                  <div className="record-list">
                    {clinicalRecords?.observations
                      .filter(
                        (item) =>
                          item.encounter_id === selectedEncounterId &&
                          item.code.startsWith("SOAP-"),
                      )
                      .map((item) => (
                        <article key={item.id}>
                          <strong>{item.code_display}</strong>
                          <p>{clinicalText(item.value)}</p>
                          <small>
                            {item.supersedes_id ? "Revision" : "Original"} ·{" "}
                            {item.effective_at
                              ? new Date(item.effective_at).toLocaleString()
                              : ""}
                          </small>
                        </article>
                      ))}
                  </div>
                </Card>
                {canPrescribe && (
                  <Card className="prescription-panel">
                    <h3>Prescription</h3>
                    <form className="stack" onSubmit={handlePrescription}>
                      <Field
                        label="Medication"
                        className="prescription-primary"
                      >
                        <Input
                          name="medication"
                          maxLength={240}
                          required
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Dosage and directions">
                        <textarea
                          className="odyssey-input"
                          name="dosage"
                          rows={3}
                          maxLength={1000}
                          required
                        />
                      </Field>
                      <Field label="Note">
                        <Input name="note" maxLength={1000} />
                      </Field>
                      <Button type="submit" disabled={clinicalBusy}>
                        Issue prescription
                      </Button>
                    </form>
                  </Card>
                )}
                {canOrderDiagnostics && (
                  <Card>
                    <h3>Laboratory order</h3>
                    <form className="stack" onSubmit={handleDiagnosticOrder}>
                      <input type="hidden" name="category" value="laboratory" />
                      <Field label="Laboratory service">
                        <select
                          className="odyssey-input"
                          name="laboratoryServiceId"
                          defaultValue=""
                          required
                        >
                          <option value="" disabled>
                            Select a laboratory service
                          </option>
                          {laboratoryServices
                            .filter((service) => service.active)
                            .map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} · PHP{" "}
                                {service.labCost.toFixed(2)}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Priority">
                        <select
                          className="odyssey-input"
                          name="priority"
                          defaultValue="routine"
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="asap">ASAP</option>
                          <option value="stat">STAT</option>
                        </select>
                      </Field>
                      <Field label="Clinical note">
                        <textarea
                          className="odyssey-input"
                          name="note"
                          rows={3}
                          maxLength={5000}
                        />
                      </Field>
                      <Button type="submit" disabled={diagnosticsBusy}>
                        Place lab order
                      </Button>
                    </form>
                    <h3>Specialist referral</h3>
                    <form className="stack" onSubmit={handleDiagnosticOrder}>
                      <input type="hidden" name="category" value="referral" />
                      <Field
                        label="Specialist"
                        hint="The affiliated clinic or hospital is shown with each specialist."
                      >
                        <select
                          className="odyssey-input"
                          name="specialistRoleId"
                          value={selectedSpecialistRoleId}
                          onChange={(event) =>
                            setSelectedSpecialistRoleId(event.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            Select a specialist
                          </option>
                          {specialists.map((specialist) => (
                            <option
                              key={specialist.practitionerRoleId}
                              value={specialist.practitionerRoleId}
                            >
                              {specialist.displayName} ·{" "}
                              {specialist.organizationName}
                            </option>
                          ))}
                        </select>
                        {selectedSpecialistRoleId && (
                          <p className="hint">
                            Affiliated clinic/hospital:{" "}
                            {
                              specialists.find(
                                (specialist) =>
                                  specialist.practitionerRoleId ===
                                  selectedSpecialistRoleId,
                              )?.organizationName
                            }
                          </p>
                        )}
                      </Field>
                      <Field label="Priority">
                        <select
                          className="odyssey-input"
                          name="priority"
                          defaultValue="routine"
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="asap">ASAP</option>
                          <option value="stat">STAT</option>
                        </select>
                      </Field>
                      <Field label="Clinical note">
                        <textarea
                          className="odyssey-input"
                          name="note"
                          rows={3}
                          maxLength={5000}
                        />
                      </Field>
                      <Button type="submit" disabled={diagnosticsBusy}>
                        Place referral
                      </Button>
                    </form>
                    <div className="record-list">
                      {diagnostics?.serviceRequests
                        .filter(
                          (request) =>
                            request.encounter_id === selectedEncounterId,
                        )
                        .map((request) => (
                          <article key={request.id}>
                            <strong>
                              {request.code_display ?? request.code}
                            </strong>
                            <p>
                              {request.category} ·{" "}
                              {request.status.replaceAll("_", " ")}
                            </p>
                          </article>
                        ))}
                    </div>
                  </Card>
                )}
                {canPrescribe && (
                  <Card className="certificate-document">
                    <h3>Medical certificate</h3>
                    <form className="stack" onSubmit={handleCertificate}>
                      <Field label="Certificate title">
                        <Input
                          name="title"
                          defaultValue="Medical Certificate"
                          maxLength={200}
                          required
                        />
                      </Field>
                      <Field label="Statement">
                        <textarea
                          className="odyssey-input"
                          name="statement"
                          rows={4}
                          maxLength={5000}
                          required
                        />
                      </Field>
                      <Button type="submit" disabled={clinicalBusy}>
                        Issue certificate
                      </Button>
                    </form>
                  </Card>
                )}
                {canTagInventory && (
                  <Card>
                    <h3>Consumables used</h3>
                    <p className="hint">
                      Tagging writes the billing source record and decrements
                      the selected department immediately.
                    </p>
                    <form className="stack" onSubmit={handleInventoryUsage}>
                      <Field
                        label="Department"
                        hint={
                          inventoryDepartmentId
                            ? "Your account is assigned to this department."
                            : "Choose where this usage should be subtracted."
                        }
                      >
                        <select
                          className="odyssey-input"
                          name="departmentId"
                          value={inventoryDepartmentSelection}
                          onChange={(event) =>
                            setInventoryDepartmentSelection(event.target.value)
                          }
                          disabled={Boolean(inventoryDepartmentId)}
                          required
                        >
                          <option value="" disabled>
                            Select a department
                          </option>
                          {inventory?.departments
                            .filter((department) => department.active)
                            .map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name} ({department.code})
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Item and available stock">
                        <select
                          className="odyssey-input"
                          name="stockId"
                          defaultValue=""
                          required
                        >
                          <option value="" disabled>
                            Select available stock
                          </option>
                          {inventory?.stock
                            .filter(
                              (stock) =>
                                Number(stock.quantity) > 0 &&
                                (!inventoryDepartmentSelection ||
                                  stock.department_id ===
                                    inventoryDepartmentSelection),
                            )
                            .map((stock) => {
                              const item = inventory.items.find(
                                (candidate) => candidate.id === stock.item_id,
                              );
                              const department = inventory.departments.find(
                                (candidate) =>
                                  candidate.id === stock.department_id,
                              );
                              return (
                                <option key={stock.id} value={stock.id}>
                                  {item?.name ?? "Item"} ·{" "}
                                  {department?.name ?? "Department"} (
                                  {Number(stock.quantity).toLocaleString()}{" "}
                                  {item?.unit_of_measure ?? "units"})
                                </option>
                              );
                            })}
                        </select>
                      </Field>
                      <Field label="Quantity used">
                        <Input
                          name="quantity"
                          type="number"
                          min="0.001"
                          step="0.001"
                          defaultValue="1"
                          required
                        />
                      </Field>
                      <Button type="submit" disabled={inventoryBusy}>
                        {inventoryBusy ? "Tagging…" : "Tag consumable"}
                      </Button>
                    </form>
                    <div className="record-list">
                      {inventory?.usages
                        .filter(
                          (usage) => usage.encounter_id === selectedEncounterId,
                        )
                        .map((usage) => {
                          const item = inventory.items.find(
                            (candidate) => candidate.id === usage.item_id,
                          );
                          const department = inventory.departments.find(
                            (candidate) => candidate.id === usage.department_id,
                          );
                          return (
                            <article key={usage.id}>
                              <strong>{item?.name ?? "Consumable"}</strong>
                              <p>
                                {Number(usage.quantity).toLocaleString()}{" "}
                                {item?.unit_of_measure ?? "units"} ·{" "}
                                {department?.name ?? "Department"}
                              </p>
                              <small>
                                {usage.currency}{" "}
                                {(
                                  Number(usage.unit_price) *
                                  Number(usage.quantity)
                                ).toFixed(2)}{" "}
                                billable usage
                              </small>
                            </article>
                          );
                        })}
                    </div>
                  </Card>
                )}
                <Card className="patient-history-card">
                  <h3>Patient medical history</h3>
                  {!priorEncounters.length && (
                    <p className="hint">
                      No earlier encounters are recorded at this clinic.
                    </p>
                  )}
                  <div className="record-list">
                    {priorEncounters.map((encounter) => (
                      <article key={encounter.id}>
                        <strong>
                          {encounter.service_type ?? "Clinical visit"}
                        </strong>
                        <small>
                          {encounter.period_start
                            ? new Date(encounter.period_start).toLocaleString()
                            : "Date pending"}{" "}
                          · {encounter.status.replaceAll("_", " ")}
                        </small>
                        {clinicalRecords?.observations
                          .filter((item) => item.encounter_id === encounter.id)
                          .map((item) => (
                            <div key={item.id}>
                              <strong>{item.code_display ?? item.code}</strong>
                              <p>{clinicalText(item.value)}</p>
                            </div>
                          ))}
                        {clinicalRecords?.medicationRequests
                          .filter((item) => item.encounter_id === encounter.id)
                          .map((item) => (
                            <div key={item.id}>
                              <strong>
                                Prescription:{" "}
                                {item.medication_display ??
                                  item.medication_code}
                              </strong>
                              <p>{dosageText(item.dosage_instruction)}</p>
                              {item.note && <p>{item.note}</p>}
                            </div>
                          ))}
                        {clinicalRecords?.documentReferences
                          .filter((item) => item.encounter_id === encounter.id)
                          .map((item) => (
                            <div key={item.id}>
                              <strong>
                                {item.content_title ??
                                  item.type_display ??
                                  "Clinical document"}
                              </strong>
                              <p>{item.description}</p>
                            </div>
                          ))}
                      </article>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          )}

          {activeTab === "schedule" && !isNurse && canPrescribe && (
            <section>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Doctor CMS</p>
                  <h2>My services &amp; schedule</h2>
                </div>
                <span className="hint">
                  Control what patients can book with you.
                </span>
              </div>
              <div className="two-column cms-grid">
                <Card>
                  <div className="section-heading">
                    <h3>{editingService ? "Edit service" : "Add a service"}</h3>
                    {editingService && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingService(null)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  <form className="stack" onSubmit={handleSaveService}>
                    <div className="service-form-row">
                      <Field label="Service name">
                        <Input
                          name="name"
                          key={`name-${editingService?.id ?? "new"}`}
                          defaultValue={editingService?.name ?? ""}
                          required
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <Input
                        name="description"
                        key={`description-${editingService?.id ?? "new"}`}
                        defaultValue={editingService?.description ?? ""}
                        maxLength={500}
                      />
                    </Field>
                    <div className="service-form-row">
                      <Field label="Duration (minutes)">
                        <Input
                          name="durationMinutes"
                          key={`duration-${editingService?.id ?? "new"}`}
                          type="number"
                          min="5"
                          max="480"
                          defaultValue={editingService?.duration_minutes ?? 30}
                          required
                        />
                      </Field>
                      <Field label="Fee (PHP)">
                        <Input
                          name="basePrice"
                          key={`price-${editingService?.id ?? "new"}`}
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={editingService?.base_price ?? ""}
                        />
                      </Field>
                    </div>
                    <label className="booking-toggle">
                      <input
                        name="bookingEnabled"
                        key={`booking-${editingService?.id ?? "new"}`}
                        type="checkbox"
                        defaultChecked={editingService?.booking_enabled ?? true}
                      />{" "}
                      Available for online booking
                    </label>
                    <fieldset className="stack">
                      <legend>Delivery modes</legend>
                      <label className="booking-toggle">
                        <input
                          name="deliveryInPerson"
                          key={`in-person-${editingService?.id ?? "new"}`}
                          type="checkbox"
                          defaultChecked={
                            editingService?.delivery_modes.includes(
                              "in_person",
                            ) ?? true
                          }
                        />{" "}
                        In-person clinic visit
                      </label>
                      <label className="booking-toggle">
                        <input
                          name="deliveryVirtual"
                          key={`virtual-${editingService?.id ?? "new"}`}
                          type="checkbox"
                          defaultChecked={
                            editingService?.delivery_modes.includes(
                              "virtual",
                            ) ?? false
                          }
                        />{" "}
                        Virtual teleconsultation
                      </label>
                    </fieldset>
                    <Button type="submit" disabled={serviceBusy}>
                      {serviceBusy
                        ? "Saving…"
                        : editingService
                          ? "Save service"
                          : "Add service"}
                    </Button>
                  </form>
                </Card>
                <Card>
                  <h3>My service catalog</h3>
                  <div className="service-list">
                    {ownedServices.map((service) => (
                      <article key={service.id}>
                        <div>
                          <strong>{service.name}</strong>
                          <small>
                            {service.duration_minutes} min ·{" "}
                            {service.base_price === null
                              ? "Fee on consultation"
                              : `PHP ${service.base_price.toLocaleString()}`}
                            {" · "}
                            {service.delivery_modes
                              .map((mode) =>
                                mode === "virtual" ? "Virtual" : "Clinic",
                              )
                              .join(" + ")}
                          </small>
                        </div>
                        <div className="service-actions">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingService(service)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={serviceBusy}
                            onClick={() => void handleRetireService(service)}
                          >
                            Retire
                          </Button>
                        </div>
                      </article>
                    ))}
                    {!ownedServices.length && (
                      <p className="hint">Add your first bookable service.</p>
                    )}
                  </div>
                </Card>
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <WeeklyScheduleBuilder
                  services={ownedServices}
                  scheduleServiceId={scheduleServiceId}
                  savedAvailability={selectedWeeklyAvailability}
                  onServiceChange={setScheduleServiceId}
                  onSubmit={handleCreateAvailability}
                  availabilityBusy={availabilityBusy}
                />
              </div>

              <div style={{ marginTop: "1.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h3
                      className="schedule-heading"
                      style={{ fontSize: "1.25rem", margin: 0 }}
                    >
                      Availability schedule
                    </h3>
                    <p className="hint" style={{ marginTop: "0.2rem" }}>
                      Select an open time to make it unavailable. If a recurring
                      day has already passed this week, its first new slots
                      appear next week.
                    </p>
                  </div>
                </div>
                <AvailabilityStudio
                  slots={slots}
                  availabilityBusy={availabilityBusy}
                  onToggleSlot={handleAvailabilityToggle}
                  onRefresh={loadAvailability}
                />
              </div>
            </section>
          )}

          {activeTab === "fees" && (
            <ProfessionalFeesTab
              organizationId={organizationId}
              canManageProfessionalFees={canManageProfessionalFees}
            />
          )}
        </>
      )}
      {/* Reusable Confirmed Save Modal for Triage */}
      {triageSaveConfirmation && (
        <TriageSaveConfirmedModal
          isOpen={Boolean(triageSaveConfirmation)}
          onClose={() => setTriageSaveConfirmation(null)}
          patientName={triageSaveConfirmation.patientName}
          appointmentId={triageSaveConfirmation.appointmentId}
          vitals={triageSaveConfirmation.vitals}
          chiefComplaint={triageSaveConfirmation.chiefComplaint}
          notes={triageSaveConfirmation.notes}
          isCorrection={triageSaveConfirmation.isCorrection}
          onReturnToQueue={() => {
            setTriageSaveConfirmation(null);
            setSelectedTriageAppointmentId(null);
            setActiveTab("queue");
          }}
          onKeepEditing={() => {
            setTriageSaveConfirmation(null);
          }}
        />
      )}

      {/* Reusable Confirmed Save Modal for Encounter SOAP Note */}
      {encounterSaveConfirmation && (
        <EncounterSaveConfirmedModal
          isOpen={Boolean(encounterSaveConfirmation)}
          onClose={() => setEncounterSaveConfirmation(null)}
          patientName={encounterSaveConfirmation.patientName}
          encounterId={encounterSaveConfirmation.encounterId}
          noteSnippet={encounterSaveConfirmation.noteSnippet}
          timestamp={encounterSaveConfirmation.timestamp}
          onContinueEncounter={() => {
            setEncounterSaveConfirmation(null);
          }}
        />
      )}

      {status && (
        <div className="floating-toast">
          <span style={{ fontSize: "1.1rem" }}>🩺</span>
          <span>{status}</span>
        </div>
      )}
      <p role="status">{status}</p>
    </main>
  );
}
