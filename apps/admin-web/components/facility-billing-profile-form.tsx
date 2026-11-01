"use client";

import { getOrganizationBillingProfile, setOrganizationBillingProfile } from "@odyssey/supabase-client";
import type {
  BalanceBillingPolicy,
  FacilityOwnership,
  FacilityType,
  OrganizationBillingProfile,
} from "@odyssey/types";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminData } from "./admin-data-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const policyHelp: Record<BalanceBillingPolicy, string> = {
  none: "Patients pay their balance. PhilHealth-covered amounts are claimed separately.",
  nbb: "PhilHealth No Balance Billing: ₱0 for indigent, sponsored, kasambahay, senior and lifetime members in ward admissions or NBB-covered packages. Private facilities need a signed PhilHealth MOA.",
  zbb: "DOH Zero Balance Billing: ₱0 for every patient admitted in basic/ward accommodation. DOH-retained hospitals only; ER visits are excluded.",
  facility_wide_subsidy: "Legacy government mode: every visit is ₱0 for the patient, funded by the government.",
};

/** Mirrors the server rules in set_organization_billing_profile. */
function isPolicyAllowed(policy: BalanceBillingPolicy, ownership: FacilityOwnership): boolean {
  if (policy === "zbb") return ownership === "doh_retained";
  if (policy === "facility_wide_subsidy") return ownership !== "private";
  return true;
}

export function FacilityBillingProfileForm({
  organizationId,
  onSaved,
}: {
  organizationId: string;
  onSaved?: () => void;
}) {
  const { client } = useAdminData();
  const [profile, setProfile] = useState<OrganizationBillingProfile | null>(null);
  const [ownership, setOwnership] = useState<FacilityOwnership>("private");
  const [policy, setPolicy] = useState<BalanceBillingPolicy>("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getOrganizationBillingProfile(client, organizationId);
    if (result.error) return setError(result.error.message);
    setProfile(result.data);
    setOwnership(result.data.ownership);
    setPolicy(result.data.balanceBillingPolicy);
  }, [client, organizationId]);

  function changeOwnership(next: FacilityOwnership) {
    setOwnership(next);
    setMessage(null);
    if (!isPolicyAllowed(policy, next)) {
      setPolicy("none");
      setError(null);
      setMessage(
        next === "private"
          ? "Private facilities can only use None or No Balance Billing (with a PhilHealth MOA). The policy was reset to None."
          : "Zero Balance Billing is only for DOH-retained hospitals. The policy was reset to None.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await setOrganizationBillingProfile(client, organizationId, {
      facilityType: String(form.get("facilityType")) as FacilityType,
      ownership: String(form.get("ownership")) as FacilityOwnership,
      balanceBillingPolicy: String(form.get("policy")) as BalanceBillingPolicy,
      hciAccreditationNumber: String(form.get("accreditation") ?? "").trim() || null,
    });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    setProfile(result.data);
    setOwnership(result.data.ownership);
    setPolicy(result.data.balanceBillingPolicy);
    setMessage("Billing profile saved. New visits use this policy.");
    onSaved?.();
  }

  if (!profile) {
    return error ? <p className="form-error" role="alert">{error}</p> : <section className="data-loading" aria-live="polite">Loading billing profile…</section>;
  }

  return (
    <section className="form-section" aria-labelledby="facility-billing-profile-heading">
      <div className="section-title">
        <h3 id="facility-billing-profile-heading">PhilHealth billing profile</h3>
        <p>Decides when a patient pays ₱0 and when a PhilHealth claim is drafted.</p>
      </div>
      <form onSubmit={save}>
        <fieldset disabled={!profile.canManage || saving} className="form-grid">
          <label className="field-label">Facility type
            <select className="ui-input" name="facilityType" defaultValue={profile.facilityType}>
              <option value="clinic">Clinic</option>
              <option value="infirmary">Infirmary</option>
              <option value="hospital_level_1">Hospital (Level 1)</option>
              <option value="hospital_level_2">Hospital (Level 2)</option>
              <option value="hospital_level_3">Hospital (Level 3)</option>
            </select>
          </label>
          <label className="field-label">Ownership
            <select className="ui-input" name="ownership" value={ownership} onChange={(event) => changeOwnership(event.target.value as FacilityOwnership)}>
              <option value="private">Private</option>
              <option value="doh_retained">DOH-retained</option>
              <option value="lgu">Local government (LGU)</option>
              <option value="other_government">Other government</option>
            </select>
          </label>
          <label className="field-label">Balance billing policy
            <select className="ui-input" name="policy" value={policy} onChange={(event) => setPolicy(event.target.value as BalanceBillingPolicy)}>
              <option value="none">None (patients pay their balance)</option>
              <option value="nbb">PhilHealth No Balance Billing</option>
              <option value="zbb" disabled={!isPolicyAllowed("zbb", ownership)}>DOH Zero Balance Billing{isPolicyAllowed("zbb", ownership) ? "" : " (DOH-retained only)"}</option>
              <option value="facility_wide_subsidy" disabled={!isPolicyAllowed("facility_wide_subsidy", ownership)}>Facility-wide subsidy (legacy){isPolicyAllowed("facility_wide_subsidy", ownership) ? "" : " (government only)"}</option>
            </select>
          </label>
          <label className="field-label">HCI accreditation no.
            <Input name="accreditation" defaultValue={profile.hciAccreditationNumber ?? ""} placeholder="e.g. H07021036" />
          </label>
          <p className="field-span">{policyHelp[policy]}</p>
          {profile.canManage ? (
            <div className="field-span facility-billing-actions">
              <Button type="submit">{saving ? "Saving…" : "Save billing profile"}</Button>
              {error ? <p className="facility-billing-feedback is-error" role="alert">{error}</p> : null}
              {message ? <p className="facility-billing-feedback" role="status">{message}</p> : null}
            </div>
          ) : (
            <p className="field-span">Only a facility administrator can change the billing profile.</p>
          )}
        </fieldset>
      </form>
      {!profile.canManage && error ? <p className="facility-billing-feedback is-error" role="alert">{error}</p> : null}
    </section>
  );
}
