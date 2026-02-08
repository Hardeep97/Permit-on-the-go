"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/permit/StatusBadge";
import { SubcodeBadge } from "@/components/permit/SubcodeBadge";
import {
  PERMIT_STATUS_LABELS,
  SUBCODE_LABELS,
  type PermitStatus,
  type SubcodeType,
} from "@permits/shared";

interface PermitItem {
  id: string;
  title: string;
  permitNumber?: string;
  internalRef: string;
  status: string;
  subcodeType: string;
  projectType: string;
  priority: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  _count?: {
    milestones: number;
    documents: number;
    photos: number;
    inspections: number;
  };
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PermitCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/4 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-neutral-200" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-4 w-24 rounded bg-neutral-100" />
        <div className="h-4 w-24 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

export default function PermitsPage() {
  const [permits, setPermits] = useState<PermitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [subcodeFilter, setSubcodeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (subcodeFilter) params.set("subcodeType", subcodeFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("pageSize", "50");

      const res = await fetch(`/api/permits?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load permits");
      }
      const json = await res.json();
      setPermits(json.data?.permits ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, subcodeFilter, searchQuery]);

  useEffect(() => {
    fetchPermits();
  }, [fetchPermits]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Permits</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track and manage all your property permits.
          </p>
        </div>
        <Link href="/dashboard/permits/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Permit
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(PERMIT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={subcodeFilter}
          onChange={(e) => setSubcodeFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Subcodes</option>
          {Object.entries(SUBCODE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search permits..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPermits}
            className="mt-3"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PermitCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && permits.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <ClipboardCheck className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm font-medium text-neutral-600">
            No permits found
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {searchQuery || statusFilter || subcodeFilter
              ? "Try adjusting your filters or search terms."
              : "Get started by creating your first permit."}
          </p>
          {!searchQuery && !statusFilter && !subcodeFilter && (
            <Link href="/dashboard/permits/new">
              <Button size="sm" className="mt-4">
                <Plus className="h-4 w-4" />
                Create Permit
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Permits grid */}
      {!loading && !error && permits.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {permits.map((permit) => (
            <Link
              key={permit.id}
              href={`/dashboard/permits/${permit.id}`}
              className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {permit.title}
                  </h3>
                  {permit.permitNumber && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                      <Hash className="h-3 w-3" />
                      <span>{permit.permitNumber}</span>
                    </div>
                  )}
                </div>
                <StatusBadge status={permit.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SubcodeBadge subcodeType={permit.subcodeType} />
              </div>

              {permit.property && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{permit.property.name}</span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                {permit.submittedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Submitted {formatDate(permit.submittedAt)}</span>
                  </div>
                )}
                {permit.approvedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Approved {formatDate(permit.approvedAt)}</span>
                  </div>
                )}
                {!permit.submittedAt && !permit.approvedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(permit.createdAt)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
