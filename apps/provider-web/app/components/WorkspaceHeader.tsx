"use client";

import { UserRound,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { AppointmentNotificationControl } from "@odyssey/ui";

export type WorkspaceTab = "all" | "queue" | "chart" | "diagnostics" | "schedule" | "fees";

interface WorkspaceHeaderProps {
  signedInAs: string | null;
  practitionerName?: string | null;
  isNurse?: boolean;
  organizationId: string | null;
  department: string | null;
  roleId: string | null;
  liveStatus: string;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  queueCount: number;
  notificationsCount: number;
  hasActiveEncounter: boolean;
  canManageTemplates: boolean;
  canManageProfessionalFees: boolean;
  canEncodePharmacyPrescriptions?: boolean;
  onSignOut: () => void;
}

const doctorTabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "all", label: "Overview" },
  { id: "queue", label: "Daily queue" },
  { id: "chart", label: "Consultation" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "schedule", label: "Availability" },
];

const nurseTabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "all", label: "Overview" },
  { id: "queue", label: "Daily queue" },
  { id: "diagnostics", label: "Diagnostics" },
];

export function WorkspaceHeader({
  signedInAs,
  practitionerName,
  isNurse = false,
  department,
  liveStatus,
  activeTab,
  onTabChange,
  queueCount,
  notificationsCount,
  hasActiveEncounter,
  canManageTemplates,
  canManageProfessionalFees,
  canEncodePharmacyPrescriptions = false,
  onSignOut,
}: WorkspaceHeaderProps) {
  // Extract clinician name appropriately based on role
  const rawName =
    practitionerName ||
    (signedInAs
      ? signedInAs
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : isNurse
        ? "Nurse"
        : "Clinician");

  const displayName = isNurse
    ? rawName.toLowerCase().startsWith("dr.")
      ? rawName.replace(/^dr\.\s*/i, "Nurse ")
      : rawName.toLowerCase().includes("nurse")
        ? rawName
        : `Nurse ${rawName}`
    : rawName.toLowerCase().startsWith("dr.")
      ? rawName
      : `Dr. ${rawName}`;

  const initials = isNurse
    ? displayName
        .replace(/^Nurse\s+/i, "")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "RN"
    : displayName
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "DR";

  const baseTabs = isNurse ? nurseTabs : doctorTabs;
  const visibleTabs = canManageProfessionalFees
    ? [...baseTabs, { id: "fees" as const, label: "Fees" }]
    : baseTabs;

  return (
    <header className="vesper-provider-header">
      {/* Top Header Row */}
      <div className="vesper-provider-header__top">
        <div className="vesper-provider-title-group">
          <div className="vesper-doctor-avatar">{initials}</div>
          <div>
            <div className="vesper-provider-eyebrow-row">
              <span className="vesper-provider-eyebrow">
                {isNurse ? "Nurse Workspace" : "Provider Workspace"}
              </span>
              {department && (
                <span className="vesper-dept-tag">{department}</span>
              )}
              <span className="vesper-live-indicator">
                <span className="vesper-live-dot" />
                <span>Queue: {liveStatus.toLowerCase()}</span>
              </span>
            </div>
            <h1 className="vesper-provider-h1">{displayName}</h1>
          </div>
        </div>

        <nav className="vesper-provider-header__actions" aria-label="Quick links">
          {!isNurse && (
            <>
              <Link
                href="/teleconsult"
                className="vesper-header-link"
                title="Video Consultation Rooms"
              >
                <Video size={16} />
                <span>Video rooms</span>
              </Link>
              <Link
                href="/payouts"
                className="vesper-header-link"
                title="Doctor Payouts & Entitlements"
              >
                <HandCoins size={16} />
                <span>Payouts</span>
              </Link>
              <Link
                href="/profile"
                className="vesper-header-link"
                title="My profile and PhilHealth accreditation"
              >
                <UserRound size={16} />
                <span>Profile</span>
              </Link>
            </>
          )}
          {isNurse && canEncodePharmacyPrescriptions && (
            <Link
              href="/pharmacy-orders"
              className="vesper-header-link"
              title="Encode a physical prescription for Pharmacy"
            >
              <FileText size={16} />
              <span>Pharmacy encoder</span>
            </Link>
          )}
          <AppointmentNotificationControl />
          <button
            type="button"
            className="vesper-provider-logout-btn"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out of clinical workspace"
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </nav>
      </div>

      {/* Horizontal Tab Navigation (Filtered by Role) */}
      <nav
        className="workspace-nav-tabs vesper-tab-bar"
        aria-label={isNurse ? "Nurse workspace sections" : "Doctor workspace sections"}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "queue"
              ? queueCount
              : tab.id === "diagnostics"
              ? notificationsCount
              : 0;

          return (
            <button
              key={tab.id}
              type="button"
              className={`vesper-tab-btn ${
                isActive ? "vesper-tab-btn--active" : "vesper-tab-btn--inactive"
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`vesper-tab-badge ${
                    isActive ? "vesper-tab-badge--active" : "vesper-tab-badge--inactive"
                  }`}
                >
                  {count}
                </span>
              )}
              {tab.id === "chart" && hasActiveEncounter && (
                <span
                  className={`vesper-tab-badge ${
                    isActive ? "vesper-tab-badge--active" : "vesper-tab-badge--highlight"
                  }`}
                >
                  Active
                </span>
              )}
            </button>
          );
        })}
        {canManageTemplates && !isNurse && (
          <Link href="/templates" className="vesper-tab-btn vesper-tab-btn--inactive">
            <span>Templates</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
