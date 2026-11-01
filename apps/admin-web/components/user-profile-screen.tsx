"use client";

import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PhilhealthAccreditationCard } from "@odyssey/ui";
import { useAdminData } from "./admin-data-context";
import { AdminSignIn } from "./admin-sign-in";
import { PageHeader } from "./page-header";
import { permissionLabels } from "../lib/admin-data";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  jobTitle: string;
  bio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function UserProfileScreen() {
  const {
    assignedDepartmentId,
    client,
    email,
    isSuperadmin,
    loading: authLoading,
    organization,
    permissions,
    refreshAccess,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "access">("profile");
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // User meta from Supabase Auth
  const [userId, setUserId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [lastSignInAt, setLastSignInAt] = useState<string>("");
  const [detectedRole, setDetectedRole] = useState<string>("");
  const [departmentName, setDepartmentName] = useState<string>("");

  // Form inputs
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    firstName: "",
    lastName: "",
    phone: "",
    secondaryPhone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    jobTitle: "",
    bio: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [initialData, setInitialData] = useState<ProfileFormData>({ ...formData });

  // Password inputs
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadUserProfile = useCallback(async () => {
    setLoadingUserData(true);
    setProfileMessage(null);
    setPasswordMessage(null);

    try {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) {
        setLoadingUserData(false);
        return;
      }

      const user = authData.user;
      setUserId(user.id);
      setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—");
      setLastSignInAt(user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "Current session");

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

      let firstName = typeof meta.first_name === "string" ? meta.first_name : "";
      let lastName = typeof meta.last_name === "string" ? meta.last_name : "";
      let displayName =
        typeof meta.display_name === "string"
          ? meta.display_name
          : typeof meta.full_name === "string"
          ? meta.full_name
          : "";
      let phone =
        typeof meta.phone === "string"
          ? meta.phone
          : typeof meta.phone_number === "string"
          ? meta.phone_number
          : user.phone ?? "";
      let secondaryPhone = typeof meta.secondary_phone === "string" ? meta.secondary_phone : "";
      let address = typeof meta.address === "string" ? meta.address : "";
      let city = typeof meta.city === "string" ? meta.city : "";
      let province = typeof meta.province === "string" ? meta.province : "";
      let postalCode = typeof meta.postal_code === "string" ? meta.postal_code : "";
      let jobTitle = typeof meta.job_title === "string" ? meta.job_title : "";
      let bio = typeof meta.bio === "string" ? meta.bio : "";
      let emergencyName = typeof meta.emergency_contact_name === "string" ? meta.emergency_contact_name : "";
      let emergencyPhone = typeof meta.emergency_contact_phone === "string" ? meta.emergency_contact_phone : "";

      // Try reading practitioner record if available
      try {
        const { data: practitioner } = await client
          .from("practitioners")
          .select("id, name, telecom, address")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (practitioner) {
          const pracName = practitioner.name as { text?: string; given?: string[]; family?: string } | null;
          if (pracName) {
            if (!displayName && pracName.text) displayName = pracName.text;
            if (!firstName && pracName.given?.[0]) firstName = pracName.given[0];
            if (!lastName && pracName.family) lastName = pracName.family;
          }

          if (Array.isArray(practitioner.telecom)) {
            const phoneEntry = (practitioner.telecom as Array<{ system?: string; value?: string }>).find(
              (t) => t.system === "phone" && t.value,
            );
            if (!phone && phoneEntry?.value) phone = phoneEntry.value;
          }

          if (Array.isArray(practitioner.address)) {
            const addrEntry = practitioner.address[0] as {
              text?: string;
              line?: string[];
              city?: string;
              state?: string;
              postalCode?: string;
            } | null;
            if (addrEntry) {
              if (!address && addrEntry.text) address = addrEntry.text;
              if (!city && addrEntry.city) city = addrEntry.city;
              if (!province && addrEntry.state) province = addrEntry.state;
              if (!postalCode && addrEntry.postalCode) postalCode = addrEntry.postalCode;
            }
          }
        }
      } catch {
        // Ignored
      }

      // Check practitioner role or user role
      if (isSuperadmin) {
        setDetectedRole("Platform Superadmin");
      } else {
        try {
          const { data: roles } = await client
            .from("practitioner_roles")
            .select("role_code")
            .eq("active", true)
            .limit(1);

          if (roles && roles[0]?.role_code) {
            const code = roles[0].role_code;
            const formatted = code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            setDetectedRole(formatted);
          } else {
            setDetectedRole("Staff Member");
          }
        } catch {
          setDetectedRole("Staff Member");
        }
      }

      // Check department name if assigned
      if (assignedDepartmentId) {
        try {
          const { data: dept } = await client
            .from("departments")
            .select("name")
            .eq("id", assignedDepartmentId)
            .maybeSingle();
          if (dept?.name) setDepartmentName(dept.name);
        } catch {
          // Ignored
        }
      }

      // Fallback display name from email if empty
      if (!displayName) {
        displayName = user.email ? user.email.split("@")[0] : "Odyssey User";
      }

      const loadedValues: ProfileFormData = {
        displayName,
        firstName,
        lastName,
        phone,
        secondaryPhone,
        address,
        city,
        province,
        postalCode,
        jobTitle,
        bio,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      };

      setFormData(loadedValues);
      setInitialData(loadedValues);
    } catch {
      setProfileMessage({
        type: "error",
        text: "Could not load current user profile details. Please try again.",
      });
    } finally {
      setLoadingUserData(false);
    }
  }, [assignedDepartmentId, client, isSuperadmin]);

  useEffect(() => {
    if (email) {
      void loadUserProfile();
    }
  }, [email, loadUserProfile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // If user is editing first/last name and displayName wasn't manually set to something distinct, sync
      if ((field === "firstName" || field === "lastName") && (!prev.displayName || prev.displayName === `${prev.firstName} ${prev.lastName}`.trim())) {
        const combined = `${field === "firstName" ? value : prev.firstName} ${field === "lastName" ? value : prev.lastName}`.trim();
        if (combined) next.displayName = combined;
      }
      return next;
    });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    const trimmedName = formData.displayName.trim();
    if (!trimmedName) {
      setProfileMessage({ type: "error", text: "Display name cannot be empty." });
      setSavingProfile(false);
      return;
    }

    try {
      const { data: updated, error: updateError } = await client.auth.updateUser({
        data: {
          display_name: trimmedName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim() || trimmedName,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          phone_number: formData.phone.trim(),
          secondary_phone: formData.secondaryPhone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postal_code: formData.postalCode.trim(),
          job_title: formData.jobTitle.trim(),
          bio: formData.bio.trim(),
          emergency_contact_name: formData.emergencyContactName.trim(),
          emergency_contact_phone: formData.emergencyContactPhone.trim(),
        },
      });

      if (updateError) {
        setProfileMessage({ type: "error", text: updateError.message });
        setSavingProfile(false);
        return;
      }

      // If user has a practitioner row, attempt syncing to ensure directory consistency
      if (userId) {
        try {
          const fullAddressText = [
            formData.address.trim(),
            formData.city.trim(),
            formData.province.trim(),
            formData.postalCode.trim(),
          ].filter(Boolean).join(", ");

          await client
            .from("practitioners")
            .update({
              name: {
                text: trimmedName,
                given: formData.firstName.trim() ? [formData.firstName.trim()] : [],
                family: formData.lastName.trim() || "",
              },
              telecom: [
                ...(formData.phone.trim() ? [{ system: "phone", value: formData.phone.trim() }] : []),
                ...(email ? [{ system: "email", value: email }] : []),
              ],
              address: fullAddressText
                ? [
                    {
                      text: fullAddressText,
                      line: formData.address.trim() ? [formData.address.trim()] : [],
                      city: formData.city.trim(),
                      state: formData.province.trim(),
                      postalCode: formData.postalCode.trim(),
                    },
                  ]
                : [],
            })
            .eq("auth_user_id", userId);
        } catch {
          // Handled gracefully if table update is restricted
        }
      }

      setInitialData({ ...formData });
      await refreshAccess();
      setProfileMessage({
        type: "success",
        text: "Your profile information has been saved successfully.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setProfileMessage({ type: "error", text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match. Please verify and try again.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      const { error: passError } = await client.auth.updateUser({
        password: newPassword,
      });

      if (passError) {
        setPasswordMessage({ type: "error", text: passError.message });
      } else {
        setPasswordMessage({
          type: "success",
          text: "Password updated successfully. Use your new password on your next sign in.",
        });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to change password.";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetProfile = () => {
    setFormData({ ...initialData });
    setProfileMessage(null);
  };

  // Password strength checks
  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      numberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      matches: Boolean(newPassword && newPassword === confirmPassword),
    };
  }, [newPassword, confirmPassword]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.uppercase) score += 1;
    if (passwordCriteria.lowercase) score += 1;
    if (passwordCriteria.numberOrSymbol) score += 1;
    return score;
  }, [passwordCriteria]);

  if (!authLoading && !email) {
    return <AdminSignIn />;
  }

  const initials = (formData.displayName || email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="vesper-page-container user-profile-screen">
      <PageHeader
        eyebrow="Account & Security"
        title="User Profile"
        description="View and update your personal details, contact numbers, address, credentials, and password security."
        actions={
          <div className="user-profile-header-actions">
            <span className="user-profile-badge user-profile-badge--active">
              <span className="user-profile-badge__dot" />
              Active Account
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadUserProfile()}
              disabled={loadingUserData}
              title="Reload profile data"
            >
              <RefreshCw size={13} className={loadingUserData ? "loading-spinner" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Main Profile Summary Card */}
      <section className="profile-hero-card">
        <div className="profile-hero-card__left">
          <div className="profile-avatar-circle" aria-label={`Avatar for ${formData.displayName}`}>
            <span>{initials}</span>
          </div>
          <div className="profile-hero-card__details">
            <div className="profile-hero-card__name-row">
              <h2 className="profile-hero-card__title">
                {formData.displayName || email?.split("@")[0] || "User Profile"}
              </h2>
              <span className="profile-role-tag">
                <ShieldCheck size={13} aria-hidden="true" />
                {detectedRole || (isSuperadmin ? "Superadmin" : "Staff Member")}
              </span>
            </div>
            <p className="profile-hero-card__email">
              <Mail size={14} aria-hidden="true" />
              <span>{email}</span>
              <span className="profile-verified-chip" title="Email verified">
                <BadgeCheck size={13} aria-hidden="true" /> Verified
              </span>
            </p>
            <div className="profile-hero-card__chips">
              <span className="profile-chip">
                <Building2 size={13} aria-hidden="true" />
                {organization?.name || "Odyssey Network"}
              </span>
              {departmentName && (
                <span className="profile-chip">
                  <Users size={13} aria-hidden="true" />
                  {departmentName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-hero-card__right">
          <div className="profile-meta-stat">
            <span className="profile-meta-stat__label">
              <Calendar size={13} aria-hidden="true" /> Account Created
            </span>
            <span className="profile-meta-stat__value">{createdAt || "—"}</span>
          </div>
          <div className="profile-meta-stat">
            <span className="profile-meta-stat__label">
              <Clock size={13} aria-hidden="true" /> Last Session
            </span>
            <span className="profile-meta-stat__value">{lastSignInAt || "—"}</span>
          </div>
        </div>
      </section>

      {organization ? <PhilhealthAccreditationCard client={client} organizationId={organization.id} /> : null}

      {/* Navigation Tabs */}
      <nav className="profile-nav-tabs" aria-label="Profile navigation sections">
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === "profile" ? "profile-nav-tab--active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={15} aria-hidden="true" />
          <span>Personal Information</span>
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === "security" ? "profile-nav-tab--active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Lock size={15} aria-hidden="true" />
          <span>Password & Security</span>
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === "access" ? "profile-nav-tab--active" : ""}`}
          onClick={() => setActiveTab("access")}
        >
          <Shield size={15} aria-hidden="true" />
          <span>Clinic & Access Scope</span>
        </button>
      </nav>

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="profile-section-container">
          {profileMessage && (
            <div
              className={`profile-banner ${
                profileMessage.type === "success" ? "profile-banner--success" : "profile-banner--error"
              }`}
              role="alert"
            >
              {profileMessage.type === "success" ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <AlertCircle size={18} aria-hidden="true" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="profile-grid">
            {/* Identity & Basic Info */}
            <div className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Identity & Name</h3>
                  <p className="profile-card__subtitle">Your public clinical display identity</p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-form-group">
                  <label htmlFor="user-display-name" className="profile-label">
                    Full Display Name <span className="profile-required">*</span>
                  </label>
                  <Input
                    id="user-display-name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                    placeholder="e.g. Dr. Maria Clara, MD or Juan Dela Cruz"
                    required
                  />
                  <small className="profile-help-text">
                    This name appears on clinical prescriptions, audit trails, and reception badges.
                  </small>
                </div>

                <div className="profile-row-2col">
                  <div className="profile-form-group">
                    <label htmlFor="user-first-name" className="profile-label">
                      First Name
                    </label>
                    <Input
                      id="user-first-name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="e.g. Maria"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="user-last-name" className="profile-label">
                      Last Name
                    </label>
                    <Input
                      id="user-last-name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="e.g. Clara"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="user-job-title" className="profile-label">
                    Job Title / Clinical Designation
                  </label>
                  <Input
                    id="user-job-title"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    placeholder="e.g. Attending Physician, Head Nurse, Triage Officer"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Contact Numbers</h3>
                  <p className="profile-card__subtitle">Official phone and email contact coordinates</p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-form-group">
                  <label htmlFor="user-phone" className="profile-label">
                    Primary Contact Number <span className="profile-required">*</span>
                  </label>
                  <div className="profile-input-with-icon">
                    <Phone size={15} className="profile-input-icon" aria-hidden="true" />
                    <Input
                      id="user-phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="e.g. +63 917 123 4567 or 09171234567"
                    />
                  </div>
                  <small className="profile-help-text">
                    Used for internal critical notifications and teleconsult fallback.
                  </small>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="user-secondary-phone" className="profile-label">
                    Secondary / Landline Number
                  </label>
                  <div className="profile-input-with-icon">
                    <Phone size={15} className="profile-input-icon" aria-hidden="true" />
                    <Input
                      id="user-secondary-phone"
                      value={formData.secondaryPhone}
                      onChange={(e) => handleInputChange("secondaryPhone", e.target.value)}
                      placeholder="e.g. (02) 8123 4567"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="user-email-display" className="profile-label">
                    Work Email Address
                  </label>
                  <div className="profile-input-with-icon">
                    <Mail size={15} className="profile-input-icon" aria-hidden="true" />
                    <Input
                      id="user-email-display"
                      value={email || ""}
                      readOnly
                      disabled
                      className="profile-input--readonly"
                    />
                  </div>
                  <small className="profile-help-text">
                    Primary login credential managed by Odyssey Healthcare authentication.
                  </small>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="profile-card profile-card--full">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Residential / Official Address</h3>
                  <p className="profile-card__subtitle">
                    Postal coordinates used for provider directory and facility clearance
                  </p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-form-group">
                  <label htmlFor="user-address" className="profile-label">
                    Street Address / Unit / Building
                  </label>
                  <div className="profile-input-with-icon">
                    <MapPin size={15} className="profile-input-icon" aria-hidden="true" />
                    <Input
                      id="user-address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="e.g. Unit 402, Medical Arts Tower, 123 Mabini St., Brgy. San Antonio"
                    />
                  </div>
                </div>

                <div className="profile-row-3col">
                  <div className="profile-form-group">
                    <label htmlFor="user-city" className="profile-label">
                      City / Municipality
                    </label>
                    <Input
                      id="user-city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="e.g. Quezon City, Pasig, Cebu City"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="user-province" className="profile-label">
                      Province / Region
                    </label>
                    <Input
                      id="user-province"
                      value={formData.province}
                      onChange={(e) => handleInputChange("province", e.target.value)}
                      placeholder="e.g. Metro Manila, Cebu, Laguna"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="user-postal-code" className="profile-label">
                      Postal Code / ZIP
                    </label>
                    <Input
                      id="user-postal-code"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      placeholder="e.g. 1100, 6000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact & Notes */}
            <div className="profile-card profile-card--full">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Emergency Contact & Bio</h3>
                  <p className="profile-card__subtitle">Secondary contact and professional background</p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-row-2col">
                  <div className="profile-form-group">
                    <label htmlFor="user-emergency-name" className="profile-label">
                      Emergency Contact Person
                    </label>
                    <Input
                      id="user-emergency-name"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="e.g. Dr. Antonio Luna (Spouse / Relative)"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="user-emergency-phone" className="profile-label">
                      Emergency Contact Number
                    </label>
                    <div className="profile-input-with-icon">
                      <Phone size={15} className="profile-input-icon" aria-hidden="true" />
                      <Input
                        id="user-emergency-phone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        placeholder="e.g. +63 918 765 4321"
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="user-bio" className="profile-label">
                    Professional Bio / Summary
                  </label>
                  <textarea
                    id="user-bio"
                    className="ui-input ui-textarea profile-textarea"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Brief background, certifications, or clinical areas of focus…"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="profile-actions-bar">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetProfile}
              disabled={savingProfile || loadingUserData}
            >
              Reset changes
            </Button>
            <Button
              type="submit"
              disabled={savingProfile || loadingUserData}
            >
              {savingProfile ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Saving profile…
                </>
              ) : (
                <>
                  <Save size={15} aria-hidden="true" />
                  Save profile changes
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === "security" && (
        <div className="profile-section-container">
          {passwordMessage && (
            <div
              className={`profile-banner ${
                passwordMessage.type === "success" ? "profile-banner--success" : "profile-banner--error"
              }`}
              role="alert"
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <AlertCircle size={18} aria-hidden="true" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <div className="profile-grid">
            {/* Change Password Form */}
            <form onSubmit={handleSavePassword} className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Change Password</h3>
                  <p className="profile-card__subtitle">
                    Update your account credentials to keep your clinical access secure
                  </p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-form-group">
                  <label htmlFor="user-new-password" className="profile-label">
                    New Password <span className="profile-required">*</span>
                  </label>
                  <div className="profile-input-with-action">
                    <Input
                      id="user-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="profile-toggle-visibility"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="user-confirm-password" className="profile-label">
                    Confirm New Password <span className="profile-required">*</span>
                  </label>
                  <div className="profile-input-with-action">
                    <Input
                      id="user-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="profile-toggle-visibility"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password strength meter */}
                {newPassword.length > 0 && (
                  <div className="password-strength-container">
                    <div className="password-strength-bar">
                      <div
                        className={`password-strength-fill password-strength-fill--${passwordScore}`}
                        style={{ width: `${(passwordScore / 4) * 100}%` }}
                      />
                    </div>
                    <span className="password-strength-text">
                      Strength:{" "}
                      {passwordScore === 4
                        ? "Very Strong"
                        : passwordScore === 3
                        ? "Good"
                        : passwordScore === 2
                        ? "Moderate"
                        : "Weak"}
                    </span>
                  </div>
                )}

                {/* Password rules checklist */}
                <div className="password-rules-box">
                  <p className="password-rules-title">Password requirements:</p>
                  <ul className="password-rules-list">
                    <li className={passwordCriteria.length ? "rule--met" : "rule--unmet"}>
                      {passwordCriteria.length ? <Check size={13} /> : <span className="rule-bullet" />}
                      At least 8 characters
                    </li>
                    <li className={passwordCriteria.uppercase ? "rule--met" : "rule--unmet"}>
                      {passwordCriteria.uppercase ? <Check size={13} /> : <span className="rule-bullet" />}
                      At least one uppercase letter (A-Z)
                    </li>
                    <li className={passwordCriteria.lowercase ? "rule--met" : "rule--unmet"}>
                      {passwordCriteria.lowercase ? <Check size={13} /> : <span className="rule-bullet" />}
                      At least one lowercase letter (a-z)
                    </li>
                    <li className={passwordCriteria.numberOrSymbol ? "rule--met" : "rule--unmet"}>
                      {passwordCriteria.numberOrSymbol ? <Check size={13} /> : <span className="rule-bullet" />}
                      At least one number or special character
                    </li>
                    {confirmPassword.length > 0 && (
                      <li className={passwordCriteria.matches ? "rule--met" : "rule--unmet"}>
                        {passwordCriteria.matches ? <Check size={13} /> : <span className="rule-bullet" />}
                        Passwords match
                      </li>
                    )}
                  </ul>
                </div>

                <div className="profile-actions-bar" style={{ marginTop: "16px", padding: 0, border: "none" }}>
                  <Button
                    type="submit"
                    disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                  >
                    {savingPassword ? (
                      <>
                        <span className="loading-spinner" aria-hidden="true" />
                        Updating password…
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} aria-hidden="true" />
                        Update password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Security Status & Session Details */}
            <div className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Security Overview</h3>
                  <p className="profile-card__subtitle">Authentication standards and compliance info</p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="security-item">
                  <div className="security-item__icon security-item__icon--blue">
                    <Mail size={17} />
                  </div>
                  <div className="security-item__content">
                    <strong>Primary Sign-in Identifier</strong>
                    <p>{email}</p>
                    <span className="security-tag security-tag--success">Verified Email</span>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-item__icon security-item__icon--emerald">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="security-item__content">
                    <strong>Role-Based Cryptographic Access</strong>
                    <p>Session signed with JSON Web Token (JWT) authenticated against Supabase RLS policies.</p>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-item__icon security-item__icon--slate">
                    <Clock size={17} />
                  </div>
                  <div className="security-item__content">
                    <strong>Session Activity</strong>
                    <p>Current authenticated workspace active.</p>
                    <small>User ID: {userId ? `${userId.substring(0, 18)}…` : "—"}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC & ACCESS SCOPE */}
      {activeTab === "access" && (
        <div className="profile-section-container">
          <div className="profile-grid">
            {/* Clinic Facility Info */}
            <div className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Clinic Facility Scope</h3>
                  <p className="profile-card__subtitle">Your currently active healthcare facility</p>
                </div>
              </div>

              <div className="profile-card__body">
                <div className="profile-info-row">
                  <span className="profile-info-row__label">Facility Name:</span>
                  <strong className="profile-info-row__value">
                    {organization?.name || "Odyssey Network Headquarters"}
                  </strong>
                </div>

                <div className="profile-info-row">
                  <span className="profile-info-row__label">Facility ID:</span>
                  <span className="profile-info-row__value font-mono">
                    {organization?.id || "Global network"}
                  </span>
                </div>

                <div className="profile-info-row">
                  <span className="profile-info-row__label">Assigned Department:</span>
                  <span className="profile-info-row__value">
                    {departmentName || "All Departments / Unrestricted Scope"}
                  </span>
                </div>

                <div className="profile-info-row">
                  <span className="profile-info-row__label">Administrative Tier:</span>
                  <span className="profile-info-row__value">
                    {isSuperadmin ? "Platform Superadmin (Global Network)" : "Clinic Staff / Provider"}
                  </span>
                </div>
              </div>
            </div>

            {/* Granted Permissions */}
            <div className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h3 className="profile-card__title">Granted Role Permissions</h3>
                  <p className="profile-card__subtitle">
                    {isSuperadmin
                      ? "Superadmin accounts have unrestricted network capabilities."
                      : `${permissions.length} operational capabilities authorized for this clinic account.`}
                  </p>
                </div>
              </div>

              <div className="profile-card__body">
                {isSuperadmin ? (
                  <div className="security-item">
                    <div className="security-item__icon security-item__icon--emerald">
                      <Sparkles size={17} />
                    </div>
                    <div className="security-item__content">
                      <strong>Full Superadmin Authority</strong>
                      <p>
                        You have complete administrative oversight over all tenant clinics, clinical modules, billing,
                        staff provisioning, and system audits.
                      </p>
                    </div>
                  </div>
                ) : permissions.length === 0 ? (
                  <p className="profile-empty-text">No specialized role permissions configured for this account.</p>
                ) : (
                  <div className="profile-permissions-cloud">
                    {permissions.map((perm) => (
                      <span key={perm} className="profile-permission-tag">
                        <Check size={12} aria-hidden="true" />
                        {permissionLabels.get(perm) ?? perm}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
