import assert from "node:assert/strict";
import test from "node:test";
import type { PhilhealthClaimDocument } from "@odyssey/types";
import {
  buildClaimSignatureFormDocument,
  buildStatementOfAccountDocument,
  formatAge,
  formatSoaAmount,
  pinBoxes,
  summarizeClaimDocument,
} from "./philhealth-claim-documents.ts";

// Synthetic data only.
const sampleDocument: PhilhealthClaimDocument = {
  soa_number: "SOA-20261101-ABC123",
  phic_basis: "claimed_charges",
  facility: { name: "Synthetic LGU Hospital <Main>", address: "Sample City", hci_accreditation_number: "H00000001", facility_type: "hospital_level_1", ownership: "lgu" },
  patient: { id: "p1", number: "WI-0001", name: "Maria Test Santos", sex: "female", birth_date: "1976-07-11", address: "Sample Barangay" },
  member: { pin: "12-345678901-2", category: "sponsored", relationship: "self", eligibility_reference: "PBEF-TEST-0001" },
  encounter: { id: "e1", transaction_number: "OPD-ABCDEF12", setting: null, admitted_at: "2026-10-31T03:10:25Z", discharged_at: "2026-10-31T08:00:00Z", attending_name: "Synthetic Doctor", attending_accreditation: null },
  diagnoses: [{ code: "N39.0", description: "Urinary tract infection, site not specified", rank: 1 }],
  claim: { id: "c1", state: "draft", payer_type: "philhealth", primary_icd10_code: "N39.0", claimed_amount_centavos: 132000, approved_amount_centavos: null, adjudication_result: null, submitted_at: null, philhealth_claim_number: null },
  lines: [
    { id: "l1", service_date: "2026-10-31", item_code: "LAB-1", description: "Urinalysis", unit: "per use", quantity: 1, unit_price_centavos: 9500, line_total_centavos: 9500, soa_category: "laboratory", on_claim: true, discount_centavos: 0, phic_centavos: 9500, excess_centavos: 0 },
    { id: "l2", service_date: "2026-10-31", item_code: "SKU-9", description: "IV catheter <G18>", unit: "piece", quantity: 1, unit_price_centavos: 18700, line_total_centavos: 18700, soa_category: "supplies", on_claim: false, discount_centavos: 0, phic_centavos: 0, excess_centavos: 18700 },
    { id: "l3", service_date: "2026-10-31", item_code: "SERVICE-1", description: "Professional fee", unit: "per use", quantity: 1, unit_price_centavos: 26000, line_total_centavos: 26000, soa_category: "professional_fee", on_claim: true, discount_centavos: 0, phic_centavos: 26000, excess_centavos: 0 },
  ],
  payments_centavos: 5000,
  prepared_by: "Synthetic Billing Clerk",
  generated_at: "2026-11-01T01:00:00Z",
};

test("formats SOA amounts with a dash for zero", () => {
  assert.equal(formatSoaAmount(0), "-");
  assert.equal(formatSoaAmount(640900), "6,409.00");
});

test("computes the age on the visit date", () => {
  assert.equal(formatAge("1976-07-11", "2026-10-31T03:10:25Z"), "50 Y 3 M 20 D");
});

test("splits a PIN into 2-9-1 boxes", () => {
  const html = pinBoxes("12-345678901-2");
  assert.equal((html.match(/class="digit"/g) ?? []).length, 12);
  assert.ok(html.startsWith('<span class="digit">1</span><span class="digit">2</span><span class="dash">-</span>'));
});

test("separates hospital charges from professional fees and nets payments", () => {
  const summary = summarizeClaimDocument(sampleDocument);
  assert.deepEqual(summary.hospital, { actual: 28200, discount: 0, phic: 9500, excess: 18700 });
  assert.deepEqual(summary.professional, { actual: 26000, discount: 0, phic: 26000, excess: 0 });
  assert.equal(summary.due.excess, 13700);
});

test("statement of account escapes data and prints both pages", () => {
  const html = buildStatementOfAccountDocument(sampleDocument);
  assert.ok(html.includes("Synthetic LGU Hospital &lt;Main&gt;"));
  assert.ok(html.includes("IV catheter &lt;G18&gt;"));
  assert.ok(!html.includes("<Main>"));
  assert.ok(html.includes("PHIC Statement of Account"));
  assert.ok(html.includes("Itemized Charges"));
  assert.ok(html.includes("SOA no. SOA-20261101-ABC123"));
  assert.ok(html.includes("amount claimed from PhilHealth"));
});

test("claim signature form puts a member's PIN in Part I and the case rate code in Part V", () => {
  const html = buildClaimSignatureFormDocument(sampleDocument);
  const partOne = html.slice(html.indexOf("Part I "), html.indexOf("Part II"));
  assert.equal((partOne.match(/class="digit">[0-9]</g) ?? []).length >= 12, true);
  assert.ok(html.includes('first case rate:</span><span class="fill">N39.0</span>'));
});

test("claim signature form puts a dependent's PIN in the dependent field", () => {
  const html = buildClaimSignatureFormDocument({ ...sampleDocument, member: { ...sampleDocument.member, relationship: "child" } });
  const dependentRow = html.slice(html.indexOf("4. PIN of dependent"), html.indexOf("5. Name of patient"));
  assert.equal((dependentRow.match(/class="digit">[0-9]</g) ?? []).length, 12);
});
