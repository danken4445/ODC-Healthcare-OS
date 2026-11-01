# Automated PhilHealth Claims — Analysis & Implementation Plan

Status: slices 5.0 and part of 5.3 are built on `feat/philhealth-claims-5-0`; §5 is the roadmap for the rest. Updated 2026-11-01.
(126 migrations). An earlier draft was written against an outdated partial copy
of the repo; everything below re-checks the current code.

Relationship to existing docs: this plan is the PhilHealth-specific detail for
**Loop 5** of [`revenue-operations-and-hmo-claims.md`](revenue-operations-and-hmo-claims.md)
and [`revenue-operations-hmo-philhealth-master-prompt.md`](../revenue-operations-hmo-philhealth-master-prompt.md).
It follows their rules (`AGENTS.md`): integer-centavo money, append-only
ledgers, `security definer` + `search_path = ''`, `db_engineer` owns
migrations. §6 lists places where those docs conflict with current PhilHealth
rules.

Reference material: a consented, real PhilHealth claim packet from a DOH
Level-3 hospital (PHIC Statement of Account, Itemized Charges, PBEF, CSF) for an
outpatient ER visit billed under `OPER1`. **The photos contain the patient's
name, PIN, birth date, address and phone number. Never commit them or use
them in seed data.** Only the peso amounts are reused here.

---

## 1. What the current code does

### 1.1 Charge capture (works, mostly as the design doc intends)
| Source | How it reaches the bill | Line `source_type` / `source_id` |
|---|---|---|
| Booked service | `generate_appointment_bill` at booking → draft event + line → `issue_billing_invoice` | `clinic_service` / service id |
| Professional fee | Trigger `add_professional_fee_billing_line` when `fee_model = 'practitioner_declared'` (Loop B11) | `professional_fee` |
| Inventory | `tag_inventory_usage` deducts stock **immediately** (FEFO batches since `20261006082101`), writes `inventory_usages` + `inventory_usage_financial_ledger`, `sync_inventory_usage_to_billing` adds the line | `inventory_usage` / usage id |
| Laboratory | `create_diagnostic_service_request` → `sync_laboratory_request_to_billing` adds the line **at order time** (price = `laboratory_services.lab_cost`) | `laboratory_service` / request id |
| Pharmacy / POS | `create_pos_sale`, `create_nbb_pharmacy_pos_sale` (centavo standard totals) | `pos_item` |

`ensure_encounter_draft_bill` keeps one draft per encounter.
`finish_clinical_encounter` and `finalize_billing_event` both end in
`issue_billing_invoice`.

### 1.2 Billing modes and NBB
- `resolve_billing_mode` picks `nbb` if the patient has an active coverage
  whose `coverage_type` is `philhealth_nbb` / `government_subsidized` / `nbb`.
  Otherwise it uses the service's `nbb_eligible` override, otherwise the
  organization's `default_payor_type`.
- The **facility classification toggle** (`set_organization_facility_classification`)
  just sets `organizations.default_payor_type`. "Government No-Billing" therefore
  means *every* patient at that facility is NBB, with no member category or
  eligibility check.
- In `nbb` mode, `issue_billing_invoice` makes a ₱0 `paid` invoice, marks every
  line and inventory ledger row `written_off`, and confirms the appointment.

### 1.3 Claims: the critical gap
- **No code path creates a `claims` row anymore.** The only
  `insert into public.claims` lives in the original `finalize_billing_event`
  (`20260903000700`). `20260927180000_billing_management_lifecycle.sql`
  replaced `finalize_billing_event` with a version that calls
  `issue_billing_invoice`, which never inserts a claim.
- The admin UI still offers payor routes **"HMO claim" / "PhilHealth NBB claim" /
  "Government-subsidized claim"** (`apps/admin-web/components/record-management.tsx:365`).
  It also has a claims list with **Submit** / **Adjudicate** actions
  (`/billing/claims`, `ClaimActions`). Choosing a claim route now produces only
  a written-off invoice. The claims list stays empty for new visits.
- `submit_claim` / `adjudicate_claim` are unchanged from the original
  migration: no resubmission guard, no amount validation, denial = `cancelled`,
  no PhilHealth statuses.

### 1.4 Clinical coding
- `icd10_reference` (≈4,668 rows, `20260927041531`) holds **PhilHealth Annex A
  medical case rates**: `case_rate`, `professional_fee`, `hci_fee`, plus a trigram
  search RPC `search_icd10_reference`. It is a big head start. Gaps:
  - no effective dates or circular version (PhilHealth raised case rates
    ~50% from 1 Jan 2025, so these values must be checked against the current
    annex);
  - stored as `numeric`, not centavos;
  - no RVS (procedure) table.
- ICD-10 search is only used to tag **document templates**
  (`template-studio.tsx`). **Nothing writes ICD-10 diagnoses for an encounter.**
  The FHIR `conditions` table (`20261002010000`) is read by the PMR builder and
  by disease surveillance, but no RPC or UI inserts into it. The only diagnosis
  writer is still the musculoskeletal `record_encounter_region_diagnosis`, which
  writes `encounters.diagnosis`, not `conditions`. So claims have no diagnosis
  code, and as a side effect the disease-surveillance rollups have no data
  source.

### 1.5 Bugs and risks found in passing
1. **Duplicate lines on supplemental bills (likely).** A lab can be ordered on
   a `finished` encounter, which creates a supplemental draft.
   `finalize_billing_event` then calls `generate_billing_event`, which loops
   **all** of the encounter's usages and lab requests into the *current* draft.
   The unique key is `(billing_event_id, source_type, source_id)`, so lines
   already billed on the first invoice get re-added. Needs a validation test.
2. NBB is applied per facility, not per eligible member (§1.2).
3. Money in billing tables is still `numeric(12,2)`. The design doc requires
   centavos, so new claim tables must use `bigint` and convert at the boundary.

Fixed since the earlier draft: inventory holds are gone (immediate deduction +
void reversal), labs bill on order, `coverage_id` is now set from the resolved
NBB coverage, and the `coverages.kind` seed bug is gone.

---

## 2. What the real documents require (unchanged findings)

- **PHIC SOA**:
  - header: SOA no., patient, classification, transaction no., final diagnosis
    + ICD-10, admission/discharge, age, case type, member PIN/category/name,
    attending MD;
  - charges grid (Medicines, Supplies, OR, Radiology, Laboratory, Other
    Proc., Room & Board) with columns **Actual / Discount / PHIC / Excess**;
  - PF rows with accreditation nos.;
  - totals;
  - first/second case-rate block.
- **Itemized Charges**: service date, **item no. = EECL item number**, name,
  price, unit (per use / per hour), PHIC, qty, excess; billing clerk, member,
  and HCI-representative signatures.
- **PBEF**: issued by PhilHealth's system. **Never generate a look-alike.**
  Store the reference/tracking number, result and category, plus the scan.
- **CSF** (rev. Sept 2018): PhilHealth allows reproduction, so pre-fill it on
  the official blank (Parts I–V, case-rate code `OPER1`).
- **Sample numbers = acceptance test** (synthetic data, same amounts):

| Group | Actual | PHIC | Excess |
|---|---|---|---|
| EECL items (PHIC = fixed fee) | 2,320.00 | 6,409.00 | 37.00 (IV cannulation 200 − 163) |
| Non-EECL items | 849.00 | 0.00 | 849.00 |
| **Hospital total** | **3,169.00** | **6,409.00** | **886.00** |
| PF — urgent ER consultation fixed fee | 260.00 | 260.00 | 0.00 |
| **OPER1 package** | 3,429.00 | **6,669.00** | 886.00 |

---

## 3. Decisions (researched)

| # | Question | Decision | Basis |
|---|---|---|---|
| 1 | Which benefits? | **Facility-Based Emergency (`OPER1`) first, inpatient/medical case rates (ICD-10 Annex A, already in `icd10_reference`) second, YAKAP third.** The product targets hospitals ("Phase 1 Single-Hospital Production"), and FBE is filed by accredited L1–3 hospitals. YAKAP matters only for clinic tenants. | PC 2025-0020 §C.1; existing design doc §14 |
| 2 | How is PHIC split per item? | **Fixed fee per item, not an allocation.** PHIC = EECL fixed fee × qty, **even if the charge is lower**. Excess = max(net − PHIC, 0). Non-EECL items are out-of-pocket. | PC 2025-0020 §B.3, Annex B; verified line by line on the sample (Dengue Duo3 0090 = 2,952; Creatinine 0084 = 733; Vital Signs 0020 = 156/hr; ALT 0140 = 309; urgent ER consult = 260 per Advisory 2025-0073) |
| 3 | What happens to the excess? | **Per member, not per facility.** Collect from the patient unless the facility applies NBB (mandatory for government HCIs, voluntary for private) **and** the member is in an NBB category (indigent, sponsored, kasambahay, senior, lifetime). In that case, route the excess to write-off / MAIFIP / other funds in JAO 2020-0001 order. | NBB rules; PC 2025-0020 §D.11 |
| 4 | Submission route? | **Certification-ready XML, sent through a certified partner for now, and start PhilHealth software certification in parallel.** PDF SOAs are rejected; eClaims < 3.0 has been off since 1 Jul 2026; only certified software may submit. The XML schemas come from PhilHealth ITMD through certification. This answers the design doc's open question 13.3 #1. | Advisories 2026-0022, 2026-0040, 2026-0010; PC 2017-0030 |
| 5 | Frontend source | Resolved: it's in the GitHub repo (`apps/admin-web`, `provider-web`, `patient-web`, desktop apps). | — |

### 3.1 Review decisions (researched 2026-10-31)

**A. Who gets ₱0 at a "Government No-Billing" facility? Not every patient, and
not only "eligible members" either. It depends on three things together.**

PhilHealth and DOH run two different ₱0 policies:
- **No Balance Billing (NBB)**, PC 2017-0006 (Rev. 1):
  - Covers **members and dependents** who are indigent, sponsored (including
    point-of-service), kasambahay, senior citizens, or lifetime members.
  - Applies in **all accredited government HCIs**, and in specific private
    facility types: Z-benefit contracted facilities, ambulatory surgical
    clinics, dialysis centers, TB-DOTS centers, birthing homes (maternity
    packages only), infirmaries and dispensaries.
  - Applies in private hospitals **only with a signed MOA** with PhilHealth.
    Without one, a private hospital may not even use the term "NBB".
  - For confinement, it applies only in **ward-type accommodation**. Choosing a
    private room voids it.
  - Hospitals must apply it automatically and must not reclassify NBB patients.
- **Zero Balance Billing (ZBB)**, DOH, 2025:
  - Applies in the **87 DOH-retained hospitals**.
  - Covers **every Filipino**, because everyone is a PhilHealth member under the
    UHC Act and non-members are enrolled on the spot.
  - Covers admission in **basic/ward accommodation** only.
  - The **ER is excluded**; it falls under the outpatient emergency package
    instead. This is why the sample DOH-hospital ER visit still shows ₱886
    excess, even though the patient is a sponsored member.

So the rule is: **patient pays ₱0 = facility policy × encounter setting and
accommodation × patient category.**

| Facility policy | Inpatient, ward/basic | Inpatient, private room | Outpatient / ER (e.g. FBE) |
|---|---|---|---|
| `zbb` (DOH-retained) | ₱0 for **all** patients (enroll non-members) | Normal billing | Normal: PhilHealth fixed fee; excess to MAIFIP/Malasakit if the patient qualifies, else the patient pays |
| `nbb` (other government, or private with MOA) | ₱0 for NBB-category members and dependents | Normal billing | ₱0 only for packages the NBB circular lists for that facility type (e.g. primary care, DOTS, animal bite); otherwise normal |
| `none` (private, no MOA) | Normal billing | Normal billing | Normal billing |

Implementation:
- Replace the toggle's meaning with `organization_settings.balance_billing_policy`
  (`none` | `nbb` | `zbb`), set separately from `ownership` and `facility_type`.
- Add `accommodation_type` (`ward_basic` | `private`) to inpatient encounters.
- `resolve_billing_mode` returns `nbb` only when the table above says ₱0.
- The ₱0 is always written as a **funded write-off** with a recorded source
  (PhilHealth package / MAIFIP / PCSO / hospital charity fund), never a silent
  zero.
- Existing "Government No-Billing" organizations migrate to `nbb`.
- **Check needed:** the NBB pharmacy POS (`create_nbb_pharmacy_pos_sale`) gives
  walk-in pharmacy sales ₱0. Outpatient retail drugs aren't in the NBB
  circular's benefit list (case rates, Z packages, primary care, MERS/Ebola), so
  each of those sales needs a recorded funding source (e.g. MAIFIP or GAMOT), or
  the hospital is absorbing them unrecorded.

**B. Supplies and overhead fees on emergency-package visits: block the
charge, not the tagging.**
- PC 2025-0020 §B.9–10 says ER overhead fees and the supplies needed to give
  ED care "have been bundled in the fixed fee", and hospitals "shall not
  charge patients these costs separately."
- NBB rules also forbid making patients buy or replace supplies.
- Penalties: a legal commentary reports fines of up to ₱200,000 per count plus
  accreditation suspension (secondary source; verify).
- Only flagging leaves the hospital exposed on every claim.

So, under an FBE (`OPER1`) claim:
- Supplies and overhead are still **tagged** (stock deduction, cost, and the
  circular requires every utilized ED service on the SOA).
- They are kept at **standard price with PHIC ₱0 and Excess ₱0** (rule
  `bundled`), written off as "bundled in fixed fee".
- A **duplicate facility consultation fee** is treated the same way, because the
  EECL already pays the ED consultation.
- Medicines and services **outside** the EECL stay chargeable (§B.11).
- **Override:** a billing supervisor can re-mark a line as chargeable with a
  mandatory reason, logged in `billing_state_transitions`. Use this for items
  genuinely unrelated to ED care.

Applied to the sample, the patient's ₱886 excess would become ₱37 plus
whatever non-EECL medicines/services remain. Supplies (₱609), patient ID
(₱20) and the duplicate ₱150 consultation fee go to ₱0. The injection fee
(₱70) needs the hospital to say whether it is a separate service.

**C. Table names: keep the design doc's names, but evolve the existing
`claims` table instead of recreating it.**
- `claims`, `claim_line_items`, `claim_responses`, `claim_appeals` follow repo
  convention (`billing_line_items`, `invoice_qr_tokens`) and map to FHIR R4
  `Claim`, `Claim.item` and `ClaimResponse`. FHIR has no appeal resource, so
  `claim_appeals` is ours.
- **The design doc's DDL can't run as written:**
  - `create table public.claims` collides with the existing table, so use
    `alter table`;
  - it references `patient_coverages`, which doesn't exist (the table is
    `coverages`);
  - it would drop the existing `status` (FHIR `claim_status`) that the admin
    UI's `ClaimStatusBadge` reads.

  Instead, keep `status` as the FHIR status, and add the doc's `state`
  (lifecycle) and centavo columns alongside it. Add a `returned` (RTH) state,
  which the doc's enum lacks.
- Shared claim fields (ICD-10, RVS, physician PAN, amounts) go on `claims` as
  the doc says. **PhilHealth-only fields** go in a 1:1 **`philhealth_claim_details`**
  table, so HMO claims don't carry ~15 always-null columns:
  - package code, eligibility/PBEF tracking no., CSF series, triage level, core
    presentation;
  - member snapshot, eSOA/transmittal numbers.

FBE compliance notes the engine must enforce:
- Supplies and overhead fees (ER fee, patient-ID fee, etc.) are **bundled into
  the fixed fee and must not be charged separately** (§B.9–10). Zero the patient
  charge automatically, with a supervisor override (§3.1 B).
- No second case rate with FBE. The patient must be discharged within 24 h of ED
  entry. The case must not have another case rate the facility could file.
- CF4 chief complaint must include the **core presentation** (Annex A). The HPI
  must include the **triage level**. Until eSOA integrates the EECL, attach the
  **EECL Summary Form (Annex D)**.
- Patients must not pay out of pocket because of stockouts.

---

## 4. Target design (fits Loop 5 of the design doc)

### 4.1 Fix what exists first
1. **Restore claim creation.** In `issue_billing_invoice`, when the payor is
   PhilHealth or HMO, create the claim (status `draft`) linked to the billing
   event, instead of only writing off.
2. **Separate "facility type" from "payor".** New columns on
   `organizations` or `organization_settings`:
   - `facility_type` (clinic / infirmary / hospital L1–L3);
   - `ownership` (DOH-retained / LGU / other government / private);
   - `balance_billing_policy` (`none` | `nbb` | `zbb`);
   - HCI accreditation no.

   Add `accommodation_type` on inpatient encounters. Keep `default_payor_type`
   for backward compatibility, and make `resolve_billing_mode` follow the §3.1 A
   table.
3. **Fix supplemental re-billing**: `generate_billing_event` must skip usages
   and requests already on a finalized event.
4. **Write diagnoses**:
   - add `record_encounter_condition(encounter, icd10_code, rank, is_final)`,
     writing to `conditions` and validated against `icd10_reference`;
   - add an ICD-10 picker to the provider encounter screen;
   - have the MSK RPC also write a `conditions` row.

   This also unblocks disease surveillance.

### 4.2 New PhilHealth reference data (global, read-only, versioned)
All money columns are `bigint` centavos and every row carries `effective_from/to` + `circular_ref`.
- `philhealth_benefit_packages`: `OPER1`, … with payment model
  (`fixed_fee_schedule` | `case_rate` | `capitation`), allowed facility types,
  `allows_second_case_rate`.
- `philhealth_fee_schedule_items`: Annex B EECL (342 items: item no., price
  category, name, fixed fee, charging unit).
- `philhealth_core_presentations` (Annex A of PC 2025-0020), triage levels.
- Version `icd10_reference` (add effective dates + centavo columns), add
  `rvs_reference`.

### 4.3 Clinic mapping and encounter context
- `philhealth_item_mappings`: maps a clinic catalog row (clinic service / lab
  service / inventory item) to an EECL item. Lets billing staff map "Dengue
  Duo3" → `0090` once.
- `bundled_under_fbe` flag on supplies and overhead fees (auto-zeroed patient
  share, supervisor override; §3.1 B). Per-hour/per-use
  billing units on services, plus procedure tagging (IV cannulation, vital-signs
  monitoring, nebulization), because the EECL pays these individually.
- Encounter: setting (opd/er/inpatient), triage level, core presentation, ED
  entry/discharge times.
- Coverage: PhilHealth PIN, member vs dependent + member snapshot, PhilHealth
  category text, eligibility reference/result. Practitioner PhilHealth
  accreditation no.

### 4.4 Claim tables (names from the design doc, PhilHealth fields added)
- `claims` (**alter**, don't recreate; §3.1 C): keep FHIR `status`, add the
  design doc's `state` lifecycle plus a `returned` (RTH) state, centavo amounts,
  ICD-10/RVS, physician PAN.
- `philhealth_claim_details` (1:1): package, SOA no., eligibility/PBEF tracking
  no., member/patient snapshots, CSF series, triage, core presentation, filing
  deadline, eSOA/transmittal nos., PhilHealth's raw status (in process / RTH /
  denied / with voucher / with cheque).
- `claim_line_items`: per billing line — actual, discount (by type), PHIC,
  excess, all in centavos; the EECL item; the rule applied
  (`fixed_fee` | `not_covered` | `bundled_flagged`). Frozen at claim time.
- `claim_responses`, `claim_appeals` as in the design doc. Add `claim_documents`
  (SOA, itemized, CSF, CF4, Annex D, PBEF scan, eSOA XML: version + storage
  path).

### 4.5 Computation: `compute_philhealth_claim(billing_event_id)`
For each line:
1. Resolve the EECL item through `philhealth_item_mappings`, using the fee
   effective on the ED entry date.
2. Apply the statutory discount → `net` (see §6 #1 for the open ordering
   question).
3. Mapped item: `phic = fee × qty`, `excess = max(net − phic, 0)`.
   Unmapped: `phic = 0`, `excess = net`. Bundled under FBE: raise a checklist
   warning.
4. ED consultation → emergent/urgent fixed fee on the PF row, paid to the
   accredited physician (private) or the HCW pool (public). This is not subject
   to PF sharing.
5. Route the excess by `nbb_participation` + member category: patient invoice,
   or write-off / MAIFIP.
6. Totals must reproduce §2's table exactly with synthetic data.

The case-rate model (inpatient/medical) uses `icd10_reference` HF/PF splits plus
the second-case-rate rules. The capitation model (YAKAP) produces encounter
records, not per-visit claims.

### 4.6 Workflow and screens
1. **Front desk**: PIN, coverage, eligibility reference + scan. Block PhilHealth
   billing without an eligible result.
2. **Provider**: triage, core presentation, ICD-10 final diagnosis; tag
   procedures, meds and labs. The live bill shows PHIC/excess.
3. **Billing**: finalize → claim + `claim_line_items` + PF + excess invoice →
   **clean-claim checklist**:
   - PIN valid
   - eligible
   - ICD-10, triage and core presentation present
   - accreditation nos. present
   - no bundled items charged
   - ≤ 24 h ED stay
   - within the filing window
4. **Documents**:
   - SOA + Itemized as HTML → PDF on the hospital's own letterhead;
   - CSF / CF4 / Annex D overlaid on the official blanks with `pdf-lib`, in an
     Edge Function.
5. **Claims workbench**: upgrade the existing `/billing/claims` screen (status
   flow, RTH queue, deadlines, remittance). Replace the current free-form
   "Adjudicate" dialog with PhilHealth statuses.
6. **Submission**: eSOA + CF4 XML exported for the certified partner; direct
   transmission after certification.

---

## 5. Roadmap: remaining work to automate PhilHealth claims

Updated 2026-11-01. Size estimates assume one full-stack developer and are
rough (S ≈ 2–4 days, M ≈ 1–2 weeks, L ≈ 2–4 weeks).

### 5.0 Where we are

| Area | Status |
|---|---|
| Facility billing profile, NBB/ZBB/subsidy rule | ✅ Built (slice 5.0) |
| Claim drafted for zero-balance PhilHealth bills; submit/adjudicate checks | ✅ Built |
| ICD-10 diagnosis per visit (doctor panel, code after finishing) | ✅ Built |
| PhilHealth PIN/category per patient | ✅ Built |
| PHIC SOA + Itemized Charges, pre-filled CSF (print to PDF) | ✅ Built (slice 5.3, partial) |
| Real PHIC amounts (fee schedule / case rates) | ❌ PHIC column = claimed charges |
| CF1, CF2, CF4, lab-result attachments, Annex D | ❌ |
| Structured names, address, dependents' member details, doctor PAN, facility accreditation format | ✅ Built (R1.1) |
| Discharge outcome, visit setting and room, referral, triage level and core presentation | ✅ Built (R1.2, branch `feat/philhealth-r1-2-encounter-context`) |
| Claim workbench: checklist, uploads, RTH, deadlines, remittance | ❌ |
| eSOA / eClaims XML, eligibility check, transmission | ❌ |
| Claims for patients who pay (standard billing + PhilHealth share) | ❌ |

### 5.1 Order of work

```
R1 Data foundations ──┬──> R2 Fee schedule + claim engine ──┐
                      └──> R3 Claim forms (CF4 first) ──────┼──> R4 Claim workbench ──> R5 eClaims submission
                                                            │
                       R0 Business actions (start now, run in parallel) ──┘
```

R2 and R3 can run in parallel once R1 lands. R4 needs both. R5 is blocked
until PhilHealth ITMD provides the XML schemas (R0).

### R0. Business actions (start now, no code)
- Request the **eClaims 3.0 / eSOA / CF4 XML schemas** and the software
  certification procedure from PhilHealth ITMD or the Regional Office IT
  section.
- Pick a **PhilHealth-certified service provider** to transmit through until
  we are certified (see the certified service providers page).
- Confirm three billing-office rules with the pilot hospital:
  1. Are senior/PWD discounts applied before or after PhilHealth?
  2. Are injection and IV-medication fees separate services or bundled
     overhead under the emergency package?
  3. Which benefits does the pilot file: emergency (FBE), medical case
     rates, maternity (CF3), YAKAP?
- Get the **official annexes** as data: EECL fee schedule (PC 2025-0020
  Annex B), current Annex A medical case rates (after the 2025 increase), and
  the RVS list.
- Rotate the hosted database password (it was shared in chat).

### R1. Data foundations — size M
Every form below needs these fields, and PhilHealth returns claims whose
forms disagree with each other or with the member record.

| Gap | Change | Who enters it | Used by |
|---|---|---|---|
| Structured patient name | Store `family`, `given`, `middle`, `suffix` in the FHIR `name` (keep `text`); split fields on registration and profile forms | Front desk / patient | CSF, CF1, CF2, CF4 ("LAST, FIRST, MIDDLE") |
| Structured address | `line`, `barangay`, `municipality`, `province`, `zip` in `address` (keys surveillance already reads) | Front desk / patient | CF1, SOA |
| Member details for dependents | Member name, birth date, sex and PIN when the patient isn't the member | Front desk (PhilHealth dialog) | CSF, CF1 |
| Doctor PhilHealth accreditation (PAN, `1234-1234567-1`) and PRC license | Stored in `practitioners.identifier`. **Doctors enter their own** on their Profile page (provider and admin apps), with no verification step. The page shows warnings (must match the certificate; a wrong PAN gets claims returned or PF paid to the wrong accreditation; the doctor is responsible; changes don't alter submitted claims) and asks for confirmation before saving. Admins can still correct it from Staff accounts. Every change is in the audit log | Doctor (self-service); admin for corrections | CSF Part IV, CF2, CF4 Part VII |
| Facility accreditation format | Validate `H########` / ASC / MCP formats | Admin | All forms |
| Encounter setting and accommodation | Check-in dialog for `encounter_setting` (OPD / ER / inpatient) and `accommodation_type` (ward / private, inpatient only). Check-in now opens the encounter, so the ED entry time is the check-in time | Front desk at check-in | NBB/ZBB rule, CF2 |
| Admission and discharge **time** | Already stored as timestamps; just shown on forms | — | CF2, CF4 |
| Discharge outcome | Asked in the Complete encounter dialog: improved, recovered, transferred (with receiving facility), home against advice, absconded, expired. Can be corrected on the finished chart until the claim is submitted | Doctor | CF2, CF4 Part VI |
| Referral | Referring facility and reason at check-in; receiving facility and reason when the doctor records a transfer | Front desk (from) / doctor (to) | CF2, CF4 Part III |
| Emergency triage level and core presentation | Level 1–5 (resuscitation, emergent, urgent, less urgent, non-urgent) and the 27 PC 2025-0020 Annex A core presentations (`philhealth_core_presentations`) | Nurse at triage | FBE claims, CF4, Annex D |

Acceptance:
- The CSF prints split names, the member section for dependents, and the
  doctor's PAN.
- Registration, triage and finish-visit screens enforce the new fields only
  when the patient has PhilHealth coverage, so other visits aren't slowed down.
- Database tests cover formats and the "required only for PhilHealth" rule.

### R2. Fee schedule and claim engine (old slices 5.1 + 5.2) — size L
1. **Reference tables** (global, versioned by effective date, centavos):
   - `philhealth_benefit_packages`
   - `philhealth_fee_schedule_items` (EECL, 342 items)
   - versioned `icd10_reference` with the current Annex A rates
   - `rvs_reference`

   Each has a superadmin import screen with a dry-run diff before applying.
2. **Item mapping:** `philhealth_item_mappings` links each clinic
   service/lab/inventory item to an EECL item. It comes with a mapping screen
   and a "not mapped" warning list.
3. **Procedure tagging:** bill per-use and per-hour procedures (IV
   cannulation, vital-signs monitoring, nebulization) like inventory.
4. **`claim_line_items` + `philhealth_claim_details`**, built by
   `compute_philhealth_claim`:
   - fixed fee per EECL item, or case rate hospital fee / professional fee
     split
   - statutory discounts (order per R0)
   - bundled supplies and overhead auto-zeroed under FBE, with a supervisor
     override
   - excess routed to the patient or to a fund (MAIFIP etc.)
5. **Claims for paying patients:** standard-billing visits of PhilHealth
   members get a claim too, and the patient's invoice becomes charges minus
   the PHIC share. This removes today's "only zero-balance visits are claimed"
   limit.
6. The SOA and CSF switch `phic_basis` to `fee_schedule` automatically.

Acceptance:
- A synthetic copy of the Meraluna visit reproduces 3,169 / 6,409 / 886 /
  260 / 6,669 exactly.
- A paying patient's invoice equals the excess.
- No line changes after submission.

### R3. Claim forms and attachments — size L (CF4 first)
All forms are generated from one data function per form, printable to PDF
now and reusable for XML in R5. Same pattern as the SOA/CSF.

| Form | Data sources | Notes |
|---|---|---|
| **CF4** (mandatory for all case rates) | Facility + patient (R1); chief complaint and vitals from triage; history, physical exam and course in the ward from SOAP notes; drugs and medicines from prescriptions + tagged inventory (quantity, dose, route, **cost**); lab results from diagnostic reports; outcome (R1); doctor's certification | PC 2019-0002 exemptions: ANC, NSD, MCP, newborn care, TB-DOTS, animal bite, Z benefits and similar. FBE: chief complaint must include the core presentation, history of present illness must include the triage level |
| **Lab and imaging result printouts** | `diagnostic_reports` + `observations` | Attached with CF4 |
| **CF1** | Patient, member, employer (optional) | Mostly data from R1 |
| **CF2** | Facility, confinement dates and times, outcome, referral, diagnoses, case rates, professional fees with PAN | Needs R1 and the R2 case-rate split |
| **Annex D** (EECL summary) | EECL lines from R2, core presentation, triage level | FBE claims only |
| **CF3** | Delivery data | Only if the pilot does maternity (R0) |

Acceptance:
- Each form matches the official field list.
- Unit tests for every builder, as for the SOA/CSF.
- A completeness check flags any blank required item before printing.

### R4. Claim workbench — size L
Turn the claims list into a working queue in `apps/admin-web`:
1. **Claim detail page:** patient, visit, lines, documents, attachments,
   status history, all in one place.
2. **Clean-claim checklist:** every rule in one list, with links to fix each
   item:
   - PIN, eligibility reference, final ICD-10
   - doctor PAN, outcome, names/address
   - CF4 complete, bundled charges, 60-day window, forms consistent
3. **Uploads:** signed CSF scan, PBEF scan, other attachments, kept in a
   private Supabase Storage bucket. A `claim_documents` table records each
   generated version and upload.
4. **PhilHealth statuses:** in process, returned to hospital (RTH) with
   reason, resubmitted, denied, with voucher, with cheque, paid.
5. **Deadlines:** 60 days from discharge, with a countdown on each claim and
   a dashboard of claims nearing the deadline.
6. **Remittance:** record PhilHealth payments (voucher/cheque no., date,
   amount) and match them to claims; any shortfall goes to patient re-billing
   or write-off by policy.
7. **Reports:** receivables aging, RTH rate and reasons, average days to
   payment.
8. **Roles:** a "PhilHealth claims officer" role preset (`can_view_claims`,
   `can_manage_claims`, `can_manage_billing`). Rename "HMO Claims" to
   "Claims" with PhilHealth/HMO filters.

Acceptance: a Playwright end-to-end test covers registration → triage →
doctor → finish → claim → checklist green → submit → remittance → paid.

### R5. Electronic submission — size L, blocked by R0 schemas
1. XML generators for the eSOA and the CF1/CF2/CF4 modules, validated
   against the ITMD XSDs in tests.
2. **Phase A:** export a claim packet (XML + PDFs + scans) for upload by the
   certified partner.
3. **Phase B, after certification:** a Supabase Edge Function calls
   PhilHealth's web services, with credentials kept in Vault:
   - eligibility check, whose tracking number replaces the PBEF
   - claim transmission
   - claim status inquiry, feeding R4 statuses automatically
4. A transmission log with idempotency keys, so no claim is sent twice.

Acceptance: XML validates against the official schemas, and PhilHealth's
certification test cases pass.

### R6. Rollout (alongside each phase)
- Each phase ships as migrations + database tests + client + UI, pushed to
  the hosted project with `pnpm supabase db push` after review.
- Pilot dry run: file one consented real case side by side with the
  hospital's current system, and compare every form field.
- Short training guides for front desk, nurses, doctors and the claims
  officer.

### R7. Later or optional
- YAKAP for clinic customers: empanelment, capitation, certified-EMR
  requirements.
- HMO claims with letters of authorization and co-pays (design doc Loop 3).
- Inpatient case-rate details: room and board, operating room, second case
  rate rules.

### 5.2 Suggested timeline (one developer)

| Weeks | Work |
|---|---|
| 1–2 | R1 data foundations (R0 runs in parallel) |
| 3–6 | R2 engine and R3 CF4 + lab printouts in parallel; then CF1/CF2/Annex D |
| 7–9 | R4 workbench |
| 10+ | R5 Phase A (when schemas arrive), then Phase B after certification |

## 6. Corrections needed in the existing design docs
1. **Discount vs PhilHealth order.** Design doc §6.4 says PhilHealth is
   deducted first and senior/PWD discounts second. A 2025 PhilHealth advisory
   (2025-0017, reported by secondary sources) says mandatory discounts are
   computed **before** PhilHealth. PC 2025-0020 defers to JAO 2020-0001.
   **Verify with the hospital's billing office before coding**, because it changes
   the excess amount.
2. **NBB flow (§3.c)** sets `payor_responsibility = line_total`. Under FBE,
   PhilHealth pays the fixed fee, not the charge, and non-EECL items are not
   covered.
3. **"Konsulta"** has been renamed **YAKAP**. eKonsulta ends 31 Dec 2026, and
   YAKAP clinics need a PhilHealth-certified EMR.
4. **"Accredited HITP"** has been replaced by **software certification**, with
   per-version recertification (eClaims 3.0).
5. The FBE fixed-fee payment model is missing. Only case rates are described.
6. **Claims DDL (§4.4)** recreates `claims` and references `patient_coverages`.
   Both conflict with the live schema (§3.1 C).
7. **NBB flow (§3.c)** treats NBB as facility-wide. It must follow the
   NBB/ZBB × accommodation × patient-category rule (§3.1 A).

## 7. Business actions outside the code
- Ask PhilHealth ITMD / the Regional Office IT section for the eClaims 3.0,
  eSOA, CF4 (and YAKAP) XML templates and the certification procedure.
- Choose a certified service provider to transmit through in the meantime.
- Confirm the discount order (§6 #1) with the pilot hospital's billing office.

## Sources
- [PC 2025-0020 — FBE/OECB Rev. 1](https://www.philhealth.gov.ph/circulars/2025/PC2025-0020.pdf)
- [EECL fixed fee schedule (Annex A, Advisory 2025-0009)](https://www.philhealth.gov.ph/circulars/2024/0033/AnnexA_EECL.pdf)
- [Advisory 2025-0073 — ED consultation fees](https://www.philhealth.gov.ph/advisories/2025/PA2025-0073.pdf)
- [Advisory 2026-0022 — eClaims 3.0, XML-only SOA](https://www.philhealth.gov.ph/advisories/2026/PA2026-0022.pdf)
- [Advisory 2026-0040 — older eClaims decommissioned](https://www.philhealth.gov.ph/advisories/2026/PA2026-0040.pdf)
- [Advisory 2026-0010 — certified IT provider, ITMD XML templates](https://www.philhealth.gov.ph/advisories/2026/PA2026-0010.pdf)
- [Advisory 2026-0038 — YAKAP certified EMR, eKonsulta until 31 Dec 2026](https://www.philhealth.gov.ph/advisories/2026/PA2026-0038.pdf)
- [Advisory 2026-0023 — YAKAP physical clinics, telemedicine limits](https://www.philhealth.gov.ph/advisories/2026/PA2026-0023.pdf)
- [PhilHealth certified service providers](https://www.philhealth.gov.ph/partners/csp/)
- [PC 2017-0030 — eClaims hybrid approach, software certification](https://www.philhealth.gov.ph/circulars/2017/circ2017-0030.pdf)
- [PC 2017-0014 — SOA minimum requirements](https://www.philhealth.gov.ph/circulars/2017/circ2017-0014.pdf)
- [PC 2017-0006 — No Balance Billing policy (Rev. 1)](https://www.philhealth.gov.ph/circulars/2017/circ2017-0006.pdf)
- [Philstar — zero balance billing explainer (Aug 2025)](https://www.philstar.com/headlines/2025/08/02/2462356/confused-about-zero-balance-billing-policy-heres-explainer)
- [PIA — ZBB covers all PhilHealth members](https://pia.gov.ph/news/zero-balance-billing-now-covers-all-philhealth-members/)
- [GMA — DOH hospitals offering ZBB](https://www.gmanetwork.com/news/topstories/nation/954190/only-87-doh-hospitals-nationwide-can-accommodate-zero-balance-billing/story/)
- [Respicio — PhilHealth billing complaints and sanctions (secondary)](https://www.respicio.ph/commentaries/philhealth-billing-complaint-and-reimbursement-process)
- [Inquirer — NBB coverage categories](https://newsinfo.inquirer.net/2088590/patients-free-of-charge-at-doh-hospitals-under-zero-balance-billing)
- [Tribune — private hospitals joining NBB (Oct 2026)](https://tribune.net.ph/2026/10/28/17-private-hospitals-in-central-luzon-join-philhealths-no-balance-billing-program)
