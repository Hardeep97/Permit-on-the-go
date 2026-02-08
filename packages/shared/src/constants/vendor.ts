export const INSURANCE_TYPES = {
  GENERAL_LIABILITY: "GENERAL_LIABILITY",
  WORKERS_COMP: "WORKERS_COMP",
  PROFESSIONAL_LIABILITY: "PROFESSIONAL_LIABILITY",
} as const;

export type InsuranceType =
  (typeof INSURANCE_TYPES)[keyof typeof INSURANCE_TYPES];

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  GENERAL_LIABILITY: "General Liability",
  WORKERS_COMP: "Workers' Compensation",
  PROFESSIONAL_LIABILITY: "Professional Liability",
};

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const TRANSACTION_STATUS_COLORS: Record<
  TransactionStatus,
  { bg: string; text: string }
> = {
  PENDING: { bg: "#FEF3C7", text: "#D97706" },
  COMPLETED: { bg: "#D1FAE5", text: "#065F46" },
  FAILED: { bg: "#FEE2E2", text: "#DC2626" },
  REFUNDED: { bg: "#E0E7FF", text: "#4338CA" },
};

export const VENDOR_SPECIALTIES = [
  "GENERAL_CONTRACTING",
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "FIRE_PROTECTION",
  "ROOFING",
  "MASONRY",
  "CARPENTRY",
  "PAINTING",
  "DEMOLITION",
  "EXCAVATION",
  "LANDSCAPING",
  "ARCHITECTURE",
  "ENGINEERING",
  "SURVEYING",
] as const;

export type VendorSpecialty = (typeof VENDOR_SPECIALTIES)[number];

export const VENDOR_SPECIALTY_LABELS: Record<VendorSpecialty, string> = {
  GENERAL_CONTRACTING: "General Contracting",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC / Mechanical",
  FIRE_PROTECTION: "Fire Protection",
  ROOFING: "Roofing",
  MASONRY: "Masonry",
  CARPENTRY: "Carpentry",
  PAINTING: "Painting",
  DEMOLITION: "Demolition",
  EXCAVATION: "Excavation",
  LANDSCAPING: "Landscaping",
  ARCHITECTURE: "Architecture",
  ENGINEERING: "Engineering",
  SURVEYING: "Surveying",
};

/** Platform fee percentage on vendor transactions */
export const VENDOR_PLATFORM_FEE_PERCENT = 3;
