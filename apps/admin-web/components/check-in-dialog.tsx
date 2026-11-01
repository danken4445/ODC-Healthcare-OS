"use client";

import { checkInAppointment } from "@odyssey/supabase-client";
import {
  ACCOMMODATION_TYPE_LABELS,
  ENCOUNTER_SETTING_LABELS,
  type AccommodationType,
  type EncounterSetting,
} from "@odyssey/types";
import { FormEvent, useState } from "react";
import { useAdminData } from "./admin-data-context";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";

function Field({ children, label, span = false }: { children: React.ReactNode; label: string; span?: boolean }) {
  return <label className={`field-label${span ? " field-span" : ""}`}>{label}{children}</label>;
}

/**
 * Check-in with the visit context PhilHealth claims print on CF2: setting,
 * inpatient room type and referring facility. Required only for PhilHealth
 * patients; the database says so if it is missing.
 */
export function CheckInAction({ appointmentId, disabled, onCheckedIn }: { appointmentId: string; disabled?: boolean; onCheckedIn: () => void }) {
  const { client, organization } = useAdminData();
  const [open, setOpen] = useState(false);
  const [setting, setSetting] = useState<EncounterSetting | "">("");
  const [accommodation, setAccommodation] = useState<AccommodationType | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setSetting("");
    setAccommodation("");
    setError(null);
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const result = await checkInAppointment(client, appointmentId, {
      encounterSetting: setting || null,
      accommodationType: setting === "inpatient" ? accommodation || null : null,
      referredFromFacility: String(form.get("referredFrom") ?? "").trim() || null,
      referredFromReason: String(form.get("referralReason") ?? "").trim() || null,
    }, organization?.id);
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setOpen(false);
    onCheckedIn();
  }

  return <>
    <Button size="sm" disabled={disabled} onClick={openDialog}>Check in</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Check in" description="The visit setting and referral are printed on PhilHealth claim forms. They're required for PhilHealth patients and optional for everyone else.">
      <form className="dialog-body" onSubmit={save}>
        <div className="form-grid">
          <Field label="Visit setting">
            <select className="ui-input" value={setting} onChange={(event) => setSetting(event.target.value as EncounterSetting | "")}>
              <option value="">Not specified</option>
              {(Object.keys(ENCOUNTER_SETTING_LABELS) as EncounterSetting[]).map((code) => <option key={code} value={code}>{ENCOUNTER_SETTING_LABELS[code]}</option>)}
            </select>
          </Field>
          {setting === "inpatient" ? (
            <Field label="Room type">
              <select className="ui-input" value={accommodation} onChange={(event) => setAccommodation(event.target.value as AccommodationType | "")} required>
                <option value="">Choose…</option>
                {(Object.keys(ACCOMMODATION_TYPE_LABELS) as AccommodationType[]).map((code) => <option key={code} value={code}>{ACCOMMODATION_TYPE_LABELS[code]}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="Referred from (facility)"><Input name="referredFrom" maxLength={200} placeholder="Optional" /></Field>
          <Field label="Reason for referral" span><Input name="referralReason" maxLength={1000} placeholder="Optional" /></Field>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Checking in…" : "Check in"}</Button></div>
      </form>
    </Dialog>
  </>;
}
