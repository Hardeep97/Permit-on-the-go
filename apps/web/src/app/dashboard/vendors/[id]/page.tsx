"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Globe,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorRating } from "@/components/vendors/VendorRating";
import { ReviewForm } from "@/components/vendors/ReviewForm";
import {
  VENDOR_SPECIALTY_LABELS,
  SUBCODE_LABELS,
  INSURANCE_TYPE_LABELS,
} from "@permits/shared";
import { cn } from "@/lib/utils";

interface VendorData {
  id: string;
  companyName: string;
  description: string | null;
  specialties: string[];
  serviceAreas: string[];
  website: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  logoUrl: string | null;
  userId: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  licenses: Array<{
    id: string;
    subcodeType: string;
    licenseNumber: string;
    state: string;
    issuedDate: string;
    expiryDate: string;
    isVerified: boolean;
  }>;
  insurance: Array<{
    id: string;
    type: string;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: string;
  }>;
  photos: Array<{
    id: string;
    fileUrl: string;
    caption: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      name: string;
      avatarUrl: string | null;
    };
  }>;
}

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (!res.ok) throw new Error("Failed to load vendor");

      const data: VendorData = await res.json();
      setVendor(data);

      // Try to get current user ID (simple check, you may have a better auth solution)
      const authRes = await fetch("/api/auth/session");
      if (authRes.ok) {
        const session = await authRes.json();
        setCurrentUserId(session?.user?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm font-medium text-red-700">
          {error || "Vendor not found"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/vendors")}
          className="mt-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === vendor.userId;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/vendors")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Button>

      {/* Vendor header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-2xl font-semibold text-primary-700">
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

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">
                {vendor.companyName}
              </h1>
              {vendor.isVerified && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Verified
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-4">
              <VendorRating rating={vendor.rating} size="md" showValue />
              <span className="text-sm text-neutral-500">
                {vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            {vendor.website && (
              <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <Globe className="h-4 w-4" />
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {vendor.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="mt-6 text-neutral-700">{vendor.description}</p>
        )}

        {/* Specialties */}
        {vendor.specialties.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-900">Specialties</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {vendor.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                >
                  {VENDOR_SPECIALTY_LABELS[specialty as keyof typeof VENDOR_SPECIALTY_LABELS] || specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Service areas */}
        {vendor.serviceAreas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service Areas
            </h3>
            <p className="mt-2 text-sm text-neutral-700">
              {vendor.serviceAreas.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Licenses section */}
      {vendor.licenses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Licenses & Certifications
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vendor.licenses.map((license) => (
              <div
                key={license.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <h3 className="font-semibold text-neutral-900">
                      {SUBCODE_LABELS[license.subcodeType as keyof typeof SUBCODE_LABELS] || license.subcodeType}
                    </h3>
                  </div>
                  {license.isVerified && (
                    <Shield className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-neutral-600">
                    <span className="font-medium">License #:</span> {license.licenseNumber}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">State:</span> {license.state}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(license.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance section */}
      {vendor.insurance.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Insurance Coverage
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vendor.insurance.map((ins) => (
              <div
                key={ins.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <h3 className="font-semibold text-neutral-900">
                  {INSURANCE_TYPE_LABELS[ins.type as keyof typeof INSURANCE_TYPE_LABELS] || ins.type}
                </h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-neutral-600">
                    <span className="font-medium">Provider:</span> {ins.provider}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">Policy #:</span> {ins.policyNumber}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">Coverage:</span> $
                    {ins.coverageAmount.toLocaleString()}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(ins.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos section */}
      {vendor.photos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Portfolio
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {vendor.photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
              >
                <img
                  src={photo.fileUrl}
                  alt={photo.caption || "Portfolio image"}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Reviews
        </h2>

        {vendor.reviews.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {vendor.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
                    {review.reviewer.avatarUrl ? (
                      <img
                        src={review.reviewer.avatarUrl}
                        alt={review.reviewer.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      review.reviewer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-neutral-900">
                        {review.reviewer.name}
                      </p>
                      <VendorRating rating={review.rating} size="sm" />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {review.comment && (
                      <p className="mt-2 text-sm text-neutral-700">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leave a review form (only if not own profile) */}
        {!isOwnProfile && (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">
              Leave a Review
            </h3>
            <ReviewForm vendorId={vendor.id} onSubmitted={fetchVendor} />
          </div>
        )}
      </div>
    </div>
  );
}
