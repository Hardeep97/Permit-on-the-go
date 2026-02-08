import { z } from "zod";

export const createFormTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  subcodeType: z.enum(["BUILDING", "PLUMBING", "ELECTRICAL", "FIRE", "ZONING", "MECHANICAL"]),
  jurisdictionId: z.string().optional(),
  schema: z.any(), // JSON form schema
  uiSchema: z.any().optional(), // Optional UI hints
  defaultValues: z.any().optional(), // Default field values
});

export const submitFormSchema = z.object({
  templateId: z.string().min(1, "Form template is required"),
  data: z.record(z.any()), // Form data as key-value pairs
  status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
});

export const updateFormSubmissionSchema = z.object({
  data: z.record(z.any()).optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
});

export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type UpdateFormSubmissionInput = z.infer<typeof updateFormSubmissionSchema>;
