# Manual test: PhilHealth claims (slice 5.0)

A realistic end-to-end run at a government facility, using **synthetic data
only**. Never enter a real patient's name, PIN or birth date.

**Before you start**
- The five `20261031…` migrations must be on the Supabase project the apps
  point at. Without them, the new screens show "function not found".
- Admin app: http://localhost:3003 · Provider app: http://localhost:3004
- You need four staff logins at the same clinic: **Admin**, **Front desk**,
  **Nurse**, **Doctor**. The doctor must be the one the appointments are
  booked with.

## Who does what

| Step | Role | Permission it needs |
|---|---|---|
| Set the facility billing profile | Admin / Owner | admin or owner role |
| Register the patient, record PhilHealth PIN and category | Front desk (or Admin) | `can_manage_patients` + `can_manage_billing` |
| Book and check in | Front desk | `can_manage_appointments` |
| Triage and vital signs | Nurse | `can_record_triage` |
| Consultation, lab order, item tagging, ICD-10 diagnosis | Doctor (assigned or covering) | `can_start_consultation` |
| See claims | Front desk, Admin, Owner | `can_view_claims` |
| **Submit and adjudicate PhilHealth claims** | **Admin, Owner** | `can_manage_claims` |

Today **only Admin and Owner can submit claims**. To give the job to a
dedicated PhilHealth/billing officer, create a custom role in **Roles** with
`can_view_claims`, `can_manage_claims` and `can_manage_billing`.

## The scenario

Your facility is a municipal (LGU) hospital that waives patient charges. Two
synthetic PhilHealth members visit on the same morning:

- **Maria Test Santos**, a sponsored member with burning urination and fever.
  The doctor orders a urinalysis, uses an IV cannula, and diagnoses a urinary
  tract infection (ICD-10 **N39.0**). The officer files the claim, and
  PhilHealth partly approves it.
- **Jose Test Reyes**, an indigent member with a cough. The doctor finishes the
  visit **without coding a diagnosis**. The officer's submission is refused,
  the doctor codes the visit afterwards, and the claim then goes through.

| Synthetic data | Maria | Jose |
|---|---|---|
| Sex, birth date | Female, 1976-07-11 | Male, 1990-02-14 |
| PhilHealth PIN | `12-345678901-2` | `12-345678902-0` |
| Member category | Sponsored | Indigent |
| Eligibility reference | `PBEF-TEST-0001` | `PBEF-TEST-0002` |

Facility HCI accreditation no.: `H00000001`.

---

### Part A: Facility setup (Admin)
1. Go to **Facility Mode** (`/settings/facility`).
2. In **PhilHealth billing profile**, set:
   - Facility type: **Hospital (Level 1)**
   - Ownership: **Local government (LGU)**
   - Policy: **Facility-wide subsidy (legacy)**
   - Accreditation: **H00000001**
3. Click **Save billing profile**.
   - ✅ "Billing profile saved" appears, and the help text explains the policy.
4. **Negative check:** change Ownership to **Private**.
   - ✅ The policy resets to **None**, and a message next to Save explains why.
   - ✅ In the policy list, **DOH Zero Balance Billing** and **Facility-wide
     subsidy** are greyed out. Zero Balance Billing is selectable only with
     **DOH-retained** ownership.
   - ✅ The banner at the top of the page matches what you save. Saving
     Facility-wide subsidy shows the Government No-Billing banner.
   - Set the profile back to step 2's values and save.

### Part B: Registration and PhilHealth coverage (Front desk)
5. **Register walk-in**: create Maria and Jose.
6. Go to **Outpatients**, find Maria, and click **PhilHealth**.
7. **Negative check:** enter PIN `1234` and save.
   - ✅ Error: "A PhilHealth Identification Number has 12 digits."
8. Enter PIN `123456789012`, category **Sponsored**, relationship **Member
   (self)**, reference `PBEF-TEST-0001`, and save.
   - ✅ The button now reads "PhilHealth saved".
9. Do the same for Jose: PIN `123456789020`, category **Indigent**, reference
   `PBEF-TEST-0002`.

> Record the PhilHealth details **before** the visit. The ₱0 rule and the
> claim are decided when the bill is created.

### Part C: Booking and check-in (Front desk)
10. **Booking / Appointments**: book Maria and Jose with the doctor in free
    slots.
    - ✅ Both confirm right away, with no payment step, because the facility
      waives charges.
11. Click **Check in** on both appointments.

### Part D: Triage (Nurse, provider app)
12. Record vital signs and triage for both. For example, Maria has a
    temperature of 38.5 °C.
    - ✅ Both move to the doctor's queue.

### Part E: Maria's consultation, coded properly (Doctor)
13. Start Maria's consultation from **My queue today**.
14. Write a short SOAP note.
15. **Laboratory order**: urinalysis (or any lab service).
16. **Item tagging**: an IV cannula or syringe, quantity 1.
17. In **Diagnosis (ICD-10)**, type `urinary` and pick **N39.0 – Urinary tract
    infection**.
    - ✅ It shows with a **Final** badge.
18. Add **R50.9 – Fever, unspecified**.
    - ✅ It shows as **Secondary**.
19. Type `XYZ`.
    - ✅ No results, so nothing can be added.
20. Click **Make final** on R50.9, then **Make final** on N39.0.
    - ✅ Only one diagnosis is Final at any time.
    - End with **N39.0 as Final**.
21. **Remove** R50.9.
    - ✅ It disappears.
22. Click **Finish encounter**.

### Part F: Jose's consultation, not coded (Doctor)
23. Start Jose's consultation, write a short note, and click **Finish
    encounter** **without** adding a diagnosis.

### Part G: Bills and claims (Admin)
24. **Billing**: Maria's and Jose's invoices show **₱0 due / Paid**, while the
    line items keep their standard prices.
25. **HMO Claims** (`/billing/claims`): there is one new claim per patient, and
    the status is "Active", meaning a draft.
    - ✅ Maria's amount equals her full charges (consultation + lab + item).
    - ✅ **Final diagnosis** shows **N39.0** for Maria and **"Missing — doctor
      must code"** for Jose.
26. Click **Submit claim** on **Jose's** claim.
    - ✅ Error: "Claim is not ready to submit: record a confirmed final ICD-10
      diagnosis (rank 1)."
26a. **(Doctor, provider app)** In **My queue today**, Jose's finished visit now
     has an **Open chart** button. Open it, and in **Diagnosis (ICD-10)** pick
     **J06.9 – Acute upper respiratory infection**.
     - ✅ It shows as **Final**.
26b. **(Admin)** Refresh **HMO Claims**.
     - ✅ Jose's Final diagnosis now shows **J06.9**.
     - ✅ **Submit claim** now succeeds.
27. Click **Submit claim** on **Maria's** claim.
    - ✅ The status changes to "Submitted".
28. Click **Adjudicate** on Maria's claim and try each decision:
    - Decision **Denied** with no reason.
      - ✅ Error: "A denial reason is required."
    - Decision **Partially approved** with an amount equal to the full claim.
      - ✅ Error: amount must be below the claimed amount.
    - Decision **Partially approved** with about half the amount, reason
      "PhilHealth paid case rate only".
      - ✅ Saved. The status shows "Partial" with the approved amount.
29. Look at Maria's claim again.
    - ✅ The Adjudicate button is gone.
29a. **(Doctor)** Open Maria's finished chart from the queue and try to add or
     remove a diagnosis.
     - ✅ Error: "…claim has been submitted; its diagnoses are locked."

### Part G2: Claim documents (Admin)
29b. On Maria's claim in **HMO Claims**, click **SOA**.
     - ✅ A new tab opens with two A4 pages. Allow pop-ups for localhost if
       asked.
     - ✅ Page 1, **PHIC Statement of Account**, has:
       - your facility name and accreditation no. as the letterhead;
       - Maria's details, PIN, category, N39.0, and the attending doctor;
       - the Actual / Discount / PHIC / Excess grid by category, with
         professional fees, totals, and N39.0 as the first case rate.
     - ✅ Page 2, **Itemized Charges**, lists each charge with its service
       date, item code, unit, PHIC, quantity and Excess, plus the signature
       blocks.
     - **Print / Save as PDF** produces a clean A4 PDF.
29c. Click **CSF**.
     - ✅ The pre-filled Claim Signature Form shows Maria's PIN in the 12 boxes,
       her name and birth date, the visit dates, the attending doctor in
       Part IV, and N39.0 in Part V.
     - Signatures, thumbmarks and employer details stay blank on purpose.
29d. **Negative check:** sign in as a role without claims access (for example
     the Doctor) and confirm the claims page and its documents aren't
     available.

### Part H: Private facility comparison (Admin + staff)
30. Set the billing profile to **Private / None**, or use the "Private
    hospital" toggle.
31. Book and complete another visit for Maria.
    - ✅ The appointment now waits for full payment.
    - ✅ The invoice shows the full balance due.
    - ✅ No new PhilHealth claim appears. Claims for paying patients come in
      slice 5.2.
32. Set the facility back to your normal configuration.

---

## Not testable from the screens yet
These are all covered by the database test
(`supabase/tests/philhealth_claims_5_0_test.sql`):
- **No Balance Billing for ward admissions, and DOH Zero Balance Billing.**
  They need the encounter marked *inpatient, ward*, and no screen sets that yet.
- **Follow-up bills not re-charging items.** Orders are hidden after a visit is
  finished.

The **"HMO claim" billing route** still creates no claim; that's Loop 3.

## Reporting issues
For each failed ✅, note:
- the step number
- the logged-in role
- what you saw (a screenshot helps)
- any red error text

Then paste it back here.
