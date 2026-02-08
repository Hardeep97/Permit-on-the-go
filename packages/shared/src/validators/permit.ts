import { z } from "zod";

export const createPermitSchema = z.object({
  title: z.string().min(1, "Permit title is required"),
  description: z.string().optional(),
  propertyId: z.string().min(1, "Property is required"),
  projectType: z.enum([
    "NEW_CONSTRUCTION",
    "RENOVATION",
    "ADDITION",
    "DEMOLITION",
    "CHANGE_OF_USE",
    "INTERIOR_ALTERATION",
    "REPAIR",
    "ACCESSORY_STRUCTURE",
  ]),
  subcodeType: z.enum([
    "BUILDING",
    "PLUMBING",
    "ELECTRICAL",
    "FIRE",
    "ZONING",
    "MECHANICAL",
  ]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  estimatedValue: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updatePermitSchema = createPermitSchema.partial().extend({
  status: z
    .enum([
      "DRAFT",
      "READY_TO_SUBMIT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "CORRECTIONS_NEEDED",
      "RESUBMITTED",
      "APPROVED",
      "PERMIT_ISSUED",
      "INSPECTION_SCHEDULED",
      "INSPECTION_PASSED",
      "INSPECTION_FAILED",
      "CERTIFICATE_OF_OCCUPANCY",
      "CLOSED",
      "EXPIRED",
      "DENIED",
    ])
    .optional(),
  permitNumber: z.string().optional(),
  permitFee: z.number().positive().optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  sortOrder: z.number().int().default(0),
});

export const createInspectionSchema = z.object({
  type: z.string().min(1, "Inspection type is required"),
  scheduledDate: z.string().datetime().optional(),
  inspectorName: z.string().optional(),
  inspectorPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePermitInput = z.infer<typeof createPermitSchema>;
export type UpdatePermitInput = z.infer<typeof updatePermitSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
