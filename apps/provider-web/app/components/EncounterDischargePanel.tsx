"use client";

import {
  createBrowserSupabaseClient,
  getEncounterDischarge,
  recordEncounterDischarge,
} from "@odyssey/supabase-client";
import type { DischargeDetails } from "@odyssey/types";
import { Button } from "@odyssey/ui";
import { useEffect, useState } from "react";
import { DischargeFields, normalizeDischarge } from "./DischargeFields";

/**
 * Discharge outcome on a finished chart. Doctors can record or correct it
 * until the PhilHealth claim is submitted.
 */
export function EncounterDischargePanel({ encounterId }: { encounterId: string }) {
  const [discharge, setDischarge] = useState<DischargeDetails>({ outcome: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getEncounterDischarge(createBrowserSupabaseClient(), encounterId).then((result) => {
      if (result.error) setError(result.error.message);
      else setDischarge(result.data);
    });
  }, [encounterId]);

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await recordEncounterDischarge(createBrowserSupabaseClient(), encounterId, normalizeDischarge(discharge));
    setBusy(false);
    if (result.error) return setError(result.error.message);
    setMessage("Discharge details saved.");
  }

  return (
    <section className="encounter-action-card encounter-diagnosis-panel" aria-labelledby="encounter-discharge-heading">
      <div className="encounter-card-header">
        <h3 id="encounter-discharge-heading">Discharge</h3>
      </div>
      <DischargeFields value={discharge} onChange={setDischarge} />
      <Button type="button" size="sm" disabled={busy || !discharge.outcome} onClick={() => void save()}>
        {busy ? "Saving…" : "Save discharge details"}
      </Button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
