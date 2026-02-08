"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Shield,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  isVerified: boolean;
  _count?: {
    properties: number;
    permits: number;
  };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-neutral-200" />
          <div className="h-5 w-16 rounded-full bg-neutral-100" />
        </div>
        <div className="h-4 w-32 rounded bg-neutral-100" />
        <div className="h-4 w-24 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

export default function JurisdictionsPage() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [stateFilter, setStateFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const fetchJurisdictions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter) params.set("type", typeFilter);
      params.set("page", page.toString());
      params.set("pageSize", "25");

      const res = await fetch(`/api/jurisdictions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setJurisdictions(json.data?.jurisdictions ?? []);
        setPagination(json.data?.pagination ?? null);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [stateFilter, searchQuery, typeFilter, page]);

  useEffect(() => {
    fetchJurisdictions();
  }, [fetchJurisdictions]);

  const handleStateChange = (value: string) => {
    setStateFilter(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const getStateName = (code: string) => {
    return US_STATES.find((s) => s.code === code)?.name ?? code;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Jurisdictions</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Browse and search jurisdictions across the United States. Find contact
          information, permit portals, and requirements.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* State selector */}
        <select
          value={stateFilter}
          onChange={(e) => handleStateChange(e.target.value)}
          className="flex h-10 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:w-48"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search jurisdictions by name..."
            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white pl-10 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="flex h-10 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:w-44"
        >
          <option value="">All Types</option>
          {Object.entries(JURISDICTION_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : jurisdictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-16 shadow-sm">
          <Building2 className="h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm font-medium text-neutral-500">
            No jurisdictions found
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jurisdictions.map((j) => (
            <Link
              key={j.id}
              href={`/dashboard/jurisdictions/${j.id}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  {j.name}
                </h3>
                <span
                  className={cn(
                    "inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    TYPE_BADGE_COLORS[j.type] ?? "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {JURISDICTION_TYPE_LABELS[j.type as JurisdictionType] ?? j.type}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                  <span>
                    {getStateName(j.state)}
                    {j.county ? ` \u00B7 ${j.county} County` : ""}
                  </span>
                </div>

                {j.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    <span>{j.phone}</span>
                  </div>
                )}

                {j.email && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    <span className="truncate">{j.email}</span>
                  </div>
                )}
              </div>

              {j.isVerified && (
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-green-600">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Verified</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-sm text-neutral-500">
            Page {pagination.page} of {pagination.totalPages}{" "}
            <span className="text-neutral-400">
              ({pagination.total} total)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pagination.page <= 1
                  ? "cursor-not-allowed text-neutral-300"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pagination.page >= pagination.totalPages
                  ? "cursor-not-allowed text-neutral-300"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
