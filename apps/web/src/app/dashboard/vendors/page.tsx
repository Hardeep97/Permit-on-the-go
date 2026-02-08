"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VendorCard } from "@/components/vendors/VendorCard";
import { SUBCODE_LABELS } from "@permits/shared";

interface VendorItem {
  id: string;
  companyName: string;
  description: string | null;
  specialties: string[];
  serviceAreas: string[];
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  logoUrl: string | null;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

interface VendorsResponse {
  vendors: VendorItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function VendorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-neutral-200" />
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-neutral-100" />
        </div>
      </div>
      <div className="mt-3 h-10 w-full rounded bg-neutral-100" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-neutral-100" />
        <div className="h-6 w-20 rounded-full bg-neutral-100" />
      </div>
    </div>
  );
}

export default function VendorMarketplacePage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subcodeType, setSubcodeType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (subcodeType) params.set("subcodeType", subcodeType);
      if (verifiedOnly) params.set("isVerified", "true");
      if (minRating !== undefined) params.set("minRating", minRating.toString());
      params.set("page", page.toString());
      params.set("pageSize", "12");

      const res = await fetch(`/api/vendors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load vendors");

      const json = await res.json();
      const responseData: VendorsResponse = json.data ?? {};
      setVendors(responseData.vendors ?? []);
      setTotalPages(responseData.totalPages ?? 1);
      setTotal(responseData.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, subcodeType, verifiedOnly, minRating, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Vendor Marketplace
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Find verified contractors and service providers for your projects.
          </p>
        </div>
        <Link href="/dashboard/vendor-portal">
          <Button>
            <Plus className="h-4 w-4" />
            Become a Vendor
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search vendors..."
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Subcode type filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Trade:
          </label>
          <select
            value={subcodeType}
            onChange={(e) => {
              setSubcodeType(e.target.value);
              handleFilterChange();
            }}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Trades</option>
            {Object.entries(SUBCODE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Verified only toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              handleFilterChange();
            }}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
          <span className="text-sm font-medium text-neutral-700">
            Verified only
          </span>
        </label>

        {/* Minimum rating filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Min rating:
          </label>
          <select
            value={minRating ?? ""}
            onChange={(e) => {
              setMinRating(e.target.value ? Number(e.target.value) : undefined);
              handleFilterChange();
            }}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Any</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-neutral-600">
          {total} {total === 1 ? "vendor" : "vendors"} found
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVendors}
            className="mt-3"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VendorCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && vendors.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <Search className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm font-medium text-neutral-600">
            No vendors found
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Vendors grid */}
      {!loading && !error && vendors.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
              <p className="text-sm text-neutral-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
