import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  county: z.string().optional(),
  state: z.string().length(2, "State must be a 2-letter code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED_USE", "INDUSTRIAL"]).default("RESIDENTIAL"),
  blockLot: z.string().optional(),
  yearBuilt: z.number().int().min(1600).max(new Date().getFullYear()).optional(),
  squareFeet: z.number().int().positive().optional(),
  units: z.number().int().positive().default(1),
  zoneDesignation: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
