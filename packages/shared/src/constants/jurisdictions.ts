export const JURISDICTION_TYPES = {
  STATE: "STATE",
  COUNTY: "COUNTY",
  CITY: "CITY",
  TOWNSHIP: "TOWNSHIP",
  VILLAGE: "VILLAGE",
  BOROUGH: "BOROUGH",
  TOWN: "TOWN",
  DISTRICT: "DISTRICT",
} as const;

export type JurisdictionType = (typeof JURISDICTION_TYPES)[keyof typeof JURISDICTION_TYPES];

export const JURISDICTION_TYPE_LABELS: Record<JurisdictionType, string> = {
  STATE: "State",
  COUNTY: "County",
  CITY: "City",
  TOWNSHIP: "Township",
  VILLAGE: "Village",
  BOROUGH: "Borough",
  TOWN: "Town",
  DISTRICT: "District",
};

/** States with the most construction activity — prioritized for seeding and search */
export const MAJOR_STATES = [
  "NJ", "NY", "CA", "PA", "FL", "TX", "IL", "OH",
  "GA", "NC", "MA", "CT", "VA", "MD", "WA",
] as const;
