"use client";

import { useState, useEffect } from "react";
import { X, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  steps: WorkflowStep[];
}

interface WorkflowPickerProps {
  permitId: string;
  onApplied: () => void;
  onClose: () => void;
}

export function WorkflowPicker({
  permitId,
  onApplied,
  onClose,
}: WorkflowPickerProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) {
        throw new Error("Failed to fetch workflows");
      }
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyWorkflow = async () => {
    if (!selectedTemplate) return;

    setApplying(true);
    setError("");

    try {
      const res = await fetch(`/api/permits/${permitId}/apply-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply workflow");
      }

      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply workflow");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            Apply Workflow Template
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">Loading workflows...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center">
              <List className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">
                No workflow templates available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "text-left p-4 rounded-lg border-2 transition-all hover:shadow-md",
                      selectedTemplate?.id === template.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    )}
                  >
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-neutral-600 mb-2">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {template.steps.length} step
                      {template.steps.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>

              {/* Steps Preview */}
              {selectedTemplate && (
                <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <h4 className="font-medium text-neutral-900 mb-3">
                    Steps Preview
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.steps
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((step, index) => (
                        <div
                          key={step.id}
                          className="flex gap-3 p-3 rounded-md bg-white border border-neutral-200"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900">
                              {step.title}
                            </p>
                            {step.description && (
                              <p className="text-xs text-neutral-600 mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-200 bg-white px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyWorkflow}
            disabled={!selectedTemplate || applying}
          >
            {applying ? "Applying..." : "Apply Workflow"}
          </Button>
        </div>
      </div>
    </div>
  );
}
