"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  createPermitSchema,
  PROJECT_TYPE_LABELS,
  SUBCODE_LABELS,
  type CreatePermitInput,
} from "@permits/shared";

interface PropertyOption {
  id: string;
  name: string;
  address: string;
}

export default function NewPermitPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePermitInput>({
    resolver: zodResolver(createPermitSchema),
    defaultValues: {
      priority: "NORMAL",
    },
  });

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties?pageSize=100");
        if (res.ok) {
          const json = await res.json();
          setProperties(
            (json.data?.properties ?? []).map(
              (p: { id: string; name: string; address: string }) => ({
                id: p.id,
                name: p.name,
                address: p.address,
              })
            )
          );
        }
      } catch {
        // Properties will remain empty; user can still see an empty select
      } finally {
        setLoadingProperties(false);
      }
    }
    loadProperties();
  }, []);

  const onSubmit = async (data: CreatePermitInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create permit");
      }

      const json = await res.json();
      const permit = json.data;
      router.push(`/dashboard/permits/${permit.id}`);
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
          href="/dashboard/permits"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Create New Permit
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Fill in the details to start a new permit application.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
            <CardDescription>
              Provide the basic information for your permit application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("title")}
                placeholder="e.g., Kitchen Renovation Permit"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Describe the scope of work..."
                className="flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Property <span className="text-red-500">*</span>
              </label>
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-neutral-400 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading properties...
                </div>
              ) : properties.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  No properties found. Please{" "}
                  <Link
                    href="/dashboard/properties/new"
                    className="font-medium underline"
                  >
                    add a property
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  {...register("propertyId")}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select a property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.address}
                    </option>
                  ))}
                </select>
              )}
              {errors.propertyId && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.propertyId.message}
                </p>
              )}
            </div>

            {/* Project Type + Subcode Type row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("projectType")}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select type...</option>
                  {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.projectType && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.projectType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Subcode Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("subcodeType")}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select subcode...</option>
                  {Object.entries(SUBCODE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.subcodeType && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.subcodeType.message}
                  </p>
                )}
              </div>
            </div>

            {/* Priority + Estimated Value */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Priority
                </label>
                <select
                  {...register("priority")}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Estimated Value ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("estimatedValue", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.estimatedValue && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.estimatedValue.message}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={2}
                placeholder="Any additional notes..."
                className="flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
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
            <Link href="/dashboard/permits">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Permit"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
