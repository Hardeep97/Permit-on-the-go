import { z } from "zod";

export const createJurisdictionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["STATE", "COUNTY", "CITY", "TOWNSHIP", "VILLAGE", "BOROUGH", "TOWN", "DISTRICT"]),
  state: z.string().min(2).max(2, "State must be a 2-letter code"),
  county: z.string().max(100).optional(),
  parentId: z.string().optional(),
  fips: z.string().max(10).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  permitPortalUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  officeHours: z.record(z.string()).optional(),
  fees: z.record(z.unknown()).optional(),
  requirements: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateJurisdictionInput = z.infer<typeof createJurisdictionSchema>;

export const updateJurisdictionSchema = createJurisdictionSchema.partial();

export type UpdateJurisdictionInput = z.infer<typeof updateJurisdictionSchema>;

export const jurisdictionSearchSchema = z.object({
  state: z.string().optional(),
  county: z.string().optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  parentId: z.string().optional(),
  isVerified: z.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  pageSize: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 25)),
});

export type JurisdictionSearchInput = z.infer<typeof jurisdictionSearchSchema>;
