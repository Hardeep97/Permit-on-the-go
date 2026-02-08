"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormRenderer } from "@/components/forms/FormRenderer";
import { Button } from "@/components/ui/button";

interface FormSubmission {
  id: string;
  status: string;
  data: Record<string, unknown>;
  template: {
    id: string;
    name: string;
    subcodeType: string;
    schema: {
      sections: {
        id: string;
        title: string;
        description?: string;
        fields: {
          id: string;
          type: string;
          label: string;
          placeholder?: string;
          required?: boolean;
          options?: string[];
          helpText?: string;
          conditionalOn?: { field: string; value: unknown };
          defaultValue?: unknown;
        }[];
      }[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function FormSubmissionPage() {
  const { id: permitId, formId } = useParams<{ id: string; formId: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/permits/${permitId}/forms/${formId}`);
      if (!res.ok) throw new Error("Failed to load form");
      const json = await res.json();
      setSubmission(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [permitId, formId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/permits/${permitId}/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, status: "DRAFT" }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMessage("Draft saved successfully");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/permits/${permitId}/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, status: "SUBMITTED" }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      router.push(`/dashboard/permits/${permitId}/forms`);
    } catch {
      alert("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-neutral-200" />
          <div className="h-12 rounded bg-neutral-200" />
          <div className="h-64 rounded-xl bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Form not found"}</p>
          <Button className="mt-4" onClick={fetchSubmission}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isReadOnly = submission.status !== "DRAFT";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <button
        onClick={() => router.push(`/dashboard/permits/${permitId}/forms`)}
        className="mb-4 text-sm text-primary-600 hover:underline"
      >
        &larr; Back to Forms
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {submission.template.name}
        </h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
          <span>Subcode: {submission.template.subcodeType}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              submission.status === "DRAFT"
                ? "bg-neutral-100 text-neutral-700"
                : submission.status === "SUBMITTED"
                  ? "bg-blue-100 text-blue-700"
                  : submission.status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
          >
            {submission.status}
          </span>
        </div>
        {isReadOnly && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            This form has been submitted and is read-only.
          </p>
        )}
      </div>

      {saveMessage && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            saveMessage.includes("Failed")
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <FormRenderer
        schema={submission.template.schema}
        initialData={submission.data}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        readOnly={isReadOnly}
        saving={saving}
        submitting={submitting}
      />
    </div>
  );
}
