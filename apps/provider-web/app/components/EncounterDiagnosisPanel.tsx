"use client";

import {
  createBrowserSupabaseClient,
  listEncounterConditions,
  recordEncounterCondition,
  removeEncounterCondition,
  searchIcd10Reference,
} from "@odyssey/supabase-client";
import type { EncounterCondition, Icd10ReferenceCondition } from "@odyssey/types";
import { Badge, Button, Field, Input } from "@odyssey/ui";
import { useCallback, useEffect, useState } from "react";

interface EncounterDiagnosisPanelProps {
  encounterId: string;
  /** Diagnoses can be coded while the encounter is open or finished, until its claim is submitted. */
  canEdit: boolean;
}

/**
 * ICD-10 coding from the PhilHealth Annex A reference. Rank 1 is the final
 * diagnosis that PhilHealth claims, the PMR and disease surveillance use.
 */
export function EncounterDiagnosisPanel({ encounterId, canEdit }: EncounterDiagnosisPanelProps) {
  const [conditions, setConditions] = useState<EncounterCondition[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Icd10ReferenceCondition[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listEncounterConditions(createBrowserSupabaseClient(), encounterId);
    if (result.error) setError(result.error.message);
    else setConditions(result.data);
  }, [encounterId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await searchIcd10Reference(createBrowserSupabaseClient(), query);
      if (!result.error) setResults(result.data.slice(0, 8));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function record(code: string, diagnosisRank: number) {
    setBusy(true);
    setError(null);
    const result = await recordEncounterCondition(createBrowserSupabaseClient(), {
      encounterId,
      icd10Code: code,
      diagnosisRank,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setQuery("");
    setResults([]);
    await load();
  }

  async function remove(conditionId: string) {
    setBusy(true);
    setError(null);
    const result = await removeEncounterCondition(createBrowserSupabaseClient(), conditionId);
    setBusy(false);
    if (result.error) setError(result.error.message);
    else await load();
  }

  const hasFinal = conditions.some((condition) => condition.diagnosisRank === 1);

  return (
    <section className="encounter-action-card encounter-diagnosis-panel" aria-labelledby="encounter-diagnosis-heading">
      <div className="encounter-card-header">
        <h3 id="encounter-diagnosis-heading">Diagnosis (ICD-10)</h3>
      </div>
      {conditions.length === 0 ? (
        <p className="hint">No coded diagnosis yet. PhilHealth claims need a final diagnosis.</p>
      ) : (
        <ul className="encounter-diagnosis-list">
          {conditions.map((condition) => (
            <li key={condition.id}>
              <span>
                <strong>{condition.code}</strong> {condition.codeDisplay}
              </span>
              {condition.diagnosisRank === 1 ? <Badge variant="success">Final</Badge> : <Badge variant="muted">Secondary</Badge>}
              {canEdit ? (
                <span className="encounter-diagnosis-actions">
                  {condition.diagnosisRank !== 1 ? (
                    <Button size="sm" type="button" variant="outline" disabled={busy} onClick={() => void record(condition.code, 1)}>
                      Make final
                    </Button>
                  ) : null}
                  <Button size="sm" type="button" variant="outline" disabled={busy} onClick={() => void remove(condition.id)}>
                    Remove
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <Field label="Add diagnosis">
          <Input
            aria-autocomplete="list"
            aria-controls="encounter-diagnosis-results"
            disabled={busy}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code or description, e.g. N39.0 or urinary tract"
            value={query}
          />
        </Field>
      ) : null}
      {results.length > 0 ? (
        <ul className="encounter-diagnosis-results" id="encounter-diagnosis-results">
          {results.map((result) => (
            <li key={result.code}>
              <button type="button" disabled={busy} onClick={() => void record(result.code, hasFinal ? 2 : 1)}>
                <strong>{result.code}</strong> {result.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </section>
  );
}
