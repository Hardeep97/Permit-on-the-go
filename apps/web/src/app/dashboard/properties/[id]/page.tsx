"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ClipboardCheck,
  Plus,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Hash,
  Home,
  Ruler,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/permit/StatusBadge";
import { SubcodeBadge } from "@/components/permit/SubcodeBadge";
import {
  PROPERTY_TYPE_LABELS,
  type PropertyType,
  getStateName,
} from "@permits/shared";

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  county?: string;
  state: string;
  zipCode: string;
  propertyType: string;
  blockLot?: string;
  yearBuilt?: number;
  squareFeet?: number;
  units: number;
  zoneDesignation?: string;
  status: string;
  createdAt: string;
  jurisdiction?: {
    id: string;
    name: string;
    type: string;
    state: string;
    phone?: string;
    email?: string;
    permitPortalUrl?: string;
  };
  permits?: Array<{
    id: string;
    title: string;
    status: string;
    subcodeType: string;
    createdAt: string;
  }>;
  _count?: {
    permits: number;
    documents: number;
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

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) throw new Error("Failed to load property");
      const json = await res.json();
      setProperty(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-neutral-700">
          {error ?? "Property not found"}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" onClick={fetchProperty}>
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
          <Link href="/dashboard/properties">
            <Button variant="ghost">Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/properties"
            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {property.name}
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {property.address}, {property.city},{" "}
                {getStateName(property.state) ?? property.state}{" "}
                {property.zipCode}
              </span>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/permits/new?propertyId=${property.id}`}>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Permit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Property info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-400" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-900">
                    <Home className="h-3.5 w-3.5 text-neutral-400" />
                    {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ??
                      property.propertyType}
                  </dd>
                </div>
                {property.blockLot && (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Block / Lot
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-900">
                      <Hash className="h-3.5 w-3.5 text-neutral-400" />
                      {property.blockLot}
                    </dd>
                  </div>
                )}
                {property.yearBuilt && (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Year Built
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-900">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {property.yearBuilt}
                    </dd>
                  </div>
                )}
                {property.squareFeet && (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Square Feet
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-900">
                      <Ruler className="h-3.5 w-3.5 text-neutral-400" />
                      {property.squareFeet.toLocaleString()} sq ft
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Units
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-900">
                    <Layers className="h-3.5 w-3.5 text-neutral-400" />
                    {property.units}
                  </dd>
                </div>
                {property.county && (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      County
                    </dt>
                    <dd className="mt-0.5 text-sm text-neutral-900">
                      {property.county}
                    </dd>
                  </div>
                )}
                {property.zoneDesignation && (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Zone Designation
                    </dt>
                    <dd className="mt-0.5 text-sm text-neutral-900">
                      {property.zoneDesignation}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Jurisdiction */}
          {property.jurisdiction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  Jurisdiction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {property.jurisdiction.name}
                </p>
                <p className="text-xs text-neutral-400 capitalize">
                  {property.jurisdiction.type.toLowerCase()}
                </p>
                {property.jurisdiction.permitPortalUrl && (
                  <a
                    href={property.jurisdiction.permitPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                  >
                    Permit Portal
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Permits for this property */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-neutral-400" />
                  Permits ({property._count?.permits ?? 0})
                </CardTitle>
                <Link href={`/dashboard/permits/new?propertyId=${property.id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3" />
                    New Permit
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!property.permits || property.permits.length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No permits yet
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Create a permit for this property to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.permits.map((permit) => (
                    <Link
                      key={permit.id}
                      href={`/dashboard/permits/${permit.id}`}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-50">
                          <ClipboardCheck className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {permit.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <SubcodeBadge subcodeType={permit.subcodeType} />
                            <span className="text-xs text-neutral-400">
                              {formatDate(permit.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={permit.status} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
