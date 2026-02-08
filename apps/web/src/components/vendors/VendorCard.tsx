"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { VendorRating } from "./VendorRating";
import { VENDOR_SPECIALTY_LABELS } from "@permits/shared";
import { cn } from "@/lib/utils";

interface VendorCardProps {
  vendor: {
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
  };
}

export function VendorCard({ vendor }: VendorCardProps) {
  const displayedSpecialties = vendor.specialties.slice(0, 3);
  const remainingCount = vendor.specialties.length - 3;

  return (
    <Link
      href={`/dashboard/vendors/${vendor.id}`}
      className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-lg font-semibold text-primary-700">
          {vendor.logoUrl ? (
            <img
              src={vendor.logoUrl}
              alt={vendor.companyName}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            vendor.companyName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Company info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              {vendor.companyName}
            </h3>
            {vendor.isVerified && (
              <Shield className="h-4 w-4 flex-shrink-0 text-green-600" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <VendorRating rating={vendor.rating} size="sm" />
            <span className="text-xs text-neutral-500">
              ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {vendor.description && (
        <p className="mt-3 line-clamp-2 text-sm text-neutral-600">
          {vendor.description}
        </p>
      )}

      {/* Specialties */}
      {vendor.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {displayedSpecialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
            >
              {VENDOR_SPECIALTY_LABELS[specialty as keyof typeof VENDOR_SPECIALTY_LABELS] || specialty}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              +{remainingCount} more
            </span>
          )}
        </div>
      )}

      {/* Service areas */}
      {vendor.serviceAreas.length > 0 && (
        <p className="mt-3 truncate text-xs text-neutral-500">
          <span className="font-medium">Service areas:</span>{" "}
          {vendor.serviceAreas.join(", ")}
        </p>
      )}
    </Link>
  );
}
