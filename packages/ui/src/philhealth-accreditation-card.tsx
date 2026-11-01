"use client";

import {
  getMyPhilhealthAccreditation,
  setMyPhilhealthAccreditation,
} from "@odyssey/supabase-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odyssey/types";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button, Field, Input } from "./index";

/** Formats 12 digits as the professional PAN layout 1234-1234567-1; partial input is left as typed. */
export function formatProfessionalPan(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 12) return value.trim();
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}-${digits.slice(11)}`;
}

interface PhilhealthAccreditationCardProps {
  client: SupabaseClient<Database>;
  organizationId: string;
}

/**
 * Lets a doctor or specialist record their own PhilHealth accreditation number
 * (PAN) and PRC license on their Profile page. There is no verification step,
 * so the card states who is responsible and asks for confirmation before saving.
 * Renders nothing for users who aren't doctors or specialists at the clinic.
 */
export function PhilhealthAccreditationCard({ client, organizationId }: PhilhealthAccreditationCardProps) {
  const [loading, setLoading] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);
  const [savedPan, setSavedPan] = useState<string | null>(null);
  const [pan, setPan] = useState("");
  const [prc, setPrc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    let active = true;
    void getMyPhilhealthAccreditation(client, organizationId).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.error) return setError(result.error.message);
      setIsDoctor(result.data !== null);
      setSavedPan(result.data?.pan ?? null);
      setPan(result.data?.pan ?? "");
      setPrc(result.data?.prcLicense ?? "");
    });
    return () => {
      active = false;
    };
  }, [client, organizationId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirming && !dialog.open) dialog.showModal();
    if (!confirming && dialog.open) dialog.close();
  }, [confirming]);

  if (loading || !isDoctor) return null;

  const digits = pan.replace(/\D/g, "");
  const formatted = formatProfessionalPan(pan);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (digits.length !== 12) {
      setError("A PhilHealth accreditation number for a professional has 12 digits (1234-1234567-1).");
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function confirmSave() {
    setSaving(true);
    const result = await setMyPhilhealthAccreditation(client, organizationId, pan, prc.trim() || null);
    setSaving(false);
    setConfirming(false);
    if (result.error) return setError(result.error.message);
    setSavedPan(result.data?.pan ?? formatted);
    setPan(result.data?.pan ?? formatted);
    setMessage("PhilHealth accreditation saved. New claims will use it.");
  }

  return (
    <section className="philhealth-accreditation-card" aria-labelledby="philhealth-accreditation-heading">
      <h3 id="philhealth-accreditation-heading">PhilHealth accreditation</h3>
      <p className="philhealth-accreditation-card__status">
        {savedPan ? <>Current PAN: <strong>{savedPan}</strong></> : "No PAN recorded yet. PhilHealth claims for your patients can't be submitted until you add it."}
      </p>
      <ul className="philhealth-accreditation-card__warnings" aria-label="Before you save">
        <li>Enter the number <strong>exactly as printed on your PhilHealth accreditation certificate</strong>.</li>
        <li>A wrong PAN gets claims returned by PhilHealth, or your professional fees paid against the wrong accreditation.</li>
        <li>You are responsible for its accuracy. It isn't verified by the clinic before it's used on claims.</li>
        <li>Changing it does not alter claims that were already submitted.</li>
      </ul>
      <form className="philhealth-accreditation-card__form" onSubmit={review}>
        <Field label="PhilHealth accreditation no. (PAN)">
          <Input value={pan} onChange={(event) => setPan(event.target.value)} inputMode="numeric" placeholder="1234-1234567-1" autoComplete="off" required />
        </Field>
        <Field label="PRC license no. (optional)">
          <Input value={prc} onChange={(event) => setPrc(event.target.value)} inputMode="numeric" autoComplete="off" />
        </Field>
        <div className="philhealth-accreditation-card__actions">
          <Button type="submit" disabled={saving}>Review and save</Button>
          {error ? <p className="philhealth-accreditation-card__error" role="alert">{error}</p> : null}
          {message ? <p className="philhealth-accreditation-card__message" role="status">{message}</p> : null}
        </div>
      </form>

      <dialog ref={dialogRef} className="philhealth-accreditation-confirm" aria-labelledby="philhealth-accreditation-confirm-heading" onCancel={() => setConfirming(false)}>
        <h4 id="philhealth-accreditation-confirm-heading">Confirm your PhilHealth accreditation number</h4>
        <p>You entered:</p>
        <p className="philhealth-accreditation-confirm__pan">{formatted}</p>
        {prc.trim() ? <p>PRC license: <strong>{prc.trim()}</strong></p> : null}
        <p>Check it digit by digit against your PhilHealth accreditation certificate. Claims you sign from now on will use this number.</p>
        <div className="philhealth-accreditation-confirm__actions">
          <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={saving}>Go back and edit</Button>
          <Button type="button" onClick={() => void confirmSave()} disabled={saving}>{saving ? "Saving…" : "Yes, it matches my certificate"}</Button>
        </div>
      </dialog>
    </section>
  );
}
