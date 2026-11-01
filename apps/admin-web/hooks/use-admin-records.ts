"use client";

import {
  getAllClinicServices,
  getBillingWorkspace,
  getClaimsWorkspace,
  getClinicRoleDefinitions,
  getDailyAppointmentQueue,
  getDocumentTemplates,
  getGovernancePatients,
  getOrganizationModules,
  getPatientAuditTrail,
  getStaffAdministration,
  getStaffDepartments,
  subscribeToAppointmentQueue,
} from "@odyssey/supabase-client";
import { useOptionalAppointmentNotifications } from "@odyssey/ui";
import type { Json } from "@odyssey/types";
import { useEffect, useState } from "react";
import { useAdminData } from "../components/admin-data-context";
import type { DataRow } from "../components/data-table";
import type { SummaryItem } from "../components/summary-strip";
import { permissionLabels, php, type AdminDataset } from "../lib/admin-data";

interface AdminRecordsState {
  data: DataRow[];
  error: string | null;
  loading: boolean;
  summaries: SummaryItem[];
}

const date = (value: string | null | undefined, withTime = false) =>
  value
    ? new Intl.DateTimeFormat(
        "en-PH",
        withTime
          ? { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }
          : { dateStyle: "medium", timeZone: "Asia/Manila" },
      ).format(new Date(value))
    : "—";
const label = (value: string | null | undefined) =>
  value === "it_admin"
    ? "IT Administrator"
    : (value ?? "unknown")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
const identifier = (id: string) => id.split("-")[0]?.toUpperCase() ?? id;
const metadataText = (metadata: Json, key: string) =>
  typeof metadata === "object" &&
  metadata !== null &&
  !Array.isArray(metadata) &&
  typeof metadata[key] === "string"
    ? String(metadata[key])
    : "—";

const jsonText = (value: Json, key: string) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    typeof candidate[key] === "string"
    ? String(candidate[key])
    : null;
};

export function useAdminRecords(
  dataset: AdminDataset,
  revision = 0,
): AdminRecordsState {
  const {
    assignedDepartmentId,
    client,
    error: accessError,
    isItAdmin,
    isSuperadmin,
    loading: accessLoading,
    organization,
    organizations,
    readCache,
    writeCache,
  } = useAdminData();
  const [state, setState] = useState<AdminRecordsState>({
    data: [],
    error: null,
    loading: true,
    summaries: [],
  });

  useEffect(() => {
    let current = true;
    async function load(bypassCache = false) {
      if (accessLoading) return;
      if (accessError) {
        setState({
          data: [],
          error: accessError,
          loading: false,
          summaries: [],
        });
        return;
      }
      const organizationId = organization?.id;
      const requiresOrganization = ![
        "clinics",
        "admins",
        "global-audit",
        "break-glass",
      ].includes(dataset);
      if (requiresOrganization && !organizationId) {
        setState({
          data: [],
          error: "No clinic organization is available for this account.",
          loading: false,
          summaries: [],
        });
        return;
      }
      const cacheKey = `records:${dataset}:${organizationId ?? "platform"}:${isSuperadmin ? "superadmin" : isItAdmin ? "itadmin" : "clinic"}:${assignedDepartmentId ?? "nodept"}:${revision}`;
      const cached = readCache<AdminRecordsState>(cacheKey);
      if (cached) {
        setState(cached);
        if (!bypassCache && dataset !== "appointments") {
          return;
        }
      }
      setState((previous) => ({
        ...previous,
        error: null,
        loading: previous.data.length === 0 && (!cached || cached.data.length === 0),
      }));
      try {
        let data: DataRow[] = [];
        let summaries: SummaryItem[] = [];
        if (dataset === "patients") {
          const result = await getGovernancePatients(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((patient) => ({
            id: patient.patientId,
            active: patient.active,
            patient: patient.displayName,
            mrn: patient.walkInId ?? identifier(patient.patientId),
            dob: date(patient.birthDate),
            birthDate: patient.birthDate ?? "",
            gender: label(patient.gender),
            appointments: patient.appointmentCount,
            lastVisit: date(patient.lastActivityAt, true),
            status: patient.active ? "Active" : "Archived",
          }));
          summaries = [
            {
              label: "Patient records",
              value: data.length.toLocaleString(),
              detail: "Visible in the current clinic",
            },
            {
              label: "Active",
              value: result.data
                .filter((item) => item.active)
                .length.toLocaleString(),
              detail: "Currently active records",
            },
            {
              label: "Recorded appointments",
              value: result.data
                .reduce((sum, item) => sum + item.appointmentCount, 0)
                .toLocaleString(),
              detail: "Across loaded patients",
            },
          ];
        } else if (dataset === "patient-audit") {
          const result = await getPatientAuditTrail(
            client,
            organizationId!,
            undefined,
            250,
          );
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((event) => ({
            timestamp: date(event.occurredAt, true),
            actor: event.actorName,
            actorType: label(event.actorType),
            action: event.action,
            resource: label(event.resourceType),
            record: event.recordId,
          }));
        } else if (dataset === "appointments") {
          const result = await getDailyAppointmentQueue(
            client,
            organizationId!,
            undefined,
            [
              "proposed",
              "pending",
              "booked",
              "arrived",
              "fulfilled",
              "cancelled",
              "noshow",
            ],
          );
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((appointment) => ({
            id: appointment.id,
            statusCode: appointment.status,
            time: date(appointment.start_at, true),
            patient: appointment.patientName,
            service: appointment.service_type ?? "Unspecified service",
            mode: label(appointment.delivery_mode),
            queue: appointment.queue_number ?? "—",
            status: label(appointment.status),
          }));
          summaries = [
            {
              label: "Scheduled today",
              value: data.length.toLocaleString(),
              detail: "All appointment states",
            },
            {
              label: "Arrived",
              value: result.data
                .filter((item) => item.status === "arrived")
                .length.toLocaleString(),
              detail: "Checked in at the clinic",
            },
            {
              label: "Completed",
              value: result.data
                .filter((item) => item.status === "fulfilled")
                .length.toLocaleString(),
              detail: "Fulfilled today",
            },
          ];
        } else if (dataset === "billing" || dataset === "pos") {
          const result = await getBillingWorkspace(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          if (dataset === "billing") {
            data = result.data.invoices.map((invoice) => ({
              id: invoice.id,
              invoice: invoice.invoice_number,
              patient: invoice.patient_name,
              issued: date(invoice.issued_at),
              total: invoice.total_due,
              paid: invoice.amount_paid,
              balance: invoice.balance_due,
              statusCode: invoice.status,
              status: label(invoice.status),
            }));
            const total = result.data.invoices.reduce(
              (sum, item) => sum + Number(item.total_due),
              0,
            );
            const paid = result.data.invoices.reduce(
              (sum, item) => sum + Number(item.amount_paid),
              0,
            );
            const balance = result.data.invoices.reduce(
              (sum, item) => sum + Number(item.balance_due),
              0,
            );
            summaries = [
              {
                label: "Gross invoiced",
                value: php.format(total),
                detail: `${data.length} invoices loaded`,
              },
              {
                label: "Payments allocated",
                value: php.format(paid),
                detail: "Confirmed against invoices",
              },
              {
                label: "Outstanding",
                value: php.format(balance),
                detail: "Current invoice balance",
              },
            ];
          } else {
            data = result.data.pos_sales.map((sale) => ({
              id: sale.id,
              receipt: sale.receipt_number,
              completed: date(sale.completed_at, true),
              customer: sale.customer_name ?? "Walk-in customer",
              amount: sale.total,
              statusCode: sale.status,
              status: label(sale.status),
            }));
            summaries = [
              {
                label: "Recorded sales",
                value: data.length.toLocaleString(),
                detail: "Visible in the current clinic",
              },
              {
                label: "Completed value",
                value: php.format(
                  result.data.pos_sales
                    .filter((item) => item.status === "completed")
                    .reduce((sum, item) => sum + Number(item.total), 0),
                ),
                detail: "Completed POS transactions",
              },
              {
                label: "Open sales",
                value: result.data.pos_sales
                  .filter((item) => item.status === "open")
                  .length.toLocaleString(),
                detail: "Awaiting completion",
              },
            ];
          }
        } else if (dataset === "claims") {
          const result = await getClaimsWorkspace(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((claim) => ({
            id: claim.id,
            statusCode: claim.status,
            submitted: Boolean(claim.submitted_at),
            philhealth: claim.payer_type === "philhealth",
            adjudicated: Boolean(claim.adjudicated_at),
            claim: identifier(claim.id),
            patient: claim.patient_name,
            payor: label(claim.payor_type),
            diagnosis: claim.primary_icd10_code ?? (claim.payer_type === "philhealth" ? "Missing — doctor must code" : "—"),
            filed: date(claim.submitted_at),
            amount: claim.total ?? 0,
            approved: claim.approved_amount ?? 0,
            status: claim.adjudication_result
              ? label(claim.adjudication_result)
              : claim.submitted_at
                ? "Submitted"
                : label(claim.status),
          }));
          summaries = [
            {
              label: "Claims loaded",
              value: data.length.toLocaleString(),
              detail: "Current organization",
            },
            {
              label: "Submitted value",
              value: php.format(
                result.data.reduce(
                  (sum, item) => sum + Number(item.total ?? 0),
                  0,
                ),
              ),
              detail: "Gross claim amount",
            },
            {
              label: "Approved value",
              value: php.format(
                result.data.reduce(
                  (sum, item) => sum + Number(item.approved_amount ?? 0),
                  0,
                ),
              ),
              detail: "Adjudicated amount",
            },
          ];
        } else if (dataset === "staff") {
          const result = await getStaffAdministration(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          const departments = new Map(
            result.data.departments.map((item) => [item.id, item.name]),
          );
          let staffMembers = result.data.staff;
          if (assignedDepartmentId && !isSuperadmin && !isItAdmin) {
            staffMembers = staffMembers.filter(
              (member) => member.departmentId === assignedDepartmentId,
            );
          }
          if (isItAdmin) {
            staffMembers = staffMembers.filter(
              (member) => member.roleCode !== "admin" && member.roleCode !== "owner",
            );
          }
          data = staffMembers.map((member) => ({
            id: member.userId,
            userId: member.userId,
            active: member.active,
            departmentId: member.departmentId ?? "",
            name: member.displayName,
            email: member.email ?? "No email available",
            roleCode: member.roleCode,
            role: label(member.roleCode),
            department: member.departmentId
              ? (departments.get(member.departmentId) ?? "Unknown department")
              : "Not assigned",
            status: member.active ? "Active" : "Disabled",
          }));
          summaries = [
            {
              label: "Staff accounts",
              value: data.length.toLocaleString(),
              detail: assignedDepartmentId && !isSuperadmin && !isItAdmin
                ? `Assigned to ${departments.get(assignedDepartmentId) ?? "your department"}`
                : "Assigned to this clinic",
            },
            {
              label: "Active",
              value: staffMembers
                .filter((item) => item.active)
                .length.toLocaleString(),
              detail: "Enabled accounts",
            },
            {
              label: "Departments",
              value: (assignedDepartmentId && !isSuperadmin && !isItAdmin ? 1 : result.data.departments.filter((item) => item.active).length).toLocaleString(),
              detail: assignedDepartmentId && !isSuperadmin && !isItAdmin ? "Scoped department" : "Active departments",
            },
          ];
        } else if (dataset === "departments") {
          const [deptResult, staffResult] = await Promise.all([
            getStaffDepartments(client, organizationId!),
            getStaffAdministration(client, organizationId!),
          ]);
          if (deptResult.error) throw new Error(deptResult.error.message);
          let deptList = deptResult.data;
          if (assignedDepartmentId && !isSuperadmin && !isItAdmin) {
            deptList = deptList.filter((dept) => dept.id === assignedDepartmentId);
          }
          let staffList = staffResult.data?.staff ?? [];
          if (isItAdmin) {
            staffList = staffList.filter((m) => m.roleCode !== "admin" && m.roleCode !== "owner");
          }
          data = deptList.map((dept) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            description: dept.description ?? "—",
            staffCount: staffList.filter(
              (member) => member.departmentId === dept.id,
            ).length,
            active: dept.active,
            status: dept.active ? "Active" : "Inactive",
            is_root_supply: dept.is_root_supply ?? false,
          }));
          summaries = [
            {
              label: "Departments",
              value: data.length.toLocaleString(),
              detail: assignedDepartmentId && !isSuperadmin && !isItAdmin
                ? "Your assigned department"
                : "Total clinic departments",
            },
            {
              label: "Active",
              value: deptList
                .filter((d) => d.active)
                .length.toLocaleString(),
              detail: "Available for assignment and stock",
            },
            {
              label: "Assigned staff",
              value: staffList
                .filter((m) => assignedDepartmentId && !isSuperadmin && !isItAdmin ? m.departmentId === assignedDepartmentId : Boolean(m.departmentId))
                .length.toLocaleString(),
              detail: "Members with department context",
            },
          ];
        } else if (dataset === "roles") {
          const [roleResult, staffResult] = await Promise.all([
            getClinicRoleDefinitions(client, organizationId!),
            getStaffAdministration(client, organizationId!),
          ]);
          if (roleResult.error) throw new Error(roleResult.error.message);
          let roleList = roleResult.data;
          if (isItAdmin) {
            roleList = roleList.filter((r) => r.code !== "admin" && r.code !== "owner");
          }
          let staffList = staffResult.data?.staff ?? [];
          if (isItAdmin) {
            staffList = staffList.filter((m) => m.roleCode !== "admin" && m.roleCode !== "owner");
          }
          data = roleList.map((role) => ({
            id: role.code,
            code: role.code,
            name: role.name,
            scope: role.isCustom ? "Custom role" : "Built-in role",
            isCustom: role.isCustom,
            assigned: staffList.filter(
              (member) => member.roleCode === role.code,
            ).length,
            permissionCount: role.permissions.length,
            permissions: role.permissions,
            access: role.permissions.length
              ? role.permissions
                  .slice(0, 3)
                  .map(
                    (permission) =>
                      permissionLabels.get(permission) ?? permission,
                  )
                  .join(", ") +
                (role.permissions.length > 3
                  ? ` +${role.permissions.length - 3}`
                  : "")
              : "No access enabled",
          }));
          summaries = [
            {
              label: "Configured roles",
              value: data.length.toLocaleString(),
              detail: "Available in this clinic",
            },
            {
              label: "Built-in roles",
              value: roleList
                .filter((r) => !r.isCustom)
                .length.toLocaleString(),
              detail: "Platform standard roles",
            },
            {
              label: "Custom roles",
              value: roleList
                .filter((r) => r.isCustom)
                .length.toLocaleString(),
              detail: "Clinic-defined roles",
            },
          ];
        } else if (dataset === "services") {
          const result = await getAllClinicServices(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description ?? "",
            durationMinutes: service.duration_minutes,
            basePrice: Number(service.base_price ?? 0),
            currency: service.currency,
            bookingEnabled: service.booking_enabled,
            deliveryModes: (service.delivery_modes ?? []).join(","),
            active: service.active,
            code: service.code,
            service: service.name,
            duration: `${service.duration_minutes} min`,
            price: php.format(Number(service.base_price ?? 0)),
            modes: (service.delivery_modes ?? []).map(label).join(", "),
            status: service.active ? "Active" : "Disabled",
          }));
        } else if (dataset === "templates") {
          const result = await getDocumentTemplates(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((template) => ({
            id: template.id,
            name: template.name,
            categoryCode: template.category,
            description: template.description ?? "",
            body: template.body,
            active: template.active,
            template: template.name,
            code: template.code,
            category: label(template.category),
            version: `v${template.version}`,
            updated: date(template.updatedAt, true),
            status: template.active ? "Active" : "Disabled",
          }));
        } else if (dataset === "features") {
          const result = await getOrganizationModules(client, organizationId!);
          if (result.error) throw new Error(result.error.message);
          data = result.data.map((module) => ({
            id: module.id,
            enabled: module.enabled,
            module: label(module.moduleKey),
            key: module.moduleKey,
            changed: date(module.updatedAt, true),
            status: module.enabled ? "Enabled" : "Disabled",
          }));
        } else if (dataset === "clinics") {
          const result = await client
            .from("organizations")
            .select(
              "id, name, active, default_payor_type, created_at, updated_at",
            )
            .order("name");
          if (result.error) throw new Error(result.error.message);
          data = (result.data ?? []).map((clinic) => {
            const isGov =
              (clinic as unknown as { default_payor_type?: string })
                .default_payor_type === "philhealth_nbb";
            return {
              id: clinic.id,
              name: clinic.name,
              active: clinic.active,
              clinic: clinic.name,
              classification: isGov ? "Government (NBB)" : "Private Hospital",
              code: clinic.id,
              created: date(clinic.created_at),
              updated: date(clinic.updated_at, true),
              status: clinic.active ? "Active" : "Disabled",
            };
          });
          summaries = [
            {
              label: "Visible clinics",
              value: data.length.toLocaleString(),
              detail: isSuperadmin
                ? "Network-wide scope"
                : "Assigned organizations",
            },
            {
              label: "Active",
              value: (result.data ?? [])
                .filter((item) => item.active)
                .length.toLocaleString(),
              detail: "Operational organizations",
            },
            {
              label: "Inactive",
              value: (result.data ?? [])
                .filter((item) => !item.active)
                .length.toLocaleString(),
              detail: "Disabled organizations",
            },
          ];
        } else if (dataset === "admins") {
          if (isSuperadmin) {
            const [platformResult, ...staffResults] = await Promise.all([
              client
                .from("platform_admins")
                .select("user_id, granted_at")
                .order("granted_at", { ascending: false }),
              ...organizations.map((clinic) =>
                getStaffAdministration(client, clinic.id),
              ),
            ]);
            if (platformResult.error)
              throw new Error(platformResult.error.message);
            const platformRows = (platformResult.data ?? []).map((admin) => ({
              id: admin.user_id,
              name: "Platform administrator",
              account: admin.user_id,
              role: "Superadmin",
              scope: "All organizations",
              status: "Active",
            }));
            const clinicRows = staffResults.flatMap(
              (result, index) =>
                result.data?.staff
                  .filter((member) =>
                    ["admin", "owner", "it_admin"].includes(member.roleCode),
                  )
                  .map((member) => ({
                    id: member.userId,
                    organizationId: organizations[index]?.id ?? "",
                    active: member.active,
                    name: member.displayName,
                    account: member.email ?? member.userId,
                    role: label(member.roleCode),
                    scope: organizations[index]?.name ?? "Clinic",
                    status: member.active ? "Active" : "Disabled",
                  })) ?? [],
            );
            data = [...platformRows, ...clinicRows];
          } else {
            const result = await getStaffAdministration(
              client,
              organizationId!,
            );
            if (result.error) throw new Error(result.error.message);
            data = result.data.staff
              .filter((member) => ["admin", "owner", "it_admin"].includes(member.roleCode))
              .map((member) => ({
                name: member.displayName,
                account: member.email ?? member.userId,
                role: label(member.roleCode),
                scope: organization?.name ?? organizationId!,
                status: member.active ? "Active" : "Disabled",
              }));
          }
        } else if (dataset === "global-audit" || dataset === "break-glass") {
          let query = client
            .from("audit_log")
            .select(
              "id, occurred_at, organization_id, actor_id, actor_type, action, table_name, record_id, metadata, organizations(name)",
            )
            .order("occurred_at", { ascending: false })
            .limit(500);
          if (!isSuperadmin && organizationId)
            query = query.eq("organization_id", organizationId);
          if (dataset === "break-glass")
            query = query.ilike("action", "%break%glass%");
          const result = await query;
          if (result.error) throw new Error(result.error.message);
          if (dataset === "global-audit")
            data = (result.data ?? []).map((event) => ({
              timestamp: date(event.occurred_at, true),
              organization:
                event.organizations?.name ??
                event.organization_id ??
                "Platform",
              actor: event.actor_id ?? "System",
              actorType: label(event.actor_type),
              action: event.action,
              resource: event.table_name,
              record: event.record_id,
            }));
          else
            data = (result.data ?? []).map((event) => ({
              timestamp: date(event.occurred_at, true),
              organization:
                event.organizations?.name ??
                event.organization_id ??
                "Platform",
              actor: event.actor_id ?? "System",
              record: event.record_id,
              reason: metadataText(event.metadata, "reason"),
              status:
                metadataText(event.metadata, "review_status") === "—"
                  ? "Pending"
                  : label(metadataText(event.metadata, "review_status")),
            }));
          if (dataset === "break-glass")
            summaries = [
              {
                label: "Recorded events",
                value: data.length.toLocaleString(),
                detail: "Database audit records",
              },
              {
                label: "Organizations in scope",
                value: organizations.length.toLocaleString(),
                detail: isSuperadmin ? "Network-wide" : "Assigned clinics",
              },
              {
                label: "Awaiting review",
                value: data
                  .filter((item) => item.status === "Pending")
                  .length.toLocaleString(),
                detail: "No review status recorded",
              },
            ];
        } else if (dataset === "companies") {
          const result = await client
            .from("coverages")
            .select(
              "id, coverage_type, payor, status, patient_id, subscriber_id, period_start, period_end, patients(name)",
            )
            .eq("organization_id", organizationId!)
            .in("coverage_type", [
              "company",
              "corporate",
              "employer",
              "employer_sponsored",
            ])
            .order("updated_at", { ascending: false });
          if (result.error) throw new Error(result.error.message);
          data = (result.data ?? []).map((coverage) => ({
            id: coverage.id,
            patientId: coverage.patient_id,
            company: jsonText(coverage.payor, "name") ?? "Unnamed company",
            patient:
              jsonText(coverage.patients?.name ?? null, "text") ?? "Patient",
            coverageTypeCode: coverage.coverage_type,
            coverageType: label(coverage.coverage_type),
            subscriberId: coverage.subscriber_id ?? "",
            periodStart: coverage.period_start ?? "",
            periodEnd: coverage.period_end ?? "",
            period: `${date(coverage.period_start)} - ${date(coverage.period_end)}`,
            statusCode: coverage.status,
            status: label(coverage.status),
          }));
          const companyCount = new Set(data.map((item) => String(item.company)))
            .size;
          summaries = [
            {
              label: "Company accounts",
              value: companyCount.toLocaleString(),
              detail: "Employer-sponsored payors",
            },
            {
              label: "Covered members",
              value: data.length.toLocaleString(),
              detail: "Coverage records",
            },
            {
              label: "Active coverage",
              value: data
                .filter((item) => item.statusCode === "active")
                .length.toLocaleString(),
              detail: "Currently active members",
            },
          ];
        }
        if (current) {
          const nextState = { data, error: null, loading: false, summaries };
          writeCache(cacheKey, nextState);
          setState(nextState);
        }
      } catch (error) {
        if (current)
          setState((previous) => ({
            data: previous.data,
            error:
              error instanceof Error
                ? error.message
                : "Database records could not be loaded.",
            loading: false,
            summaries: previous.summaries,
          }));
      }
    }
    void load();
    if (dataset === "appointments" && organization?.id) {
      const unsubscribe = subscribeToAppointmentQueue(
        client,
        organization.id,
        () => {
          void load(true);
        },
      );
      return () => {
        current = false;
        unsubscribe();
      };
    }
    return () => {
      current = false;
    };
  }, [
    accessError,
    accessLoading,
    client,
    dataset,
    isSuperadmin,
    organization,
    organizations.length,
    readCache,
    revision,
    writeCache,
  ]);

  const appointmentNotifs = useOptionalAppointmentNotifications();
  useEffect(() => {
    if (
      dataset === "appointments" &&
      appointmentNotifs?.latestNotification &&
      organization?.id
    ) {
      setState((prev) => ({ ...prev }));
    }
  }, [dataset, appointmentNotifs?.latestNotification, organization?.id]);
  return state;
}
