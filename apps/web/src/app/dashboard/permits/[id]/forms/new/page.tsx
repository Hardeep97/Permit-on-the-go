"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  subcodeType: string;
  version: string;
  jurisdiction: { id: string; name: string; state: string } | null;
}

const SUBCODE_ICONS: Record<string, string> = {
  BUILDING: "🏗️",
  PLUMBING: "🔧",
  ELECTRICAL: "⚡",
  FIRE: "🔥",
  ZONING: "🗺️",
  MECHANICAL: "⚙️",
};

export default function NewFormPage() {
  const { id: permitId } = useParams<{ id: string }>();
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/form-templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const json = await res.json();
      setTemplates(json.data ?? []);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const startForm = async (templateId: string) => {
    setCreating(templateId);
    try {
      const res = await fetch(`/api/permits/${permitId}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          data: {},
          status: "DRAFT",
        }),
      });

      if (!res.ok) throw new Error("Failed to create form");
      const json = await res.json();
      router.push(`/dashboard/permits/${permitId}/forms/${json.data.id}`);
    } catch {
      alert("Failed to start form. Please try again.");
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <button
        onClick={() => router.push(`/dashboard/permits/${permitId}/forms`)}
        className="mb-4 text-sm text-primary-600 hover:underline"
      >
        &larr; Back to Forms
      </button>

      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Select a Form Template
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Choose the subcode application form to fill out for this permit.
      </p>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-neutral-500">
              No form templates available. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {SUBCODE_ICONS[tmpl.subcodeType] || "📋"}
                  </span>
                  <CardTitle className="text-base">{tmpl.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tmpl.description && (
                  <p className="mb-3 text-xs text-neutral-500">
                    {tmpl.description}
                  </p>
                )}
                <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400">
                  <span>Subcode: {tmpl.subcodeType}</span>
                  <span>v{tmpl.version}</span>
                  {tmpl.jurisdiction && (
                    <span>{tmpl.jurisdiction.name}</span>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => startForm(tmpl.id)}
                  disabled={creating === tmpl.id}
                >
                  {creating === tmpl.id ? "Starting..." : "Start This Form"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
