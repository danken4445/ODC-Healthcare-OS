import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
} from "react";
import type {
  AppointmentStatus,
  InvoiceStatus,
  PayorType,
} from "@odyssey/types";

export { TeleconsultWebRtcRoom } from "./teleconsult-video-room";
export type { TeleconsultWebRtcRoomProps } from "./teleconsult-video-room";
export {
  AppointmentNotificationControl,
  AppointmentNotificationProvider,
  AppointmentNotificationToast,
  soundCueEngine,
  useAppointmentNotifications,
  useOptionalAppointmentNotifications,
} from "./appointment-notifications";
export type {
  AppointmentNotificationItem,
  AppointmentNotificationProviderProps,
} from "./appointment-notifications";
export { PatientQrCode } from "./patient-qr-code";
export { QrCameraScanner } from "./qr-camera-scanner";
export type { QrCameraScannerProps, QrCameraState } from "./qr-camera-scanner";
export { ClinicalPatientCard } from "./clinical-patient-card";
export {
  ClinicalVitalsPanel,
  buildClinicalVitalReadings,
} from "./clinical-vitals-panel";
export type { ClinicalVitalReading } from "./clinical-vitals-panel";
export {
  MusculoskeletalFigure,
  MUSCULOSKELETAL_REGIONS,
} from "./musculoskeletal-figure";
export type { BodyRegionDefinition } from "./musculoskeletal-figure";
export { MusculoskeletalRegionPanel } from "./musculoskeletal-region-panel";
export { AccessState } from "./access-state";
export { formatProfessionalPan, PhilhealthAccreditationCard } from "./philhealth-accreditation-card";
export type { AccessStateProps, AccessStateVariant } from "./access-state";
export {
  SaveConfirmedModal,
  TriageSaveConfirmedModal,
  EncounterSaveConfirmedModal,
  buildTriageSaveSummary,
  buildEncounterSaveSummary,
} from "./save-confirmed-modal";
export type {
  SaveConfirmedModalProps,
  SaveConfirmedBadgeVariant,
  SaveSummaryItem,
  TriageSaveConfirmedModalProps,
  TriageVitalsSummary,
  EncounterSaveConfirmedModalProps,
} from "./save-confirmed-modal";

export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
}

/** A shadcn-compatible button API using the shared CSS variable theme. */
export function Button({
  className,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "odyssey-button",
        `odyssey-button--${variant}`,
        `odyssey-button--${size}`,
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("odyssey-input", className)} {...props} />;
}

export interface FieldProps {
  children: ReactNode;
  className?: string;
  hint?: ReactNode;
  label: ReactNode;
}

export function Field({ children, className, hint, label }: FieldProps) {
  return (
    <label className={cn("odyssey-field", className)}>
      <span>{label}</span>
      {children}
      {hint ? <small className="odyssey-field__hint">{hint}</small> : null}
    </label>
  );
}

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "queue-card" | "data-row";
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("odyssey-input odyssey-select", className)}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("odyssey-skeleton", className)} />
  );
}

export function Card({ children, className, variant = "default" }: CardProps) {
  return (
    <section
      className={cn("odyssey-card", `odyssey-card--${variant}`, className)}
    >
      {children}
    </section>
  );
}

export interface DepartmentTagProps {
  children: ReactNode;
  department?: "general" | "cardiology" | "pediatrics" | "laboratory";
}

export function DepartmentTag({
  children,
  department = "general",
}: DepartmentTagProps) {
  return (
    <span
      className={cn(
        "odyssey-department-tag",
        `odyssey-department-tag--${department}`,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="odyssey-empty-state">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load this information.",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="odyssey-error-state" role="alert">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export interface DataTableColumn<Row> {
  cell: (row: Row) => ReactNode;
  className?: string;
  header: ReactNode;
  id: string;
}

export interface DataTableProps<
  Row,
> extends TableHTMLAttributes<HTMLTableElement> {
  caption: string;
  columns: Array<DataTableColumn<Row>>;
  data: Row[];
  emptyMessage?: string;
  getRowId: (row: Row, index: number) => string;
}

export function DataTable<Row>({
  caption,
  className,
  columns,
  data,
  emptyMessage = "No records to display.",
  getRowId,
  ...props
}: DataTableProps<Row>) {
  return (
    <div className="odyssey-table-scroll">
      <table className={cn("odyssey-table", className)} {...props}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, index) => (
              <tr key={getRowId(row, index)}>
                {columns.map((column) => (
                  <td className={column.className} key={column.id}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="odyssey-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  proposed: "Proposed",
  pending: "Pending",
  booked: "Booked",
  arrived: "Arrived",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  noshow: "No show",
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return (
    <span
      className={cn("odyssey-status-badge", `odyssey-status-badge--${status}`)}
    >
      {appointmentStatusLabels[status]}
    </span>
  );
}

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}

/** A small status indicator badge with semantic color variants. */
export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn("odyssey-badge", `odyssey-badge--${variant}`, className)}
    >
      {children}
    </span>
  );
}

export interface TabGroupProps {
  activeTab: string;
  children: ReactNode;
  className?: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{ id: string; label: string; icon?: string }>;
}

/** A horizontal tab bar for switching between content panels. */
export function TabGroup({
  activeTab,
  children,
  className,
  onTabChange,
  tabs,
}: TabGroupProps) {
  return (
    <div className={cn("odyssey-tabs", className)}>
      <div className="odyssey-tabs__bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            className={cn(
              "odyssey-tabs__trigger",
              activeTab === tab.id && "odyssey-tabs__trigger--active",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon ? (
              <span className="odyssey-tabs__icon">{tab.icon}</span>
            ) : null}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="odyssey-tabs__content">{children}</div>
    </div>
  );
}

export interface TabPanelProps {
  active: boolean;
  children: ReactNode;
  className?: string;
  id: string;
}

/** A single tab content panel — only renders children when active. */
export function TabPanel({ active, children, className, id }: TabPanelProps) {
  if (!active) return null;
  return (
    <div
      className={cn("odyssey-tabs__panel", className)}
      id={`tabpanel-${id}`}
      role="tabpanel"
    >
      {children}
    </div>
  );
}

/* ─── Loop 5: Financial components ─── */

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  partially_paid: "Partial",
  void: "Void",
  cancelled: "Cancelled",
};

const invoiceStatusVariants: Record<InvoiceStatus, BadgeProps["variant"]> = {
  draft: "muted",
  issued: "warning",
  paid: "success",
  partially_paid: "warning",
  void: "danger",
  cancelled: "danger",
};

/** Color-coded badge for invoice status. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={invoiceStatusVariants[status]}>
      {invoiceStatusLabels[status]}
    </Badge>
  );
}

const payorTypeLabels: Record<PayorType, string> = {
  self_pay: "Self-Pay",
  hmo: "HMO",
  philhealth_nbb: "PhilHealth NBB",
  government_subsidized: "Gov Subsidized",
};

const payorTypeVariants: Record<PayorType, BadgeProps["variant"]> = {
  self_pay: "default",
  hmo: "warning",
  philhealth_nbb: "success",
  government_subsidized: "muted",
};

/** Visual indicator for the payor type. */
export function PayorTypeBadge({ payorType }: { payorType: PayorType }) {
  return (
    <Badge variant={payorTypeVariants[payorType]}>
      {payorTypeLabels[payorType]}
    </Badge>
  );
}

const claimStatusLabels: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  cancelled: "Cancelled",
  entered_in_error: "Error",
};

/** Claim status badge for HMO/PhilHealth claims. */
export function ClaimStatusBadge({ status }: { status: string }) {
  const label = claimStatusLabels[status] ?? status;
  const variant: BadgeProps["variant"] =
    status === "active"
      ? "success"
      : status === "cancelled"
        ? "danger"
        : "muted";
  return <Badge variant={variant}>{label}</Badge>;
}

/** Formatted PHP currency display. */
export function CurrencyDisplay({
  amount,
  currency = "PHP",
  className,
}: {
  amount: number | null | undefined;
  currency?: string;
  className?: string;
}) {
  const formatted =
    amount != null
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
        }).format(amount)
      : "—";
  return <span className={cn("odyssey-currency", className)}>{formatted}</span>;
}

/**
 * Renders a QR code as an inline SVG. Uses a simple text-to-visual representation.
 * For production, replace with a proper QR encoding library.
 */
export function QrPaymentCode({
  token,
  size = 200,
  className,
}: {
  token: string;
  size?: number;
  className?: string;
}) {
  // Generate a deterministic grid pattern from the token for a visual placeholder
  const gridSize = 21;
  const cellSize = size / gridSize;
  const cells: Array<{ x: number; y: number }> = [];

  // Simple hash-based pattern generation from token
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Finder patterns (top-left, top-right, bottom-left corners)
      const isFinderTL = row < 7 && col < 7;
      const isFinderTR = row < 7 && col >= gridSize - 7;
      const isFinderBL = row >= gridSize - 7 && col < 7;

      if (isFinderTL || isFinderTR || isFinderBL) {
        const lr = isFinderTL ? row : isFinderTR ? row : row - (gridSize - 7);
        const lc = isFinderTL ? col : isFinderTR ? col - (gridSize - 7) : col;
        const isOuter = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const isInner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        if (isOuter || isInner) {
          cells.push({ x: col * cellSize, y: row * cellSize });
        }
        continue;
      }

      // Data cells from hash
      const cellHash = ((hash + row * 31 + col * 17) * 2654435761) >>> 0;
      if (cellHash % 3 !== 0) {
        cells.push({ x: col * cellSize, y: row * cellSize });
      }
    }
  }

  return (
    <div className={cn("odyssey-qr", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`QR payment code: ${token.slice(0, 8)}...`}
      >
        <rect width={size} height={size} fill="white" />
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cellSize}
            height={cellSize}
            fill="black"
          />
        ))}
      </svg>
      <p className="odyssey-qr__label">Scan to pay</p>
    </div>
  );
}

export * from "./pmr";
export { StandardPrescriptionDocument } from "./documents/StandardPrescriptionDocument";
export type {
  StandardPrescriptionDocumentProps,
  PrescriptionItem,
} from "./documents/StandardPrescriptionDocument";
export { StandardMedicalCertificateDocument } from "./documents/StandardMedicalCertificateDocument";
export type { StandardMedicalCertificateDocumentProps } from "./documents/StandardMedicalCertificateDocument";
