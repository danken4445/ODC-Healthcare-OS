"use client";

import {
  createBrowserSupabaseClient,
  getPortalAccess,
} from "@odyssey/supabase-client";
import { PhilhealthAccreditationCard } from "@odyssey/ui";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ProviderProfilePage() {
  const client = useMemo(() => createBrowserSupabaseClient(), []);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [status, setStatus] = useState("Loading your profile…");

  useEffect(() => {
    async function load() {
      const access = await getPortalAccess(client, "provider");
      const clinicId = access.data?.organizationIds[0];
      if (access.error || !access.data?.allowed || !clinicId) {
        setStatus("Sign in through the provider workspace to view your profile.");
        return;
      }
      const roleCodes = access.data.roleCodes ?? [];
      setIsDoctor(roleCodes.includes("doctor") || roleCodes.includes("specialist"));
      setOrganizationId(clinicId);
      setStatus("");
    }
    void load();
  }, [client]);

  return (
    <main>
      <p className="eyebrow">Provider workspace</p>
      <h1>My profile</h1>
      <nav className="session-actions">
        <Link href="/">← Queue</Link>
        <Link href="/payouts">My payouts</Link>
      </nav>
      {status ? <p role="status">{status}</p> : null}
      {organizationId && isDoctor ? <PhilhealthAccreditationCard client={client} organizationId={organizationId} /> : null}
      {organizationId && !isDoctor ? <p className="hint">PhilHealth accreditation numbers are recorded by doctors and specialists.</p> : null}
    </main>
  );
}
