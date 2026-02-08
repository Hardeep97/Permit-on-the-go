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
export type {
  CreateVendorProfileInput,
  UpdateVendorProfileInput,
  AddVendorLicenseInput,
  AddVendorInsuranceInput,
  CreateVendorReviewInput,
  VendorSearchInput,
} from "../validators/vendor";
export type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  CreateWorkflowTemplateInput,
} from "../validators/task";
export type {
  CreateJurisdictionInput,
  UpdateJurisdictionInput,
  JurisdictionSearchInput,
} from "../validators/jurisdiction";

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
  fips?: string;
  permitPortalUrl?: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  officeHours?: Record<string, string>;
  fees?: Record<string, unknown>;
  requirements?: string[];
  notes?: string;
  isVerified: boolean;
  parentId?: string;
  parent?: { id: string; name: string; type: string };
  children?: Jurisdiction[];
  _count?: {
    properties?: number;
    permits?: number;
    children?: number;
  };
}

export interface VendorProfile {
  id: string;
  companyName: string;
  description?: string;
  specialties: string[];
  serviceAreas: string[];
  website?: string;
  logoUrl?: string;
  isVerified: boolean;
  rating?: number;
  reviewCount: number;
  isActive: boolean;
  stripeConnectId?: string;
  createdAt: string;
  user?: User;
  licenses?: VendorLicense[];
  insurance?: VendorInsurance[];
  photos?: VendorPhoto[];
  reviews?: VendorReview[];
}

export interface VendorLicense {
  id: string;
  subcodeType: string;
  licenseNumber: string;
  licenseState: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface VendorInsurance {
  id: string;
  type: string;
  provider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  expiresAt: string;
  documentUrl?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface VendorPhoto {
  id: string;
  fileUrl: string;
  caption?: string;
  projectType?: string;
  createdAt: string;
}

export interface VendorReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerId: string;
  reviewer?: { name: string; avatarUrl?: string };
}

export interface VendorTransaction {
  id: string;
  amount: number;
  platformFee: number;
  stripePaymentId?: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  assigneeId?: string;
  assignee?: { id: string; name: string; avatarUrl?: string };
  creatorId: string;
  creator?: { id: string; name: string };
  permitId?: string;
  permit?: { id: string; title: string; property?: { name: string } };
  checklistItems?: TaskChecklistItem[];
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  permitType?: string;
  steps: WorkflowStep[];
  isDefault: boolean;
  createdAt: string;
}

export interface WorkflowStep {
  title: string;
  description?: string;
  priority: string;
  estimatedDays?: number;
  sortOrder: number;
}
