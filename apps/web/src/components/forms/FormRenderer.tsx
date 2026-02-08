"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormFieldComponent } from "./FormField";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  conditionalOn?: { field: string; value: unknown };
  defaultValue?: unknown;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormSchema {
  sections: FormSection[];
}

interface FormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, unknown>;
  onSaveDraft: (data: Record<string, unknown>) => Promise<void>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  readOnly?: boolean;
  saving?: boolean;
  submitting?: boolean;
}

export function FormRenderer({
  schema,
  initialData = {},
  onSaveDraft,
  onSubmit,
  readOnly = false,
  saving = false,
  submitting = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [activeSection, setActiveSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (id: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when field is modified
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = schema.sections[sectionIndex];
    const newErrors: Record<string, string> = {};

    for (const field of section.fields) {
      // Skip validation for hidden conditional fields
      if (field.conditionalOn) {
        const depValue = formData[field.conditionalOn.field];
        if (depValue !== field.conditionalOn.value) continue;
      }

      if (field.required) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === "" || val === false) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = (): boolean => {
    const allErrors: Record<string, string> = {};

    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.conditionalOn) {
          const depValue = formData[field.conditionalOn.field];
          if (depValue !== field.conditionalOn.value) continue;
        }

        if (field.required) {
          const val = formData[field.id];
          if (val === undefined || val === null || val === "" || val === false) {
            allErrors[field.id] = `${field.label} is required`;
          }
        }
      }
    }

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(activeSection)) {
      setActiveSection((prev) => Math.min(prev + 1, schema.sections.length - 1));
    }
  };

  const handlePrev = () => {
    setActiveSection((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (validateAll()) {
      await onSubmit(formData);
    } else {
      // Find first section with errors
      for (let i = 0; i < schema.sections.length; i++) {
        const section = schema.sections[i];
        for (const field of section.fields) {
          if (errors[field.id]) {
            setActiveSection(i);
            return;
          }
        }
      }
    }
  };

  const currentSection = schema.sections[activeSection];
  const isLastSection = activeSection === schema.sections.length - 1;
  const isFirstSection = activeSection === 0;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {schema.sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === activeSection
                ? "bg-primary-600 text-white"
                : i < activeSection
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {i < activeSection ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle>{currentSection.title}</CardTitle>
          {currentSection.description && (
            <p className="text-sm text-neutral-500">{currentSection.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {currentSection.fields.map((field) => (
              <div
                key={field.id}
                className={
                  field.type === "TEXTAREA" || field.type === "ADDRESS"
                    ? "sm:col-span-2"
                    : ""
                }
              >
                <FormFieldComponent
                  field={field}
                  value={formData[field.id]}
                  onChange={handleFieldChange}
                  allValues={formData}
                  error={errors[field.id]}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div>
            {!isFirstSection && (
              <Button variant="outline" onClick={handlePrev}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onSaveDraft(formData)}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            {isLastSection ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Form"}
              </Button>
            ) : (
              <Button onClick={handleNext}>Next Section</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
