"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { US_STATES, JURISDICTION_TYPE_LABELS } from "@permits/shared";
import type { JurisdictionType } from "@permits/shared";

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  permitPortalUrl: string | null;
  websiteUrl: string | null;
  notes: string | null;
}

interface JurisdictionFormProps {
  jurisdiction?: Jurisdiction;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  type?: string;
  state?: string;
  email?: string;
  permitPortalUrl?: string;
  websiteUrl?: string;
}

const JURISDICTION_TYPES = Object.keys(JURISDICTION_TYPE_LABELS) as JurisdictionType[];

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function JurisdictionForm({ jurisdiction, onSuccess, onCancel }: JurisdictionFormProps) {
  const isEditing = !!jurisdiction;

  const [name, setName] = useState(jurisdiction?.name ?? "");
  const [type, setType] = useState(jurisdiction?.type ?? "CITY");
  const [state, setState] = useState(jurisdiction?.state ?? "");
  const [county, setCounty] = useState(jurisdiction?.county ?? "");
  const [phone, setPhone] = useState(jurisdiction?.phone ?? "");
  const [email, setEmail] = useState(jurisdiction?.email ?? "");
  const [address, setAddress] = useState(jurisdiction?.address ?? "");
  const [permitPortalUrl, setPermitPortalUrl] = useState(jurisdiction?.permitPortalUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(jurisdiction?.websiteUrl ?? "");
  const [notes, setNotes] = useState(jurisdiction?.notes ?? "");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }
    if (!type) {
      newErrors.type = "Type is required.";
    }
    if (!state) {
      newErrors.state = "State is required.";
    }
    if (email && !isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (permitPortalUrl && !isValidUrl(permitPortalUrl)) {
      newErrors.permitPortalUrl = "Please enter a valid URL.";
    }
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = "Please enter a valid URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const body = {
      name: name.trim(),
      type,
      state,
      county: county.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      permitPortalUrl: permitPortalUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const url = isEditing
        ? `/api/jurisdictions/${jurisdiction.id}`
        : "/api/jurisdictions";

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to ${isEditing ? "update" : "create"} jurisdiction`);
      }

      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";

  const selectClass =
    "flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";

  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., City of Newark"
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Type + State row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            {JURISDICTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {JURISDICTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-500">{errors.type}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={selectClass}
          >
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-xs text-red-500">{errors.state}</p>
          )}
        </div>
      </div>

      {/* County */}
      <div>
        <label className={labelClass}>County</label>
        <input
          type="text"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          placeholder="e.g., Essex"
          className={inputClass}
        />
      </div>

      {/* Phone + Email row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="permits@city.gov"
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelClass}>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, State 12345"
          className={inputClass}
        />
      </div>

      {/* URLs row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Permit Portal URL</label>
          <input
            type="url"
            value={permitPortalUrl}
            onChange={(e) => setPermitPortalUrl(e.target.value)}
            placeholder="https://permits.city.gov"
            className={inputClass}
          />
          {errors.permitPortalUrl && (
            <p className="mt-1 text-xs text-red-500">{errors.permitPortalUrl}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Website URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://www.city.gov"
            className={inputClass}
          />
          {errors.websiteUrl && (
            <p className="mt-1 text-xs text-red-500">{errors.websiteUrl}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this jurisdiction..."
          rows={4}
          className="flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-y"
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {submitError}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Jurisdiction"}
        </button>
      </div>
    </form>
  );
}
