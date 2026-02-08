export const SUBCODE_TYPES = {
  BUILDING: "BUILDING",
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  FIRE: "FIRE",
  ZONING: "ZONING",
  MECHANICAL: "MECHANICAL",
} as const;

export type SubcodeType = (typeof SUBCODE_TYPES)[keyof typeof SUBCODE_TYPES];

export const SUBCODE_LABELS: Record<SubcodeType, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

export const SUBCODE_ICONS: Record<SubcodeType, string> = {
  BUILDING: "building",
  PLUMBING: "droplet",
  ELECTRICAL: "zap",
  FIRE: "flame",
  ZONING: "map",
  MECHANICAL: "settings",
};

export const PROJECT_TYPES = {
  NEW_CONSTRUCTION: "NEW_CONSTRUCTION",
  RENOVATION: "RENOVATION",
  ADDITION: "ADDITION",
  DEMOLITION: "DEMOLITION",
  CHANGE_OF_USE: "CHANGE_OF_USE",
  INTERIOR_ALTERATION: "INTERIOR_ALTERATION",
  REPAIR: "REPAIR",
  ACCESSORY_STRUCTURE: "ACCESSORY_STRUCTURE",
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  NEW_CONSTRUCTION: "New Construction",
  RENOVATION: "Renovation",
  ADDITION: "Addition",
  DEMOLITION: "Demolition",
  CHANGE_OF_USE: "Change of Use",
  INTERIOR_ALTERATION: "Interior Alteration",
  REPAIR: "Repair",
  ACCESSORY_STRUCTURE: "Accessory Structure",
};

export const PROPERTY_TYPES = {
  RESIDENTIAL: "RESIDENTIAL",
  COMMERCIAL: "COMMERCIAL",
  MIXED_USE: "MIXED_USE",
  INDUSTRIAL: "INDUSTRIAL",
} as const;

export type PropertyType = (typeof PROPERTY_TYPES)[keyof typeof PROPERTY_TYPES];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
};

export const PARTY_ROLES = {
  OWNER: "OWNER",
  EXPEDITOR: "EXPEDITOR",
  CONTRACTOR: "CONTRACTOR",
  ARCHITECT: "ARCHITECT",
  ENGINEER: "ENGINEER",
  INSPECTOR: "INSPECTOR",
  CITY_CONTACT: "CITY_CONTACT",
  PLUMBER: "PLUMBER",
  ELECTRICIAN: "ELECTRICIAN",
  VIEWER: "VIEWER",
} as const;

export type PartyRole = (typeof PARTY_ROLES)[keyof typeof PARTY_ROLES];

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  OWNER: "Owner",
  EXPEDITOR: "Expeditor",
  CONTRACTOR: "General Contractor",
  ARCHITECT: "Architect",
  ENGINEER: "Engineer",
  INSPECTOR: "Inspector",
  CITY_CONTACT: "City Contact",
  PLUMBER: "Plumber",
  ELECTRICIAN: "Electrician",
  VIEWER: "Viewer",
};
