"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Clock,
  DollarSign,
  FileText,
  Building2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JURISDICTION_TYPE_LABELS } from "@permits/shared";
import type { JurisdictionType } from "@permits/shared";

interface JurisdictionChild {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
}

interface JurisdictionDetail {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
  fips: string | null;
  permitPortalUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  officeHours: Record<string, string> | null;
  fees: Record<string, unknown> | null;
  requirements: string[] | null;
  notes: string | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  parentId: string | null;
  parent: { id: string; name: string; type: string } | null;
  children: JurisdictionChild[];
  _count?: {
    properties: number;
    permits: number;
  };
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  STATE: "bg-purple-100 text-purple-700",
  COUNTY: "bg-blue-100 text-blue-700",
  CITY: "bg-green-100 text-green-700",
  TOWNSHIP: "bg-amber-100 text-amber-700",
  VILLAGE: "bg-pink-100 text-pink-700",
  BOROUGH: "bg-orange-100 text-orange-700",
  TOWN: "bg-teal-100 text-teal-700",
  DISTRICT: "bg-indigo-100 text-indigo-700",
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-neutral-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-neutral-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-neutral-100 animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="space-y-3">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-4 w-64 rounded bg-neutral-100" />
          <div className="h-4 w-48 rounded bg-neutral-100" />
          <div className="h-4 w-56 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export default function JurisdictionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [jurisdiction, setJurisdiction] = useState<JurisdictionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJurisdiction() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jurisdictions/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to load jurisdiction");
        }
        const json = await res.json();
        setJurisdiction(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchJurisdiction();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !jurisdiction) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/jurisdictions"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jurisdictions
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-16 shadow-sm">
          <Building2 className="h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm font-medium text-red-500">
            {error || "Jurisdiction not found"}
          </p>
        </div>
      </div>
    );
  }

  const j = jurisdiction;
  const typeLabel = JURISDICTION_TYPE_LABELS[j.type as JurisdictionType] ?? j.type;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button + Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jurisdictions"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{j.name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                TYPE_BADGE_COLORS[j.type] ?? "bg-neutral-100 text-neutral-600"
              )}
            >
              {typeLabel}
            </span>
            {j.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <Shield className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          {j.parent && (
            <p className="mt-0.5 text-sm text-neutral-500">
              Part of{" "}
              <Link
                href={`/dashboard/jurisdictions/${j.parent.id}`}
                className="font-medium text-primary-600 hover:underline"
              >
                {j.parent.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <Building2 className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-neutral-700">
            {j._count?.properties ?? 0} Properties
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <FileText className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-neutral-700">
            {j._count?.permits ?? 0} Permits
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info section */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Information</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
              <div>
                <dt className="text-xs font-medium text-neutral-500">State</dt>
                <dd className="text-sm text-neutral-900">{j.state}</dd>
              </div>
            </div>
            {j.county && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">County</dt>
                  <dd className="text-sm text-neutral-900">{j.county}</dd>
                </div>
              </div>
            )}
            {j.fips && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">FIPS Code</dt>
                  <dd className="text-sm text-neutral-900">{j.fips}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Contact section */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Contact</h2>
          <dl className="mt-4 space-y-3">
            {j.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">Phone</dt>
                  <dd className="text-sm text-neutral-900">{j.phone}</dd>
                </div>
              </div>
            )}
            {j.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">Email</dt>
                  <dd className="text-sm text-neutral-900">{j.email}</dd>
                </div>
              </div>
            )}
            {j.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">Address</dt>
                  <dd className="text-sm text-neutral-900">{j.address}</dd>
                </div>
              </div>
            )}
            {j.websiteUrl && (
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">Website</dt>
                  <dd>
                    <a
                      href={j.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                    >
                      {j.websiteUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {j.permitPortalUrl && (
              <div className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs font-medium text-neutral-500">Permit Portal</dt>
                  <dd>
                    <a
                      href={j.permitPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                    >
                      Open Permit Portal
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {!j.phone && !j.email && !j.address && !j.websiteUrl && !j.permitPortalUrl && (
              <p className="text-sm text-neutral-400">No contact information available.</p>
            )}
          </dl>
        </div>
      </div>

      {/* Office Hours */}
      {j.officeHours && Object.keys(j.officeHours).length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Office Hours</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="pb-2 pr-8 text-left text-xs font-medium text-neutral-500">Day</th>
                  <th className="pb-2 text-left text-xs font-medium text-neutral-500">Hours</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.map((day) => {
                  const hours = j.officeHours?.[day] ?? j.officeHours?.[day.toLowerCase()];
                  if (!hours) return null;
                  return (
                    <tr key={day} className="border-b border-neutral-50 last:border-b-0">
                      <td className="py-2 pr-8 font-medium text-neutral-700">{day}</td>
                      <td className="py-2 text-neutral-600">{hours}</td>
                    </tr>
                  );
                })}
                {/* Show any non-standard day keys */}
                {Object.entries(j.officeHours)
                  .filter(([key]) => !DAY_ORDER.includes(key) && !DAY_ORDER.map((d) => d.toLowerCase()).includes(key))
                  .map(([key, value]) => (
                    <tr key={key} className="border-b border-neutral-50 last:border-b-0">
                      <td className="py-2 pr-8 font-medium text-neutral-700">{key}</td>
                      <td className="py-2 text-neutral-600">{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fees */}
      {j.fees && Object.keys(j.fees).length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Fees</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="pb-2 pr-8 text-left text-xs font-medium text-neutral-500">Fee Type</th>
                  <th className="pb-2 text-left text-xs font-medium text-neutral-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(j.fees).map(([key, value]) => (
                  <tr key={key} className="border-b border-neutral-50 last:border-b-0">
                    <td className="py-2 pr-8 font-medium text-neutral-700">{key}</td>
                    <td className="py-2 text-neutral-600">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requirements */}
      {j.requirements && j.requirements.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Requirements</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {j.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {j.notes && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Notes</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 whitespace-pre-wrap">
            {j.notes}
          </p>
        </div>
      )}

      {/* Child Jurisdictions */}
      {j.children && j.children.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Child Jurisdictions ({j.children.length})
            </h2>
          </div>
          <div className="mt-4 divide-y divide-neutral-100">
            {j.children.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/jurisdictions/${child.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-900">
                    {child.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      TYPE_BADGE_COLORS[child.type] ?? "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {JURISDICTION_TYPE_LABELS[child.type as JurisdictionType] ?? child.type}
                  </span>
                </div>
                {child.county && (
                  <span className="text-xs text-neutral-400">{child.county} County</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
