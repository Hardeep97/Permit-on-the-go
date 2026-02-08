"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  createPropertySchema,
  US_STATES,
  PROPERTY_TYPE_LABELS,
  type CreatePropertyInput,
} from "@permits/shared";

export default function NewPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      propertyType: "RESIDENTIAL",
      units: 1,
    },
  });

  const onSubmit = async (data: CreatePropertyInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create property");
      }

      router.push("/dashboard/properties");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/properties"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Add New Property
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Register a new property to manage its permits.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>
              Enter the address and details for your property.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Property Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("name")}
                placeholder="e.g., Sunset Apartments"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("address")}
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* City + County row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <Input {...register("city")} placeholder="City" />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  County
                </label>
                <Input {...register("county")} placeholder="County" />
              </div>
            </div>

            {/* State + Zip Code */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("state")}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select state...</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("zipCode")}
                  placeholder="12345"
                  maxLength={10}
                />
                {errors.zipCode && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.zipCode.message}
                  </p>
                )}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Property Type
              </label>
              <select
                {...register("propertyType")}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Block/Lot + Year Built */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Block / Lot
                </label>
                <Input
                  {...register("blockLot")}
                  placeholder="e.g., 1234 / 56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Year Built
                </label>
                <Input
                  type="number"
                  {...register("yearBuilt", { valueAsNumber: true })}
                  placeholder="2000"
                  min={1600}
                  max={new Date().getFullYear()}
                />
                {errors.yearBuilt && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.yearBuilt.message}
                  </p>
                )}
              </div>
            </div>

            {/* Square Feet + Units */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Square Feet
                </label>
                <Input
                  type="number"
                  {...register("squareFeet", { valueAsNumber: true })}
                  placeholder="0"
                  min={0}
                />
                {errors.squareFeet && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.squareFeet.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Units
                </label>
                <Input
                  type="number"
                  {...register("units", { valueAsNumber: true })}
                  placeholder="1"
                  min={1}
                />
                {errors.units && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.units.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {submitError}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Link href="/dashboard/properties">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Add Property"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
