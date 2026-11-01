"use client";

import { Building2, Info, Landmark, ShieldCheck } from "lucide-react";
import { AdminSignIn } from "../../../components/admin-sign-in";
import { useAdminData } from "../../../components/admin-data-context";
import { FacilityClassificationToggle } from "../../../components/facility-classification-toggle";
import { FacilityBillingProfileForm } from "../../../components/facility-billing-profile-form";
import { PageHeader } from "../../../components/page-header";
import { useState } from "react";

export default function FacilityClassificationPage() {
  const { email, error: accessError, loading, organization } = useAdminData();
  // The legacy toggle and the billing profile write the same settings, so each
  // reloads the other after a change.
  const [toggleVersion, setToggleVersion] = useState(0);
  const [profileVersion, setProfileVersion] = useState(0);

  if (!email && accessError) return <AdminSignIn />;

  return (
    <div className="facility-classification-page">
      <PageHeader
        eyebrow="Hospital configuration"
        title="Facility Classification & Billing Route"
        description="Configure whether this hospital operates as a Government No-Billing facility under PhilHealth NBB or a Private hospital with standard patient invoicing."
      />

      {loading && !organization ? (
        <section className="data-loading" aria-live="polite">
          Loading hospital profile…
        </section>
      ) : organization ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px" }}>
          {/* Main Toggle Component */}
          <FacilityClassificationToggle
            key={`toggle-${toggleVersion}`}
            onChanged={() => setProfileVersion((version) => version + 1)}
            organizationId={organization.id}
            organizationName={organization.name}
          />

          <FacilityBillingProfileForm
            key={`profile-${profileVersion}`}
            onSaved={() => setToggleVersion((version) => version + 1)}
            organizationId={organization.id}
          />

          {/* Operational & Regulatory Reference */}
          <section className="form-section">
            <div className="section-title">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Info size={18} aria-hidden="true" style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Policy & Workflow Comparison</h3>
              </div>
              <p>
                How facility classification impacts clinical encounters, pharmacy/consumable usage, and patient billing.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#166534" }}>
                  <Landmark size={18} aria-hidden="true" />
                  <strong>Government No-Billing (PhilHealth NBB)</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#14532d", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>
                    <strong>Universal Coverage:</strong> Designed for public hospitals and LGU health units enforcing the Philippine Universal Health Care Act and PhilHealth NBB policy.
                  </li>
                  <li>
                    <strong>Zero Out-of-Pocket:</strong> Patients pay ₱0 for consultations, lab orders, and tagged consumables.
                  </li>
                  <li>
                    <strong>Third-Party Claims:</strong> System bundles catalog line items into a PhilHealth institutional claim.
                  </li>
                  <li>
                    <strong>Receipt Issuance:</strong> Patient receives a verified ₱0 paid statement indicating 100% PhilHealth NBB coverage.
                  </li>
                </ul>
              </div>

              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#1e40af" }}>
                  <Building2 size={18} aria-hidden="true" />
                  <strong>Private Hospital (Standard Billing)</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#1e3a8a", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>
                    <strong>Fee-For-Service:</strong> Tailored for private clinics, polyclinics, and tertiary private medical centers.
                  </li>
                  <li>
                    <strong>Patient Invoices:</strong> Itemized invoices are issued to the patient upon encounter finalization.
                  </li>
                  <li>
                    <strong>Flexible Payments:</strong> Integrated support for Cash, Credit Card, Bank Transfer, and QR e-wallets.
                  </li>
                  <li>
                    <strong>HMO Coordination:</strong> Patient can provide HMO / LOA coverage for claim deduction, with remaining balance payable by the patient.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Audit & Compliance Assurance */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
            }}
          >
            <ShieldCheck size={20} style={{ color: "#16a34a", flexShrink: 0 }} aria-hidden="true" />
            <span>
              All classification changes are logged with immutable audit trails recording the administrator identity,
              timestamp, and previous state.
            </span>
          </div>
        </div>
      ) : (
        <section className="data-error" role="alert">
          <strong>No active hospital selected.</strong>
          <p>Please select a hospital organization from the top bar to review its classification.</p>
        </section>
      )}
    </div>
  );
}
