"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  avatarUrl: string | null;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    aiCreditsRemaining: number;
    currentPeriodEnd: string | null;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);

  // Notification preferences (local state; could be persisted to API later)
  const [notifPrefs, setNotifPrefs] = useState({
    permitUpdates: true,
    inspectionReminders: true,
    taskAssignments: true,
    documentUploads: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const json = await res.json();
        const user = json.data;
        setProfile(user);
        setName(user.name || "");
        setPhone(user.phone || "");
        setCompany(user.company || "");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, company }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully.");
        fetchProfile();
      } else {
        setMessage("Failed to update profile.");
      }
    } catch {
      setMessage("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage(data.error || "Failed to update password.");
      }
    } catch {
      setPasswordMessage("An error occurred.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.url) {
          window.location.href = data.data.url;
          return;
        }
      }
      setBillingLoading(false);
    } catch {
      setBillingLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <Input value={profile?.email || ""} disabled className="bg-neutral-50" />
              <p className="mt-1 text-xs text-neutral-500">
                Email cannot be changed.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Company
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <span className="text-xs text-neutral-500">
                Member since{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "\u2014"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              {
                key: "permitUpdates" as const,
                label: "Permit status updates",
                description: "Get notified when permit statuses change",
              },
              {
                key: "inspectionReminders" as const,
                label: "Inspection reminders",
                description: "Reminders about upcoming inspections",
              },
              {
                key: "taskAssignments" as const,
                label: "Task assignments",
                description: "When tasks are assigned to you",
              },
              {
                key: "documentUploads" as const,
                label: "Document uploads",
                description: "When new documents are uploaded to your permits",
              },
            ].map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between rounded-lg border border-neutral-100 p-4 hover:bg-neutral-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-neutral-900">{pref.label}</p>
                  <p className="text-sm text-neutral-500">{pref.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[pref.key]}
                  onChange={(e) =>
                    setNotifPrefs((prev) => ({
                      ...prev,
                      [pref.key]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Security
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium text-neutral-900">
                Change Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="text-xs text-neutral-500">
                  Must be at least 8 characters with one uppercase letter and
                  one number
                </p>
                {passwordMessage && (
                  <p
                    className={`text-sm ${
                      passwordMessage.includes("success")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {passwordMessage}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Billing & Subscription
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Current Plan</p>
                  <p className="text-sm text-neutral-500">
                    {profile?.subscription?.plan === "ANNUAL"
                      ? "Annual Plan ($250/year)"
                      : profile?.subscription?.plan === "ENTERPRISE"
                        ? "Enterprise Plan"
                        : "Free Plan"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    profile?.subscription?.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {profile?.subscription?.status || "Free"}
                </span>
              </div>
            </div>

            {profile?.subscription && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-100 p-4">
                  <p className="text-sm text-neutral-500">AI Credits</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {profile.subscription.aiCreditsRemaining}
                  </p>
                  <p className="text-xs text-neutral-400">remaining</p>
                </div>
                {profile.subscription.currentPeriodEnd && (
                  <div className="rounded-lg border border-neutral-100 p-4">
                    <p className="text-sm text-neutral-500">Next Billing</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">
                      {new Date(
                        profile.subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-neutral-500">
              Annual subscription: $250/year. Manage your subscription, payment
              methods, and invoices through Stripe.
            </p>

            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={billingLoading}
            >
              {billingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
