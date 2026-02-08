// Re-export all types from validators for convenience
export type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/user";
export type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../validators/property";
export type {
  CreatePermitInput,
  UpdatePermitInput,
  CreateMilestoneInput,
  CreateInspectionInput,
} from "../validators/permit";
export type {
  CreateFormTemplateInput,
  SubmitFormInput,
  UpdateFormSubmissionInput,
} from "../validators/form";

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Common entity types (mirrors Prisma but usable on client)
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  county?: string;
  state: string;
  zipCode: string;
  propertyType: string;
  blockLot?: string;
  yearBuilt?: number;
  squareFeet?: number;
  units: number;
  zoneDesignation?: string;
  status: string;
  createdAt: string;
  _count?: {
    permits: number;
  };
}

export interface Permit {
  id: string;
  permitNumber?: string;
  internalRef: string;
  title: string;
  description?: string;
  projectType: string;
  subcodeType: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  permitFee?: number;
  submittedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  issuedAt?: string;
  notes?: string;
  createdAt: string;
  property?: Property;
}

export interface PermitMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  status: string;
  sortOrder: number;
}

export interface Inspection {
  id: string;
  type: string;
  scheduledDate?: string;
  completedDate?: string;
  status: string;
  inspectorName?: string;
  result?: string;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  createdAt: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  state: string;
  county?: string;
  permitPortalUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface VendorProfile {
  id: string;
  companyName: string;
  description?: string;
  specialties: string[];
  serviceAreas: string[];
  isVerified: boolean;
  rating?: number;
  reviewCount: number;
  user?: User;
}
