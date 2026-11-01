"use client";

import {
  DISCHARGE_OUTCOME_LABELS,
  type DischargeDetails,
  type DischargeOutcome,
} from "@odyssey/types";

/**
 * Discharge outcome and transfer, printed on PhilHealth CF2 and CF4.
 * Required for PhilHealth visits; the database says so if it is missing.
 */
export function DischargeFields({
  value,
  onChange,
}: {
  value: DischargeDetails;
  onChange: (next: DischargeDetails) => void;
}) {
  const transferred = value.outcome === "transferred";
  return (
    <div className="encounter-discharge-fields">
      <label>
        Discharge outcome
        <select
          className="odyssey-input"
          value={value.outcome ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              outcome: (event.target.value || null) as DischargeOutcome | null,
            })
          }
        >
          <option value="">Not recorded</option>
          {(Object.keys(DISCHARGE_OUTCOME_LABELS) as DischargeOutcome[]).map(
            (code) => (
              <option key={code} value={code}>
                {DISCHARGE_OUTCOME_LABELS[code]}
              </option>
            ),
          )}
        </select>
        <span className="encounter-discharge-hint">
          Required for PhilHealth patients.
        </span>
      </label>
      {transferred ? (
        <>
          <label>
            Transferred to (facility)
            <input
              className="odyssey-input"
              maxLength={200}
              required
              value={value.referredToFacility ?? ""}
              onChange={(event) =>
                onChange({ ...value, referredToFacility: event.target.value })
              }
            />
          </label>
          <label>
            Reason for transfer
            <input
              className="odyssey-input"
              maxLength={1000}
              value={value.referredToReason ?? ""}
              onChange={(event) =>
                onChange({ ...value, referredToReason: event.target.value })
              }
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

/** Trims the free-text fields and drops transfer details for other outcomes. */
export function normalizeDischarge(value: DischargeDetails): DischargeDetails {
  const transferred = value.outcome === "transferred";
  return {
    outcome: value.outcome,
    referredToFacility: transferred
      ? value.referredToFacility?.trim() || null
      : null,
    referredToReason: transferred ? value.referredToReason?.trim() || null : null,
  };
}
