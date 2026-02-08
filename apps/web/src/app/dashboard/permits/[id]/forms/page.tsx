"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FormSubmission {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    subcodeType: string;
    version: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function PermitFormsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/permits/${id}/forms`);
      if (!res.ok) throw new Error("Failed to load forms");
      const json = await res.json();
      setSubmissions(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          <div className="h-32 rounded-xl bg-neutral-200" />
          <div className="h-32 rounded-xl bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button className="mt-4" onClick={fetchSubmissions}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push(`/dashboard/permits/${id}`)}
            className="mb-2 text-sm text-primary-600 hover:underline"
          >
            &larr; Back to Permit
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">Permit Forms</h1>
          <p className="text-sm text-neutral-500">
            Fill out and manage subcode application forms for this permit.
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/permits/${id}/forms/new`)}>
          New Form
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500">No forms yet for this permit.</p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/dashboard/permits/${id}/forms/new`)}
            >
              Start a New Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <Card
              key={sub.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/dashboard/permits/${id}/forms/${sub.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{sub.template.name}</CardTitle>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[sub.status] || STATUS_COLORS.DRAFT}`}
                  >
                    {sub.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>Subcode: {sub.template.subcodeType}</span>
                  <span>Version: {sub.template.version}</span>
                  <span>
                    Updated: {new Date(sub.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
