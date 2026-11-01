"use client";

import {
  getPatientPhilhealthProfile,
  getPractitionerPhilhealthAccreditation,
  savePatientPhilhealthCoverage,
  savePatientPhilhealthIdentity,
  setPractitionerPhilhealthAccreditation,
} from "@odyssey/supabase-client";
import type {
  PatientPhilhealthProfile,
  PhilhealthMemberCategory,
  PhilhealthRelationship,
} from "@odyssey/types";
import { FormEvent, useState } from "react";
import { useAdminData } from "./admin-data-context";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";

function Field({ children, label, span = false }: { children: React.ReactNode; label: string; span?: boolean }) {
  return <label className={`field-label${span ? " field-span" : ""}`}>{label}{children}</label>;
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ui-input" {...props}>{children}</select>;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || null;

/** Doctor's PhilHealth accreditation number (PAN) and PRC license, printed on the CSF, CF2 and CF4. */
export function PractitionerPanAction({ userId }: { userId: string }) {
  const { client, organization } = useAdminData();
  const [open, setOpen] = useState(false);
  const [pan, setPan] = useState("");
  const [prc, setPrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  async function openDialog() {
    if (!organization) return;
    setOpen(true);
    setError(null);
    setLoading(true);
    const result = await getPractitionerPhilhealthAccreditation(client, organization.id, userId);
    setLoading(false);
    if (result.error) return setError(result.error.message);
    setPan(result.data?.pan ?? "");
    setPrc(result.data?.prcLicense ?? "");
    setCurrent(result.data?.pan ?? null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError(null);
    const result = await setPractitionerPhilhealthAccreditation(client, organization.id, userId, pan, prc.trim() || null);
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setCurrent(pan);
    setOpen(false);
  }

  return <>
    <Button size="sm" variant="outline" onClick={() => void openDialog()}>{current ? "PhilHealth PAN ✓" : "PhilHealth PAN"}</Button>
    <Dialog open={open} onOpenChange={setOpen} title="PhilHealth accreditation" description="The doctor's PhilHealth accreditation number is printed on claim forms. A claim can't be submitted without it.">
      {loading ? <p className="dialog-body" aria-live="polite">Loading…</p> : (
        <form className="dialog-body" onSubmit={save}>
          <div className="form-grid">
            <Field label="PhilHealth accreditation no. (PAN)"><Input value={pan} onChange={(event) => setPan(event.target.value)} inputMode="numeric" placeholder="1234-1234567-1" required /></Field>
            <Field label="PRC license no."><Input value={prc} onChange={(event) => setPrc(event.target.value)} inputMode="numeric" placeholder="Optional" /></Field>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save accreditation"}</Button></div>
        </form>
      )}
    </Dialog>
  </>;
}

/**
 * Billing staff record everything PhilHealth claim forms print about a patient:
 * legal name (LAST, FIRST, MIDDLE), sex, birth date and mailing address, the
 * PIN and member category, and the member's details when the patient is a
 * dependent.
 */
export function PhilhealthDetailsAction({ patientId }: { patientId: string }) {
  const { client, isSuperadmin, organization, permissions } = useAdminData();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<PatientPhilhealthProfile | null>(null);
  const [relationship, setRelationship] = useState<PhilhealthRelationship>("self");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  if (!isSuperadmin && !permissions.includes("can_manage_billing") && !permissions.includes("can_manage_claims")) return null;

  async function openDialog() {
    if (!organization) return;
    setSaved(false);
    setError(null);
    setProfile(null);
    setOpen(true);
    setLoading(true);
    const result = await getPatientPhilhealthProfile(client, organization.id, patientId);
    setLoading(false);
    if (result.error) return setError(result.error.message);
    setProfile(result.data);
    setRelationship(result.data.coverage?.relationship ?? "self");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const identity = await savePatientPhilhealthIdentity(client, organization.id, patientId, {
      familyName: text(form, "family"),
      givenName: text(form, "given"),
      middleName: optional(form, "middle"),
      suffix: optional(form, "suffix"),
      sex: text(form, "sex") as "male" | "female",
      birthDate: text(form, "birthDate"),
      street: optional(form, "street"),
      barangay: text(form, "barangay"),
      city: text(form, "city"),
      province: text(form, "province"),
      postalCode: optional(form, "postalCode"),
    });
    if (identity.error) {
      setSaving(false);
      return setError(identity.error.message);
    }
    const coverage = await savePatientPhilhealthCoverage(client, {
      organizationId: organization.id,
      patientId,
      philhealthId: text(form, "pin"),
      category: text(form, "category") as PhilhealthMemberCategory,
      relationship,
      eligibilityReference: optional(form, "reference"),
      member:
        relationship === "self"
          ? null
          : {
              pin: text(form, "memberPin"),
              familyName: text(form, "memberFamily"),
              givenName: text(form, "memberGiven"),
              middleName: optional(form, "memberMiddle"),
              suffix: optional(form, "memberSuffix"),
              birthDate: text(form, "memberBirthDate"),
              sex: text(form, "memberSex") as "male" | "female",
            },
    });
    setSaving(false);
    if (coverage.error) return setError(coverage.error.message);
    setSaved(true);
    setOpen(false);
  }

  const identity = profile?.identity ?? {};
  const coverage = profile?.coverage;
  const member = coverage?.member ?? {};

  return <>
    <Button size="sm" variant="outline" onClick={() => void openDialog()}>{saved ? "PhilHealth saved" : "PhilHealth"}</Button>
    <Dialog open={open} onOpenChange={setOpen} title="PhilHealth details" description="Everything PhilHealth claim forms print about this patient. Enter names exactly as on the PhilHealth Member Data Record.">
      {loading ? <p className="dialog-body" aria-live="polite">Loading PhilHealth details…</p> : null}
      {!loading && profile ? (
        <form className="dialog-body" onSubmit={save}>
          <fieldset className="form-grid philhealth-details-section">
            <legend>Patient</legend>
            <Field label="Last name"><Input name="family" defaultValue={identity.familyName ?? ""} required autoComplete="off" /></Field>
            <Field label="First name"><Input name="given" defaultValue={identity.givenName ?? ""} required autoComplete="off" /></Field>
            <Field label="Middle name"><Input name="middle" defaultValue={identity.middleName ?? ""} autoComplete="off" /></Field>
            <Field label="Suffix (Jr., Sr., III)"><Input name="suffix" defaultValue={identity.suffix ?? ""} autoComplete="off" /></Field>
            <Field label="Sex"><Select name="sex" defaultValue={identity.sex ?? ""} required><option value="" disabled>Select</option><option value="female">Female</option><option value="male">Male</option></Select></Field>
            <Field label="Birth date"><Input name="birthDate" type="date" defaultValue={identity.birthDate ?? ""} required /></Field>
            <Field label="House no. / street" span><Input name="street" defaultValue={identity.street ?? ""} /></Field>
            <Field label="Barangay"><Input name="barangay" defaultValue={identity.barangay ?? ""} required /></Field>
            <Field label="City / municipality"><Input name="city" defaultValue={identity.city ?? ""} required /></Field>
            <Field label="Province"><Input name="province" defaultValue={identity.province ?? ""} required /></Field>
            <Field label="ZIP code"><Input name="postalCode" inputMode="numeric" defaultValue={identity.postalCode ?? ""} maxLength={4} /></Field>
          </fieldset>

          <fieldset className="form-grid philhealth-details-section">
            <legend>PhilHealth coverage</legend>
            <Field label="Patient's PhilHealth PIN (12 digits)"><Input name="pin" inputMode="numeric" placeholder="12-345678901-2" defaultValue={coverage?.pin ?? ""} required /></Field>
            <Field label="Member category"><Select name="category" defaultValue={coverage?.category ?? "employed"}><option value="employed">Employed</option><option value="voluntary">Voluntary / self-earning</option><option value="indigent">Indigent</option><option value="sponsored">Sponsored</option><option value="kasambahay">Kasambahay</option><option value="senior">Senior citizen</option><option value="lifetime">Lifetime</option></Select></Field>
            <Field label="Patient is the member's"><Select name="relationship" value={relationship} onChange={(event) => setRelationship(event.target.value as PhilhealthRelationship)}><option value="self">Member (self)</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="parent">Parent</option></Select></Field>
            <Field label="Eligibility reference (PBEF / tracking no.)"><Input name="reference" placeholder="Optional" defaultValue={coverage?.eligibilityReference ?? ""} /></Field>
          </fieldset>

          {relationship !== "self" ? (
            <fieldset className="form-grid philhealth-details-section">
              <legend>Member (the patient is a dependent)</legend>
              <Field label="Member's PIN (12 digits)"><Input name="memberPin" inputMode="numeric" defaultValue={member.pin ?? ""} required /></Field>
              <Field label="Member's last name"><Input name="memberFamily" defaultValue={member.familyName ?? ""} required /></Field>
              <Field label="Member's first name"><Input name="memberGiven" defaultValue={member.givenName ?? ""} required /></Field>
              <Field label="Member's middle name"><Input name="memberMiddle" defaultValue={member.middleName ?? ""} /></Field>
              <Field label="Member's suffix"><Input name="memberSuffix" defaultValue={member.suffix ?? ""} /></Field>
              <Field label="Member's birth date"><Input name="memberBirthDate" type="date" defaultValue={member.birthDate ?? ""} required /></Field>
              <Field label="Member's sex"><Select name="memberSex" defaultValue={member.sex ?? ""} required><option value="" disabled>Select</option><option value="female">Female</option><option value="male">Male</option></Select></Field>
            </fieldset>
          ) : null}

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save PhilHealth details"}</Button></div>
        </form>
      ) : null}
      {!loading && !profile && error ? <p className="form-error dialog-body" role="alert">{error}</p> : null}
    </Dialog>
  </>;
}
