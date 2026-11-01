import type {
  PhilhealthClaimDocument,
  PhilhealthClaimDocumentLine,
  PhilhealthSoaCategory,
} from "@odyssey/types";

/*
 * Printable PhilHealth claim documents built from get_philhealth_claim_document:
 * the PHIC Statement of Account with its Itemized Charges page, and a pre-filled
 * Claim Signature Form. Pure functions returning a full HTML document so they
 * can be unit-tested and opened in a print window. The facility's own name is
 * used as the letterhead; no other institution's branding is ever printed.
 */

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const amountFormatter = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface NameParts {
  family: string | null;
  given: string | null;
  middle: string | null;
  suffix: string | null;
}

/**
 * PhilHealth name order: LAST, FIRST SUFFIX, MIDDLE (claim form guidelines),
 * in capitals. Falls back to the free-text name when parts are missing.
 */
export function formatPhilhealthName(parts: NameParts, fallback: string): string {
  if (!parts.family || !parts.given) return fallback.toUpperCase();
  const first = [parts.given, parts.suffix].filter(Boolean).join(" ");
  return [parts.family, first, parts.middle].filter(Boolean).join(", ").toUpperCase();
}

/** SOA style: plain amounts, with "-" for zero. */
export function formatSoaAmount(centavos: number | null | undefined): string {
  const value = Number(centavos ?? 0);
  return value === 0 ? "-" : amountFormatter.format(value / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return escapeHtml(value);
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return escapeHtml(value);
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "short", timeStyle: "short" }).format(date);
}

/** Age as "50 Y 3 M 20 D" on the visit date, like hospital SOAs. */
export function formatAge(birthDate: string | null | undefined, onDate: string | null | undefined): string {
  if (!birthDate) return "";
  const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00Z`);
  const at = onDate ? new Date(onDate) : new Date();
  if (Number.isNaN(birth.valueOf()) || Number.isNaN(at.valueOf())) return "";
  let years = at.getUTCFullYear() - birth.getUTCFullYear();
  let months = at.getUTCMonth() - birth.getUTCMonth();
  let days = at.getUTCDate() - birth.getUTCDate();
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} Y ${months} M ${days} D`;
}

const categoryRows: { key: PhilhealthSoaCategory | "operating_room" | "radiology" | "room_and_board"; label: string }[] = [
  { key: "medicines", label: "Medicines" },
  { key: "supplies", label: "Supplies" },
  { key: "operating_room", label: "Operating room / delivery fee" },
  { key: "radiology", label: "Radiology" },
  { key: "laboratory", label: "Laboratory" },
  { key: "other_services", label: "Other proc. / services" },
  { key: "room_and_board", label: "Room and board" },
];

interface SplitTotals {
  actual: number;
  discount: number;
  phic: number;
  excess: number;
}

function sumLines(lines: PhilhealthClaimDocumentLine[]): SplitTotals {
  return lines.reduce(
    (total, line) => ({
      actual: total.actual + Number(line.line_total_centavos),
      discount: total.discount + Number(line.discount_centavos),
      phic: total.phic + Number(line.phic_centavos),
      excess: total.excess + Number(line.excess_centavos),
    }),
    { actual: 0, discount: 0, phic: 0, excess: 0 },
  );
}

/** Hospital charges, professional fees and the amount due, all in centavos. */
export function summarizeClaimDocument(document: PhilhealthClaimDocument) {
  const hospitalLines = document.lines.filter((line) => line.soa_category !== "professional_fee");
  const professionalLines = document.lines.filter((line) => line.soa_category === "professional_fee");
  const hospital = sumLines(hospitalLines);
  const professional = sumLines(professionalLines);
  const payments = Number(document.payments_centavos ?? 0);
  return {
    hospital,
    professional,
    payments,
    due: {
      actual: hospital.actual + professional.actual,
      discount: hospital.discount + professional.discount,
      phic: hospital.phic + professional.phic,
      excess: Math.max(0, hospital.excess + professional.excess - payments),
    },
  };
}

function splitCells(totals: SplitTotals): string {
  return `<td class="num">${formatSoaAmount(totals.actual)}</td><td class="num">${formatSoaAmount(totals.discount)}</td><td class="num">${formatSoaAmount(totals.phic)}</td><td class="num">${formatSoaAmount(totals.excess)}</td>`;
}

const sharedStyles = `
  *{box-sizing:border-box}
  body{margin:0;background:#e9edf2;color:#111;font:12px/1.35 Arial,Helvetica,sans-serif}
  .toolbar{display:flex;justify-content:flex-end;gap:8px;max-width:210mm;margin:12px auto}
  .toolbar button{border:0;border-radius:6px;background:#155e75;color:#fff;padding:9px 14px;font:700 13px Arial;cursor:pointer}
  .page{width:210mm;min-height:297mm;margin:0 auto 16px;padding:14mm 12mm;background:#fff;box-shadow:0 2px 10px #0002}
  h1{margin:0;font-size:17px;text-align:center;letter-spacing:.02em}
  h2{margin:4px 0 10px;font-size:14px;text-align:center}
  .facility-line{margin:0;text-align:center;font-size:11px;color:#333}
  .doc-no{margin:10px 0 4px;font-weight:700}
  table{width:100%;border-collapse:collapse}
  .box{border:1.5px solid #111}
  .grid th,.grid td{border:1px solid #111;padding:3px 5px;vertical-align:top}
  .grid th{background:#f1f1f1;font-size:11px;text-transform:uppercase}
  .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .label{font-weight:700;white-space:nowrap;width:1%}
  .meta td{padding:2px 6px;vertical-align:top}
  .total td{font-weight:700;background:#fafafa}
  .note{margin:8px 0 0;font-size:10px;color:#444}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:26px}
  .sign .line{border-top:1px solid #111;padding-top:3px;text-align:center;font-size:10px}
  .sign .name{min-height:16px;text-align:center;font-weight:700;text-transform:uppercase}
  .muted{color:#555}
  @page{size:A4;margin:0}
  @media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}}
`;

function wrapDocument(title: string, pages: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${sharedStyles}</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>${pages}</body></html>`;
}

function headerBlock(document: PhilhealthClaimDocument, heading: string): string {
  const facility = document.facility;
  return `<h1>${escapeHtml(facility.name)}</h1>${facility.address ? `<p class="facility-line">${escapeHtml(facility.address)}</p>` : ""}${facility.hci_accreditation_number ? `<p class="facility-line">PhilHealth accreditation no. ${escapeHtml(facility.hci_accreditation_number)}</p>` : ""}<h2>${escapeHtml(heading)}</h2>`;
}

function patientBlock(document: PhilhealthClaimDocument): string {
  const { patient, member, encounter } = document;
  const finalDiagnosis = document.diagnoses.find((diagnosis) => diagnosis.rank === 1) ?? document.diagnoses[0];
  const days = encounter.admitted_at
    ? Math.max(1, Math.ceil(((encounter.discharged_at ? new Date(encounter.discharged_at) : new Date()).valueOf() - new Date(encounter.admitted_at).valueOf()) / 86_400_000))
    : "";
  const rows: [string, string, string, string][] = [
    ["Patient no.", patient.number, "Admission date", formatDateTime(encounter.admitted_at)],
    ["Patient name", formatPhilhealthName(patient, patient.name), "Discharge date", formatDateTime(encounter.discharged_at)],
    ["Address", patient.address ?? "", "Age", formatAge(patient.birth_date, encounter.admitted_at)],
    ["Transaction no.", encounter.transaction_number, "No. of days", String(days)],
    ["Final diagnosis", finalDiagnosis?.description ?? "", "PHIC member PIN", member.pin ?? ""],
    ["ICD-10 code", finalDiagnosis?.code ?? "", "PHIC category", member.category ?? ""],
    ["", "", "Attending MD", encounter.attending_name ?? ""],
  ];
  return `<table class="box meta"><tbody>${rows
    .map(([leftLabel, leftValue, rightLabel, rightValue]) => `<tr><td class="label">${escapeHtml(leftLabel)}${leftLabel ? ":" : ""}</td><td>${escapeHtml(leftValue)}</td><td class="label">${escapeHtml(rightLabel)}:</td><td>${escapeHtml(rightValue)}</td></tr>`)
    .join("")}</tbody></table>`;
}

function signatureBlock(document: PhilhealthClaimDocument): string {
  return `<div class="sign">
    <div><div class="name">${escapeHtml(document.prepared_by ?? "")}</div><div class="line">Prepared by (billing)</div></div>
    <div><div class="name">${escapeHtml(formatPhilhealthName(document.patient, document.patient.name))}</div><div class="line">Signature over printed name of member / representative</div></div>
    <div><div class="name"></div><div class="line">Relationship to member · Date signed · Contact no.</div></div>
    <div><div class="name"></div><div class="line">Authorized HCI representative · Designation · Date signed</div></div>
  </div>
  <p class="note">I certify that the services listed were recorded in the patient's chart and the facility's records, and that this information is true and correct.</p>`;
}

/** PHIC Statement of Account (page 1) plus Itemized Charges (page 2). */
export function buildStatementOfAccountDocument(document: PhilhealthClaimDocument): string {
  const summary = summarizeClaimDocument(document);
  const hospitalLines = document.lines.filter((line) => line.soa_category !== "professional_fee");
  const professionalLines = document.lines.filter((line) => line.soa_category === "professional_fee");
  const finalDiagnosis = document.diagnoses.find((diagnosis) => diagnosis.rank === 1) ?? document.diagnoses[0];
  const basisNote =
    document.phic_basis === "claimed_charges"
      ? `<p class="note">PHIC column: amount claimed from PhilHealth. The payable amount is confirmed when PhilHealth adjudicates the claim.</p>`
      : "";

  const categoryBody = categoryRows
    .map((row) => {
      const totals = sumLines(hospitalLines.filter((line) => line.soa_category === row.key));
      return `<tr><td>${escapeHtml(row.label)}</td>${splitCells(totals)}</tr>`;
    })
    .join("");
  const professionalBody = (professionalLines.length ? professionalLines : [])
    .map((line) => `<tr><td>${escapeHtml(document.encounter.attending_accreditation ?? "")} ${escapeHtml(line.description)}</td>${splitCells(sumLines([line]))}</tr>`)
    .join("");

  const page1 = `<section class="page">
    ${headerBlock(document, "PHIC Statement of Account")}
    <p class="doc-no">SOA no. ${escapeHtml(document.soa_number)}</p>
    ${patientBlock(document)}
    <table class="grid" style="margin-top:10px"><thead><tr><th style="text-align:left">Particulars</th><th>Actual</th><th>Discount</th><th>PHIC</th><th>Excess</th></tr></thead><tbody>
      ${categoryBody}
      <tr class="total"><td>Gross hospital charges</td>${splitCells(summary.hospital)}</tr>
      <tr><td colspan="5" class="label">Professional fees</td></tr>
      ${professionalBody || `<tr><td class="muted">None billed</td><td class="num">-</td><td class="num">-</td><td class="num">-</td><td class="num">-</td></tr>`}
      <tr class="total"><td>Total professional fees</td>${splitCells(summary.professional)}</tr>
      <tr><td>Less: payments</td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num">${formatSoaAmount(summary.payments)}</td></tr>
      <tr class="total"><td>Total amount due</td>${splitCells(summary.due)}</tr>
    </tbody></table>
    <table class="grid" style="margin-top:10px"><tbody>
      <tr><td class="label">First case rate ICD/RVS</td><td>${escapeHtml(finalDiagnosis?.code ?? "")} ${escapeHtml(finalDiagnosis?.description ?? "")}</td><td class="label">PHIC package</td><td class="num">${formatSoaAmount(summary.due.phic)}</td></tr>
      <tr><td class="label">Second case rate ICD/RVS</td><td></td><td class="label">PHIC package</td><td class="num">-</td></tr>
    </tbody></table>
    ${basisNote}
    <p class="note">Printed ${escapeHtml(formatDateTime(document.generated_at))}</p>
  </section>`;

  const itemRows = hospitalLines
    .map((line) => `<tr><td>${escapeHtml(formatDate(line.service_date))}</td><td>${escapeHtml(line.item_code ?? "")}</td><td>${escapeHtml(line.description)}</td><td class="num">${formatSoaAmount(line.line_total_centavos)}</td><td>${escapeHtml(line.unit)}</td><td class="num">${formatSoaAmount(line.phic_centavos)}</td><td class="num">${escapeHtml(Number(line.quantity).toFixed(2))}</td><td class="num">${formatSoaAmount(line.excess_centavos)}</td></tr>`)
    .join("");
  const page2 = `<section class="page">
    ${headerBlock(document, "Itemized Charges")}
    ${patientBlock(document)}
    <table class="grid" style="margin-top:10px"><thead><tr><th>Service date</th><th>Item no.</th><th>Item name</th><th>Total price</th><th>Unit</th><th>PHIC</th><th>Qty</th><th>Excess</th></tr></thead><tbody>
      ${itemRows || `<tr><td colspan="8" class="muted">No hospital charges were billed for this visit.</td></tr>`}
      <tr class="total"><td colspan="3">Gross hospital charge</td><td class="num">${formatSoaAmount(summary.hospital.actual)}</td><td></td><td class="num">${formatSoaAmount(summary.hospital.phic)}</td><td></td><td class="num">${formatSoaAmount(summary.hospital.excess)}</td></tr>
    </tbody></table>
    ${signatureBlock(document)}
  </section>`;

  return wrapDocument(`Statement of Account ${document.soa_number}`, page1 + page2);
}

/** Splits a PIN into its 2-9-1 boxes; missing digits stay blank. */
export function pinBoxes(pin: string | null | undefined): string {
  const digits = (pin ?? "").replace(/\D/g, "").padEnd(12, " ").slice(0, 12).split("");
  const group = (part: string[]) => part.map((digit) => `<span class="digit">${escapeHtml(digit.trim())}</span>`).join("");
  return `${group(digits.slice(0, 2))}<span class="dash">-</span>${group(digits.slice(2, 11))}<span class="dash">-</span>${group(digits.slice(11))}`;
}

function dateBoxes(value: string | null | undefined): string {
  let month = "";
  let day = "";
  let year = "";
  if (value) {
    const date = new Date(value.length === 10 ? `${value}T00:00:00+08:00` : value);
    if (!Number.isNaN(date.valueOf())) {
      const parts = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
      month = parts.find((part) => part.type === "month")?.value ?? "";
      day = parts.find((part) => part.type === "day")?.value ?? "";
      year = parts.find((part) => part.type === "year")?.value ?? "";
    }
  }
  const boxes = (text: string, size: number) => text.padEnd(size, " ").split("").map((digit) => `<span class="digit">${escapeHtml(digit.trim())}</span>`).join("");
  return `${boxes(month, 2)}<span class="dash">-</span>${boxes(day, 2)}<span class="dash">-</span>${boxes(year, 4)}<span class="hint">month-day-year</span>`;
}

/** Pre-filled Claim Signature Form; signatures, thumbmarks and employer details stay blank. */
export function buildClaimSignatureFormDocument(document: PhilhealthClaimDocument): string {
  const { patient, member, encounter, facility } = document;
  const isMember = member.relationship === "self";
  const memberName: NameParts = isMember ? patient : member;
  const memberBirthDate = isMember ? patient.birth_date : member.birth_date;
  // The CSF splits names into last / first / extension / middle boxes.
  const nameBoxes = (parts: NameParts, fallback: string) =>
    parts.family && parts.given
      ? [["Last name", parts.family], ["First name", parts.given], ["Name extension", parts.suffix], ["Middle name", parts.middle]]
          .map(([label, value]) => `<span class="name-box"><span class="fill">${escapeHtml(value ?? "")}</span><span class="hint">${label}</span></span>`)
          .join("")
      : `<span class="fill">${escapeHtml(fallback)}</span>`;
  const finalDiagnosis = document.diagnoses.find((diagnosis) => diagnosis.rank === 1) ?? document.diagnoses[0];
  const check = (checked: boolean) => `<span class="check">${checked ? "✓" : ""}</span>`;
  const csfStyles = `
    .csf-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:6px}
    .csf-head h1{text-align:left;font-size:15px}.csf-head .form{font-size:30px;font-weight:900;line-height:1}
    .part{margin-top:8px;border:1.5px solid #111}
    .part>h3{margin:0;padding:3px 6px;background:#111;color:#fff;font-size:11px;text-align:center;text-transform:uppercase}
    .part .body{padding:6px 8px;display:grid;gap:7px}
    .row{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
    .row .label{width:auto;flex:none}
    .name-box{flex:1;min-width:110px;display:flex;flex-direction:column}.name-box .hint{margin:1px 0 0;text-align:center}
    .fill{flex:1;min-width:120px;border-bottom:1px solid #111;min-height:16px;font-weight:700;text-transform:uppercase}
    .digit{display:inline-block;width:15px;height:18px;border:1px solid #111;text-align:center;font-weight:700;line-height:17px;margin-right:1px}
    .dash{margin:0 3px}.hint{margin-left:6px;font-size:9px;color:#555}
    .check{display:inline-block;width:13px;height:13px;border:1px solid #111;text-align:center;line-height:12px;font-size:11px;margin-right:3px}
    .thumb{width:90px;height:60px;border:1px solid #111}
  `;
  const page = `<section class="page">
    <style>${csfStyles}</style>
    <div class="csf-head"><div><h1>Philippine Health Insurance Corporation</h1><p class="facility-line" style="text-align:left">Claim Signature Form · pre-filled by ${escapeHtml(facility.name)}</p></div><div class="form">CSF</div></div>

    <div class="part"><h3>Part I — Member and patient information and certification</h3><div class="body">
      <div class="row"><span class="label">1. PhilHealth Identification Number (PIN) of member:</span>${pinBoxes(isMember ? member.pin : member.member_pin)}</div>
      <div class="row"><span class="label">2. Name of member:</span>${nameBoxes(memberName, isMember ? patient.name : "")}</div>
      <div class="row"><span class="label">3. Member date of birth:</span>${dateBoxes(memberBirthDate)}</div>
      <div class="row"><span class="label">4. PIN of dependent:</span>${isMember ? pinBoxes("") : pinBoxes(member.pin)}</div>
      <div class="row"><span class="label">5. Name of patient:</span>${nameBoxes(patient, patient.name)}</div>
      <div class="row"><span class="label">6. Relationship to member:</span>${check(member.relationship === "child")}child ${check(member.relationship === "parent")}parent ${check(member.relationship === "spouse")}spouse</div>
      <div class="row"><span class="label">7. Confinement period — admitted:</span>${dateBoxes(encounter.admitted_at)}<span class="label">discharged:</span>${dateBoxes(encounter.discharged_at)}</div>
      <div class="row"><span class="label">8. Patient date of birth:</span>${dateBoxes(patient.birth_date)}</div>
      <div class="row"><span class="label">9. Certification of member:</span><span class="muted">I attest that the information I provided in this form is true and accurate.</span></div>
      <div class="row"><span class="fill"></span><span class="fill"></span><div class="thumb"></div></div>
      <div class="row"><span class="muted" style="flex:1;text-align:center">Signature over printed name of member · date signed</span><span class="muted" style="flex:1;text-align:center">Signature over printed name of representative · relationship · reason</span><span class="muted" style="width:90px;text-align:center">Thumbmark</span></div>
    </div></div>

    <div class="part"><h3>Part II — Employer's certification (employed members only)</h3><div class="body">
      <div class="row"><span class="label">1. PhilHealth Employer Number (PEN):</span><span class="fill"></span><span class="label">2. Contact no.:</span><span class="fill"></span></div>
      <div class="row"><span class="label">3. Business name:</span><span class="fill"></span></div>
      <div class="row"><span class="label">4. Certification of employer:</span><span class="fill"></span><span class="fill"></span><span class="label">Date signed:</span><span class="fill" style="max-width:120px"></span></div>
    </div></div>

    <div class="part"><h3>Part III — Consent to access patient record/s</h3><div class="body">
      <div class="row"><span class="muted">I consent to PhilHealth examining the patient's pertinent medical records to verify this claim.</span></div>
      <div class="row"><span class="fill"></span><span class="label">Date signed:</span><span class="fill" style="max-width:120px"></span><div class="thumb"></div></div>
      <div class="row"><span class="muted">Signature over printed name of member / patient / authorized representative</span></div>
    </div></div>

    <div class="part"><h3>Part IV — Health care professional information</h3><div class="body">
      <div class="row"><span class="label">Accreditation no.:</span><span class="fill">${escapeHtml(encounter.attending_accreditation ?? "")}</span><span class="fill">${escapeHtml(encounter.attending_name ?? "")}</span><span class="label">Date signed:</span><span class="fill" style="max-width:120px"></span></div>
      <div class="row"><span class="label">Accreditation no.:</span><span class="fill"></span><span class="fill"></span><span class="label">Date signed:</span><span class="fill" style="max-width:120px"></span></div>
    </div></div>

    <div class="part"><h3>Part V — Provider information and certification</h3><div class="body">
      <div class="row"><span class="label">1. PhilHealth benefits · ICD-10 or RVS code — first case rate:</span><span class="fill">${escapeHtml(finalDiagnosis?.code ?? "")}</span><span class="label">second case rate:</span><span class="fill"></span></div>
      <div class="row"><span class="muted">I certify that the services rendered were recorded in the patient's chart and the facility's records, and that this information is true and correct.</span></div>
      <div class="row"><span class="fill"></span><span class="fill"></span><span class="label">Date signed:</span><span class="fill" style="max-width:120px"></span></div>
      <div class="row"><span class="muted" style="flex:1;text-align:center">Signature over printed name of authorized HCI representative</span><span class="muted" style="flex:1;text-align:center">Official capacity / designation</span></div>
    </div></div>
    <p class="note">Check this pre-filled form against the current official PhilHealth CSF revision before filing.</p>
  </section>`;
  return wrapDocument(`Claim Signature Form ${patient.name}`, page);
}
