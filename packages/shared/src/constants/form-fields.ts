export const FORM_FIELD_TYPES = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  NUMBER: "NUMBER",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  DATE: "DATE",
  SELECT: "SELECT",
  MULTI_SELECT: "MULTI_SELECT",
  CHECKBOX: "CHECKBOX",
  RADIO: "RADIO",
  FILE: "FILE",
  ADDRESS: "ADDRESS",
  SIGNATURE: "SIGNATURE",
} as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[keyof typeof FORM_FIELD_TYPES];

export const FORM_FIELD_LABELS: Record<FormFieldType, string> = {
  TEXT: "Text Input",
  TEXTAREA: "Text Area",
  NUMBER: "Number",
  EMAIL: "Email",
  PHONE: "Phone Number",
  DATE: "Date",
  SELECT: "Dropdown Select",
  MULTI_SELECT: "Multi Select",
  CHECKBOX: "Checkbox",
  RADIO: "Radio Buttons",
  FILE: "File Upload",
  ADDRESS: "Address",
  SIGNATURE: "Signature",
};

export const FORM_SUBMISSION_STATUSES = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type FormSubmissionStatus =
  (typeof FORM_SUBMISSION_STATUSES)[keyof typeof FORM_SUBMISSION_STATUSES];

export const FORM_SUBMISSION_STATUS_LABELS: Record<FormSubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Form field interface
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  conditionalOn?: {
    fieldId: string;
    value: string | boolean;
  };
  defaultValue?: string | number | boolean;
  helpText?: string;
}

// Form section
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// Complete form schema
export interface FormSchema {
  sections: FormSection[];
}
