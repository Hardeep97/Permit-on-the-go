import { z } from "zod";

export const createVendorProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  description: z.string().max(2000).optional(),
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
  serviceAreas: z.array(z.string()).min(1, "Add at least one service area"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const updateVendorProfileSchema = createVendorProfileSchema.partial();

export const addVendorLicenseSchema = z.object({
  subcodeType: z.enum([
    "BUILDING",
    "PLUMBING",
    "ELECTRICAL",
    "FIRE",
    "ZONING",
    "MECHANICAL",
  ]),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(2, "State is required").max(2),
  issuedBy: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const addVendorInsuranceSchema = z.object({
  type: z.enum([
    "GENERAL_LIABILITY",
    "WORKERS_COMP",
    "PROFESSIONAL_LIABILITY",
  ]),
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  coverageAmount: z.number().positive().optional(),
  expiresAt: z.string().datetime({ message: "Expiration date is required" }),
});

export const createVendorReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const vendorSearchSchema = z.object({
  query: z.string().optional(),
  subcodeType: z
    .enum([
      "BUILDING",
      "PLUMBING",
      "ELECTRICAL",
      "FIRE",
      "ZONING",
      "MECHANICAL",
    ])
    .optional(),
  serviceArea: z.string().optional(),
  isVerified: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  minRating: z
    .string()
    .transform((v) => parseFloat(v))
    .optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .default("1"),
  pageSize: z
    .string()
    .transform((v) => parseInt(v, 10))
    .default("12"),
});

export type CreateVendorProfileInput = z.infer<
  typeof createVendorProfileSchema
>;
export type UpdateVendorProfileInput = z.infer<
  typeof updateVendorProfileSchema
>;
export type AddVendorLicenseInput = z.infer<typeof addVendorLicenseSchema>;
export type AddVendorInsuranceInput = z.infer<typeof addVendorInsuranceSchema>;
export type CreateVendorReviewInput = z.infer<typeof createVendorReviewSchema>;
export type VendorSearchInput = z.infer<typeof vendorSearchSchema>;
