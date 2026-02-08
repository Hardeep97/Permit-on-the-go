"use client";

import { Input } from "@/components/ui/input";

interface FormFieldOption {
  field: string;
  value: unknown;
}

interface FormFieldProps {
  field: {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    helpText?: string;
    conditionalOn?: FormFieldOption;
    defaultValue?: unknown;
  };
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  allValues: Record<string, unknown>;
  error?: string;
}

export function FormFieldComponent({
  field,
  value,
  onChange,
  allValues,
  error,
}: FormFieldProps) {
  // Check conditional visibility
  if (field.conditionalOn) {
    const depValue = allValues[field.conditionalOn.field];
    if (depValue !== field.conditionalOn.value) {
      return null;
    }
  }

  const inputClasses =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50";

  const renderField = () => {
    switch (field.type) {
      case "TEXT":
      case "PHONE":
      case "EMAIL":
      case "ADDRESS":
        return (
          <Input
            type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            className={inputClasses}
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => onChange(field.id, e.target.value ? Number(e.target.value) : "")}
            placeholder={field.placeholder || ""}
            className={inputClasses}
          />
        );

      case "DATE":
        return (
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={inputClasses}
          />
        );

      case "TEXTAREA":
        return (
          <textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            rows={4}
            className={inputClasses + " resize-y"}
          />
        );

      case "SELECT":
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={inputClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "MULTI_SELECT":
        return (
          <div className="mt-1 space-y-1">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) ? value : [];
              const isChecked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newVal = isChecked
                        ? selected.filter((v: string) => v !== opt)
                        : [...selected, opt];
                      onChange(field.id, newVal);
                    }}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );

      case "CHECKBOX":
        return (
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.id, e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600"
            />
            {field.label}
          </label>
        );

      case "RADIO":
        return (
          <div className="mt-1 space-y-1">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(field.id, opt)}
                  className="h-4 w-4 border-neutral-300 text-primary-600"
                />
                {opt}
              </label>
            ))}
          </div>
        );

      case "SIGNATURE":
        return (
          <div className="mt-1">
            <Input
              type="text"
              value={(value as string) || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="Type your full name as signature"
              className={inputClasses + " italic"}
            />
            <p className="mt-1 text-xs text-neutral-400">
              By typing your name, you agree this serves as your electronic signature.
            </p>
          </div>
        );

      case "FILE":
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(field.id, file?.name || "");
            }}
            className={inputClasses}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {field.type !== "CHECKBOX" && (
        <label className="block text-sm font-medium text-neutral-700">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {renderField()}
      {field.helpText && (
        <p className="text-xs text-neutral-400">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
