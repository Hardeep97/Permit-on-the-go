"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MapPin,
  ClipboardCheck,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from "@permits/shared";

interface PropertyItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  createdAt: string;
  jurisdiction?: {
    id: string;
    name: string;
    type: string;
  };
  _count?: {
    permits: number;
    documents: number;
  };
}

function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-lg bg-neutral-200" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-full rounded bg-neutral-100" />
      <div className="mt-4 h-8 w-1/2 rounded bg-neutral-100" />
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("pageSize", "50");

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load properties");
      const json = await res.json();
      setProperties(json.data?.properties ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Properties</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage all your properties and their associated permits.
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search properties..."
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

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProperties}
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
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm font-medium text-neutral-600">
            No properties found
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {searchQuery
              ? "Try a different search term."
              : "Get started by adding your first property."}
          </p>
          {!searchQuery && (
            <Link href="/dashboard/properties/new">
              <Button size="sm" className="mt-4">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Properties grid */}
      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ??
                    property.propertyType}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                {property.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {property.address}, {property.city}, {property.state}{" "}
                  {property.zipCode}
                </span>
              </div>
              {property.jurisdiction && (
                <p className="mt-1 text-xs text-neutral-400">
                  {property.jurisdiction.name}
                </p>
              )}
              <div className="mt-4 flex items-center gap-1.5 rounded-md bg-neutral-50 px-3 py-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-600">
                  {property._count?.permits ?? 0} permit
                  {(property._count?.permits ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
