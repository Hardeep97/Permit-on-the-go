import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test user
  const hashedPassword = await bcrypt.hash("Password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@permitsonthego.com" },
    update: {},
    create: {
      email: "demo@permitsonthego.com",
      name: "Demo User",
      password: hashedPassword,
      phone: "555-123-4567",
      emailVerified: true,
      onboardingComplete: true,
      subscription: {
        create: {
          plan: "ANNUAL",
          status: "ACTIVE",
          aiCreditsRemaining: 999999,
          aiCreditsTotal: 999999,
        },
      },
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create NJ jurisdictions (sample)
  const njState = await prisma.jurisdiction.upsert({
    where: { name_state_type: { name: "New Jersey", state: "NJ", type: "STATE" } },
    update: {},
    create: {
      name: "New Jersey",
      type: "STATE",
      state: "NJ",
      websiteUrl: "https://www.nj.gov/dca/divisions/codes/",
      isVerified: true,
    },
  });

  const municipalities = [
    { name: "City of Newark", county: "Essex", phone: "973-733-3860", email: "permits@ci.newark.nj.us" },
    { name: "City of Jersey City", county: "Hudson", phone: "201-547-5090", email: "construction@jcnj.org" },
    { name: "City of Paterson", county: "Passaic", phone: "973-321-1258", email: "construction@patersonnj.gov" },
    { name: "Township of Edison", county: "Middlesex", phone: "732-248-7280", email: "construction@edisonnj.org" },
    { name: "City of Elizabeth", county: "Union", phone: "908-820-4124", email: "building@elizabethnj.org" },
    { name: "Township of Woodbridge", county: "Middlesex", phone: "732-634-4500", email: "building@twp.woodbridge.nj.us" },
    { name: "Township of Lakewood", county: "Ocean", phone: "732-364-2500", email: "construction@lakewoodnj.gov" },
    { name: "Township of Toms River", county: "Ocean", phone: "732-341-1000", email: "construction@tomsrivertownship.com" },
    { name: "City of Clifton", county: "Passaic", phone: "973-470-5800", email: "building@cliftonnj.org" },
    { name: "City of Trenton", county: "Mercer", phone: "609-989-3535", email: "construction@trentonnj.org" },
  ];

  for (const muni of municipalities) {
    await prisma.jurisdiction.upsert({
      where: { name_state_type: { name: muni.name, state: "NJ", type: "CITY" } },
      update: {},
      create: {
        name: muni.name,
        type: muni.name.startsWith("Township") ? "TOWNSHIP" : "CITY",
        state: "NJ",
        county: muni.county,
        phone: muni.phone,
        email: muni.email,
        parentId: njState.id,
        isVerified: true,
        officeHours: {
          mon: "8:30 AM - 4:30 PM",
          tue: "8:30 AM - 4:30 PM",
          wed: "8:30 AM - 4:30 PM",
          thu: "8:30 AM - 4:30 PM",
          fri: "8:30 AM - 4:30 PM",
          sat: "Closed",
          sun: "Closed",
        },
      },
    });
  }

  console.log(`Created ${municipalities.length} NJ jurisdictions`);

  // Find Newark jurisdiction
  const newark = await prisma.jurisdiction.findFirst({
    where: { name: "City of Newark", state: "NJ" },
  });

  // Create sample properties
  const property1 = await prisma.property.upsert({
    where: { id: "seed-property-1" },
    update: {},
    create: {
      id: "seed-property-1",
      name: "123 Broad St Duplex",
      address: "123 Broad Street",
      city: "Newark",
      county: "Essex",
      state: "NJ",
      zipCode: "07102",
      propertyType: "RESIDENTIAL",
      blockLot: "Block 1234, Lot 56",
      yearBuilt: 1955,
      squareFeet: 2400,
      units: 2,
      ownerId: user.id,
      jurisdictionId: newark?.id,
    },
  });

  const property2 = await prisma.property.upsert({
    where: { id: "seed-property-2" },
    update: {},
    create: {
      id: "seed-property-2",
      name: "456 Market St Commercial",
      address: "456 Market Street",
      city: "Newark",
      county: "Essex",
      state: "NJ",
      zipCode: "07105",
      propertyType: "COMMERCIAL",
      blockLot: "Block 5678, Lot 12",
      yearBuilt: 1972,
      squareFeet: 5000,
      units: 1,
      ownerId: user.id,
      jurisdictionId: newark?.id,
    },
  });

  console.log("Created 2 sample properties");

  // Create sample permits
  const permit1 = await prisma.permit.upsert({
    where: { internalRef: "seed-permit-1" },
    update: {},
    create: {
      internalRef: "seed-permit-1",
      title: "Kitchen Renovation - Unit 1",
      description: "Full kitchen renovation including new cabinets, countertops, plumbing fixtures, and electrical upgrades.",
      projectType: "RENOVATION",
      subcodeType: "BUILDING",
      status: "UNDER_REVIEW",
      priority: "HIGH",
      estimatedValue: 35000,
      permitFee: 450,
      submittedAt: new Date("2025-12-15"),
      creatorId: user.id,
      propertyId: property1.id,
      jurisdictionId: newark?.id,
    },
  });

  const permit2 = await prisma.permit.upsert({
    where: { internalRef: "seed-permit-2" },
    update: {},
    create: {
      internalRef: "seed-permit-2",
      title: "Electrical Panel Upgrade",
      description: "Upgrade main electrical panel from 100A to 200A service.",
      projectType: "REPAIR",
      subcodeType: "ELECTRICAL",
      status: "APPROVED",
      priority: "NORMAL",
      estimatedValue: 4500,
      permitFee: 150,
      submittedAt: new Date("2025-11-01"),
      approvedAt: new Date("2025-11-20"),
      creatorId: user.id,
      propertyId: property1.id,
      jurisdictionId: newark?.id,
    },
  });

  const permit3 = await prisma.permit.upsert({
    where: { internalRef: "seed-permit-3" },
    update: {},
    create: {
      internalRef: "seed-permit-3",
      title: "Commercial HVAC Installation",
      description: "New rooftop HVAC unit installation for commercial space.",
      projectType: "NEW_CONSTRUCTION",
      subcodeType: "MECHANICAL",
      status: "DRAFT",
      priority: "NORMAL",
      estimatedValue: 18000,
      creatorId: user.id,
      propertyId: property2.id,
      jurisdictionId: newark?.id,
    },
  });

  const permit4 = await prisma.permit.upsert({
    where: { internalRef: "seed-permit-4" },
    update: {},
    create: {
      internalRef: "seed-permit-4",
      title: "Fire Alarm System Upgrade",
      description: "Replace and upgrade fire alarm system to meet current code.",
      projectType: "REPAIR",
      subcodeType: "FIRE",
      status: "SUBMITTED",
      priority: "URGENT",
      estimatedValue: 12000,
      permitFee: 300,
      submittedAt: new Date("2026-01-10"),
      creatorId: user.id,
      propertyId: property2.id,
      jurisdictionId: newark?.id,
    },
  });

  console.log("Created 4 sample permits");

  // Create milestones for permit1
  await prisma.permitMilestone.createMany({
    data: [
      { permitId: permit1.id, title: "Application Submitted", status: "COMPLETED", completedAt: new Date("2025-12-15"), sortOrder: 1, isAutomatic: true },
      { permitId: permit1.id, title: "Plan Review", status: "IN_PROGRESS", dueDate: new Date("2026-02-15"), sortOrder: 2, isAutomatic: true },
      { permitId: permit1.id, title: "Permit Approved", status: "PENDING", sortOrder: 3, isAutomatic: true },
      { permitId: permit1.id, title: "Rough Inspection", status: "PENDING", sortOrder: 4, isAutomatic: true },
      { permitId: permit1.id, title: "Final Inspection", status: "PENDING", sortOrder: 5, isAutomatic: true },
      { permitId: permit1.id, title: "Certificate of Occupancy", status: "PENDING", sortOrder: 6, isAutomatic: true },
    ],
    skipDuplicates: true,
  });

  // Create inspections for permit2
  await prisma.inspection.createMany({
    data: [
      { permitId: permit2.id, type: "ROUGH_ELECTRICAL", status: "PASSED", scheduledDate: new Date("2026-01-15"), completedDate: new Date("2026-01-15"), inspectorName: "Mike Johnson", result: "Passed - all wiring meets code" },
      { permitId: permit2.id, type: "FINAL_ELECTRICAL", status: "SCHEDULED", scheduledDate: new Date("2026-02-20"), inspectorName: "Mike Johnson" },
    ],
    skipDuplicates: true,
  });

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: user.id, action: "CREATED", entityType: "PERMIT", entityId: permit1.id, description: 'Created permit "Kitchen Renovation - Unit 1"', permitId: permit1.id },
      { userId: user.id, action: "STATUS_CHANGED", entityType: "PERMIT", entityId: permit1.id, description: "Status changed from DRAFT to SUBMITTED", permitId: permit1.id, metadata: { oldStatus: "DRAFT", newStatus: "SUBMITTED" } },
      { userId: user.id, action: "STATUS_CHANGED", entityType: "PERMIT", entityId: permit1.id, description: "Status changed from SUBMITTED to UNDER_REVIEW", permitId: permit1.id, metadata: { oldStatus: "SUBMITTED", newStatus: "UNDER_REVIEW" } },
      { userId: user.id, action: "CREATED", entityType: "PERMIT", entityId: permit2.id, description: 'Created permit "Electrical Panel Upgrade"', permitId: permit2.id },
      { userId: user.id, action: "STATUS_CHANGED", entityType: "PERMIT", entityId: permit2.id, description: "Status changed from SUBMITTED to APPROVED", permitId: permit2.id, metadata: { oldStatus: "SUBMITTED", newStatus: "APPROVED" } },
      { userId: user.id, action: "INSPECTION_COMPLETED", entityType: "INSPECTION", entityId: "seed-inspection", description: "Rough Electrical inspection passed", permitId: permit2.id },
    ],
    skipDuplicates: true,
  });

  console.log("Created milestones, inspections, and activity logs");

  // ============================================================
  // FORM TEMPLATES — NJ Subcode Application Forms
  // ============================================================

  const buildingFormSchema = {
    sections: [
      {
        id: "owner-info",
        title: "Owner / Applicant Information",
        description: "Property owner and applicant details",
        fields: [
          { id: "ownerName", type: "TEXT", label: "Owner Name", required: true },
          { id: "ownerEmail", type: "EMAIL", label: "Owner Email", required: true },
          { id: "ownerPhone", type: "PHONE", label: "Owner Phone", required: true },
          { id: "ownerAddress", type: "ADDRESS", label: "Owner Mailing Address", required: true },
          { id: "applicantSameAsOwner", type: "CHECKBOX", label: "Applicant is same as owner" },
          { id: "applicantName", type: "TEXT", label: "Applicant Name", conditionalOn: { field: "applicantSameAsOwner", value: false } },
          { id: "applicantPhone", type: "PHONE", label: "Applicant Phone", conditionalOn: { field: "applicantSameAsOwner", value: false } },
        ],
      },
      {
        id: "property-info",
        title: "Property Information",
        fields: [
          { id: "propertyAddress", type: "TEXT", label: "Property Address", required: true },
          { id: "propertyCity", type: "TEXT", label: "City", required: true },
          { id: "propertyState", type: "TEXT", label: "State", required: true, defaultValue: "NJ" },
          { id: "propertyZip", type: "TEXT", label: "ZIP Code", required: true },
          { id: "blockLot", type: "TEXT", label: "Block / Lot", required: true },
        ],
      },
      {
        id: "project-details",
        title: "Project Description",
        fields: [
          { id: "projectDescription", type: "TEXTAREA", label: "Describe the proposed work", required: true, helpText: "Include scope, materials, and structural changes" },
          { id: "constructionType", type: "SELECT", label: "Construction Type", required: true, options: ["Wood Frame", "Steel Frame", "Masonry", "Concrete", "Mixed", "Other"] },
          { id: "occupancyGroup", type: "SELECT", label: "Occupancy Group", options: ["R-1 (Hotels)", "R-2 (Apartments)", "R-3 (1-2 Family)", "R-4 (Care Facilities)", "B (Business)", "M (Mercantile)", "A (Assembly)", "F (Factory)", "S (Storage)", "Other"] },
          { id: "stories", type: "NUMBER", label: "Number of Stories", required: true },
          { id: "squareFeet", type: "NUMBER", label: "Total Square Footage", required: true },
          { id: "estimatedCost", type: "NUMBER", label: "Estimated Cost of Construction ($)", required: true },
        ],
      },
      {
        id: "contractor-info",
        title: "Contractor Information",
        fields: [
          { id: "contractorName", type: "TEXT", label: "Contractor / Builder Name", required: true },
          { id: "contractorLicense", type: "TEXT", label: "NJ License Number", required: true },
          { id: "contractorPhone", type: "PHONE", label: "Contractor Phone", required: true },
          { id: "contractorEmail", type: "EMAIL", label: "Contractor Email" },
          { id: "contractorInsurance", type: "TEXT", label: "Insurance Certificate Number" },
        ],
      },
      {
        id: "certifications",
        title: "Certifications & Signatures",
        fields: [
          { id: "certifyAccurate", type: "CHECKBOX", label: "I certify that the information provided is accurate and complete", required: true },
          { id: "signature", type: "SIGNATURE", label: "Applicant Signature", required: true },
          { id: "signatureDate", type: "DATE", label: "Date", required: true },
        ],
      },
    ],
  };

  const plumbingFormSchema = {
    sections: [
      {
        id: "owner-info",
        title: "Owner / Applicant Information",
        fields: [
          { id: "ownerName", type: "TEXT", label: "Owner Name", required: true },
          { id: "ownerEmail", type: "EMAIL", label: "Owner Email", required: true },
          { id: "ownerPhone", type: "PHONE", label: "Owner Phone", required: true },
          { id: "propertyAddress", type: "TEXT", label: "Property Address", required: true },
          { id: "blockLot", type: "TEXT", label: "Block / Lot", required: true },
        ],
      },
      {
        id: "plumbing-work",
        title: "Plumbing Work Details",
        fields: [
          { id: "workDescription", type: "TEXTAREA", label: "Description of Plumbing Work", required: true },
          { id: "fixtureCount", type: "NUMBER", label: "Total Number of Fixtures", required: true, helpText: "Sinks, toilets, showers, tubs, etc." },
          { id: "waterHeater", type: "CHECKBOX", label: "Water Heater Installation/Replacement" },
          { id: "waterHeaterType", type: "SELECT", label: "Water Heater Type", options: ["Gas", "Electric", "Tankless Gas", "Tankless Electric", "Heat Pump"], conditionalOn: { field: "waterHeater", value: true } },
          { id: "waterHeaterSize", type: "NUMBER", label: "Water Heater Size (gallons)", conditionalOn: { field: "waterHeater", value: true } },
          { id: "gasPiping", type: "CHECKBOX", label: "Gas Piping Work" },
          { id: "gasPipingLength", type: "NUMBER", label: "Length of Gas Piping (feet)", conditionalOn: { field: "gasPiping", value: true } },
          { id: "sewerConnection", type: "CHECKBOX", label: "New Sewer Connection" },
          { id: "backflowPrevention", type: "CHECKBOX", label: "Backflow Prevention Device" },
          { id: "waterService", type: "CHECKBOX", label: "New Water Service Line" },
        ],
      },
      {
        id: "contractor-info",
        title: "Licensed Plumber Information",
        fields: [
          { id: "plumberName", type: "TEXT", label: "Licensed Plumber Name", required: true },
          { id: "plumberLicense", type: "TEXT", label: "NJ Plumbing License Number", required: true },
          { id: "plumberPhone", type: "PHONE", label: "Plumber Phone", required: true },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        fields: [
          { id: "certifyAccurate", type: "CHECKBOX", label: "I certify that the information provided is accurate", required: true },
          { id: "signature", type: "SIGNATURE", label: "Applicant Signature", required: true },
          { id: "signatureDate", type: "DATE", label: "Date", required: true },
        ],
      },
    ],
  };

  const electricalFormSchema = {
    sections: [
      {
        id: "owner-info",
        title: "Owner / Applicant Information",
        fields: [
          { id: "ownerName", type: "TEXT", label: "Owner Name", required: true },
          { id: "ownerEmail", type: "EMAIL", label: "Owner Email", required: true },
          { id: "ownerPhone", type: "PHONE", label: "Owner Phone", required: true },
          { id: "propertyAddress", type: "TEXT", label: "Property Address", required: true },
          { id: "blockLot", type: "TEXT", label: "Block / Lot", required: true },
        ],
      },
      {
        id: "electrical-work",
        title: "Electrical Work Details",
        fields: [
          { id: "workDescription", type: "TEXTAREA", label: "Description of Electrical Work", required: true },
          { id: "serviceSize", type: "SELECT", label: "Service Size (Amps)", required: true, options: ["60A", "100A", "150A", "200A", "400A", "600A", "800A", "Other"] },
          { id: "panelUpgrade", type: "CHECKBOX", label: "Panel Upgrade" },
          { id: "newCircuits", type: "NUMBER", label: "Number of New Circuits" },
          { id: "lightFixtures", type: "NUMBER", label: "Number of Light Fixtures" },
          { id: "outlets", type: "NUMBER", label: "Number of Outlets/Receptacles" },
          { id: "switches", type: "NUMBER", label: "Number of Switches" },
          { id: "generator", type: "CHECKBOX", label: "Generator Installation" },
          { id: "generatorSize", type: "TEXT", label: "Generator Size (kW)", conditionalOn: { field: "generator", value: true } },
          { id: "solarPanels", type: "CHECKBOX", label: "Solar Panel Installation" },
          { id: "solarKw", type: "NUMBER", label: "Solar System Size (kW)", conditionalOn: { field: "solarPanels", value: true } },
          { id: "evCharger", type: "CHECKBOX", label: "EV Charger Installation" },
        ],
      },
      {
        id: "contractor-info",
        title: "Licensed Electrician Information",
        fields: [
          { id: "electricianName", type: "TEXT", label: "Licensed Electrician Name", required: true },
          { id: "electricianLicense", type: "TEXT", label: "NJ Electrical License Number", required: true },
          { id: "electricianPhone", type: "PHONE", label: "Electrician Phone", required: true },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        fields: [
          { id: "certifyAccurate", type: "CHECKBOX", label: "I certify that the information provided is accurate", required: true },
          { id: "signature", type: "SIGNATURE", label: "Applicant Signature", required: true },
          { id: "signatureDate", type: "DATE", label: "Date", required: true },
        ],
      },
    ],
  };

  const fireFormSchema = {
    sections: [
      {
        id: "owner-info",
        title: "Owner / Applicant Information",
        fields: [
          { id: "ownerName", type: "TEXT", label: "Owner Name", required: true },
          { id: "ownerEmail", type: "EMAIL", label: "Owner Email", required: true },
          { id: "ownerPhone", type: "PHONE", label: "Owner Phone", required: true },
          { id: "propertyAddress", type: "TEXT", label: "Property Address", required: true },
          { id: "blockLot", type: "TEXT", label: "Block / Lot", required: true },
        ],
      },
      {
        id: "fire-protection",
        title: "Fire Protection Details",
        fields: [
          { id: "workDescription", type: "TEXTAREA", label: "Description of Fire Protection Work", required: true },
          { id: "alarmSystem", type: "CHECKBOX", label: "Fire Alarm System Installation/Modification" },
          { id: "alarmType", type: "SELECT", label: "Alarm System Type", options: ["Conventional", "Addressable", "Wireless", "Combination"], conditionalOn: { field: "alarmSystem", value: true } },
          { id: "alarmDevices", type: "NUMBER", label: "Number of Alarm Devices", conditionalOn: { field: "alarmSystem", value: true } },
          { id: "sprinklerSystem", type: "CHECKBOX", label: "Sprinkler System" },
          { id: "sprinklerHeads", type: "NUMBER", label: "Number of Sprinkler Heads", conditionalOn: { field: "sprinklerSystem", value: true } },
          { id: "sprinklerType", type: "SELECT", label: "Sprinkler System Type", options: ["Wet Pipe", "Dry Pipe", "Deluge", "Pre-Action"], conditionalOn: { field: "sprinklerSystem", value: true } },
          { id: "fireExtinguishers", type: "NUMBER", label: "Number of Fire Extinguishers" },
          { id: "exitSigns", type: "NUMBER", label: "Number of Exit Signs" },
          { id: "emergencyLighting", type: "NUMBER", label: "Number of Emergency Lights" },
          { id: "occupancyLoad", type: "NUMBER", label: "Maximum Occupancy Load", required: true },
          { id: "standpipe", type: "CHECKBOX", label: "Standpipe System" },
        ],
      },
      {
        id: "contractor-info",
        title: "Fire Protection Contractor",
        fields: [
          { id: "contractorName", type: "TEXT", label: "Fire Protection Contractor Name", required: true },
          { id: "contractorLicense", type: "TEXT", label: "NJ License Number", required: true },
          { id: "contractorPhone", type: "PHONE", label: "Contractor Phone", required: true },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        fields: [
          { id: "certifyAccurate", type: "CHECKBOX", label: "I certify that the information provided is accurate", required: true },
          { id: "signature", type: "SIGNATURE", label: "Applicant Signature", required: true },
          { id: "signatureDate", type: "DATE", label: "Date", required: true },
        ],
      },
    ],
  };

  const zoningFormSchema = {
    sections: [
      {
        id: "owner-info",
        title: "Owner / Applicant Information",
        fields: [
          { id: "ownerName", type: "TEXT", label: "Owner Name", required: true },
          { id: "ownerEmail", type: "EMAIL", label: "Owner Email", required: true },
          { id: "ownerPhone", type: "PHONE", label: "Owner Phone", required: true },
          { id: "propertyAddress", type: "TEXT", label: "Property Address", required: true },
          { id: "blockLot", type: "TEXT", label: "Block / Lot", required: true },
        ],
      },
      {
        id: "zoning-details",
        title: "Zoning Information",
        fields: [
          { id: "currentZone", type: "TEXT", label: "Current Zoning Designation", required: true },
          { id: "currentUse", type: "TEXT", label: "Current Use of Property", required: true },
          { id: "proposedUse", type: "TEXT", label: "Proposed Use of Property", required: true },
          { id: "useClassification", type: "SELECT", label: "Use Classification", required: true, options: ["Residential", "Commercial", "Industrial", "Mixed Use", "Agricultural", "Institutional"] },
          { id: "lotSize", type: "NUMBER", label: "Lot Size (sq ft)", required: true },
          { id: "lotCoverage", type: "NUMBER", label: "Proposed Lot Coverage (%)", required: true },
          { id: "maxLotCoverage", type: "NUMBER", label: "Maximum Allowed Lot Coverage (%)" },
          { id: "frontSetback", type: "NUMBER", label: "Front Setback (feet)", required: true },
          { id: "rearSetback", type: "NUMBER", label: "Rear Setback (feet)", required: true },
          { id: "sideSetbackLeft", type: "NUMBER", label: "Left Side Setback (feet)", required: true },
          { id: "sideSetbackRight", type: "NUMBER", label: "Right Side Setback (feet)", required: true },
          { id: "buildingHeight", type: "NUMBER", label: "Proposed Building Height (feet)" },
          { id: "maxBuildingHeight", type: "NUMBER", label: "Maximum Allowed Height (feet)" },
          { id: "parkingSpaces", type: "NUMBER", label: "Number of Parking Spaces Provided", required: true },
          { id: "parkingRequired", type: "NUMBER", label: "Number of Parking Spaces Required" },
        ],
      },
      {
        id: "variance",
        title: "Variance Request (if applicable)",
        fields: [
          { id: "varianceNeeded", type: "CHECKBOX", label: "Variance Required" },
          { id: "varianceType", type: "SELECT", label: "Type of Variance", options: ["Bulk/Area Variance", "Use Variance", "Both"], conditionalOn: { field: "varianceNeeded", value: true } },
          { id: "varianceReason", type: "TEXTAREA", label: "Reason for Variance Request", conditionalOn: { field: "varianceNeeded", value: true } },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        fields: [
          { id: "certifyAccurate", type: "CHECKBOX", label: "I certify that the information provided is accurate", required: true },
          { id: "signature", type: "SIGNATURE", label: "Applicant Signature", required: true },
          { id: "signatureDate", type: "DATE", label: "Date", required: true },
        ],
      },
    ],
  };

  // Seed form templates
  const formTemplates = [
    { name: "NJ Building Subcode Application", subcodeType: "BUILDING", schema: buildingFormSchema, description: "Standard building subcode permit application for construction, renovation, and structural work in New Jersey." },
    { name: "NJ Plumbing Subcode Application", subcodeType: "PLUMBING", schema: plumbingFormSchema, description: "Plumbing subcode permit application for fixture installations, water heaters, gas piping, and sewer connections." },
    { name: "NJ Electrical Subcode Application", subcodeType: "ELECTRICAL", schema: electricalFormSchema, description: "Electrical subcode permit application for panel upgrades, circuits, generators, solar, and EV chargers." },
    { name: "NJ Fire Subcode Application", subcodeType: "FIRE", schema: fireFormSchema, description: "Fire protection subcode application for alarm systems, sprinklers, exit signs, and emergency lighting." },
    { name: "NJ Zoning Permit Application", subcodeType: "ZONING", schema: zoningFormSchema, description: "Zoning permit application covering lot coverage, setbacks, use classification, and variance requests." },
  ];

  for (const tmpl of formTemplates) {
    await prisma.formTemplate.upsert({
      where: { id: `seed-template-${tmpl.subcodeType.toLowerCase()}` },
      update: { schema: tmpl.schema },
      create: {
        id: `seed-template-${tmpl.subcodeType.toLowerCase()}`,
        name: tmpl.name,
        description: tmpl.description,
        subcodeType: tmpl.subcodeType,
        schema: tmpl.schema,
        version: "1.0",
      },
    });
  }

  console.log(`Created ${formTemplates.length} NJ subcode form templates`);

  // ============================================================
  // KNOWLEDGE BASE — NJ Permit Process & App Guide
  // ============================================================

  const knowledgeDocuments = [
    {
      id: "kb-nj-ucc-overview",
      title: "New Jersey Uniform Construction Code (UCC) Overview",
      source: "nj-ucc-overview",
      sourceType: "GUIDE",
      jurisdiction: "NJ",
      content: `# New Jersey Uniform Construction Code (UCC) Overview

The New Jersey Uniform Construction Code (UCC) is the statewide building code that governs all construction work in the state. It is administered by the NJ Department of Community Affairs (DCA), Division of Codes and Standards.

## What Requires a Permit?

Under the UCC (N.J.A.C. 5:23), construction permits are required for:
- New construction of any building or structure
- Additions or alterations to existing buildings
- Renovation or reconstruction work
- Demolition of any structure
- Installation or alteration of plumbing systems
- Installation or alteration of electrical systems
- Installation or alteration of fire protection systems
- Changes in use or occupancy of a building
- Installation of mechanical systems (HVAC)
- Swimming pool installation
- Sign installation (certain types)

## Subcodes

The UCC is divided into subcodes, each enforced by a separate subcode official:

### Building Subcode
Covers structural integrity, fire resistance, means of egress, accessibility, energy conservation, and general building safety. Based on the International Building Code (IBC) and International Residential Code (IRC).

### Plumbing Subcode
Covers water supply, drainage, fixtures, water heaters, gas piping, and backflow prevention. Based on the National Standard Plumbing Code.

### Electrical Subcode
Covers electrical wiring, panels, circuits, generators, solar installations, and EV chargers. Based on the National Electrical Code (NEC).

### Fire Protection Subcode
Covers fire alarm systems, sprinkler systems, standpipes, emergency lighting, exit signs, and fire extinguishers. Based on NFPA codes.

### Zoning
While not technically a subcode of the UCC, zoning approval is typically required before or concurrent with a construction permit. Covers land use, setbacks, lot coverage, building height, and parking requirements.

### Mechanical Subcode (Elevator)
Covers elevators, escalators, and other mechanical lifting devices.

## Permit Application Process

1. **Determine if a permit is needed** — Contact your local construction office
2. **Prepare your application** — Complete the appropriate subcode forms
3. **Gather required documents** — Plans, specifications, surveys, contractor licenses
4. **Submit your application** — To the local construction office
5. **Plan review** — Technical review by subcode officials (typically 20 business days)
6. **Receive permit** — Once approved, you'll receive your construction permit
7. **Schedule inspections** — Required at various stages of construction
8. **Final inspection** — Complete all work and request final inspection
9. **Certificate of Occupancy** — Issued after all final inspections pass

## Fees

Permit fees vary by municipality and are based on the estimated cost of construction. The DCA sets minimum fee schedules, but municipalities may charge higher fees. Typical fee components:
- Plan review fee
- Construction permit fee (per subcode)
- Certificate of occupancy fee
- Inspection fees (if additional inspections are needed)

## Inspections

Inspections are required at critical stages of construction:
- **Foundation inspection** — Before pouring concrete
- **Framing/rough inspection** — Before closing walls
- **Rough plumbing** — Before covering pipes
- **Rough electrical** — Before covering wiring
- **Insulation inspection** — Before drywall
- **Final inspection** — After all work is complete

Inspections must be requested at least 24 hours in advance. The inspector will either pass, fail, or defer the inspection. Failed inspections require corrections before re-inspection.

## Important Contacts

- NJ DCA Division of Codes and Standards: (609) 984-7609
- NJ Construction Code Communicator (newsletter): Available on DCA website
- Local construction offices: Contact your municipality`,
    },
    {
      id: "kb-permit-process-guide",
      title: "Step-by-Step Permit Application Guide",
      source: "permit-process-guide",
      sourceType: "GUIDE",
      content: `# Step-by-Step Guide to Getting a Construction Permit in NJ

## Before You Apply

### Step 1: Determine if You Need a Permit
Not all work requires a permit. Ordinary repairs and maintenance typically do not. However, any work that involves:
- Structural changes
- New plumbing or electrical work
- Changes to the building's footprint
- Changes in occupancy or use
...will require a permit.

When in doubt, contact your local construction office. Doing work without a required permit can result in fines, required demolition of work, and problems when selling your property.

### Step 2: Identify Your Subcodes
Most projects require permits under multiple subcodes. For example, a kitchen renovation might need:
- Building subcode (structural changes, cabinets)
- Plumbing subcode (new fixtures, gas line for stove)
- Electrical subcode (new circuits, outlets, lighting)

### Step 3: Hire Licensed Contractors
In NJ, licensed contractors are required for:
- Plumbing work (NJ Plumbing License)
- Electrical work (NJ Electrical License)
- HVAC work (NJ HVAC License)
- Fire protection work (NJ Fire Protection License)

Homeowners can do some work themselves (homeowner permit) but cannot do their own plumbing or electrical work.

## The Application Process

### Step 4: Complete the Application Forms
Fill out the appropriate subcode application forms. You'll need:
- Owner/applicant information
- Property details (address, block/lot)
- Project description
- Contractor information and license numbers
- Estimated cost of construction

### Step 5: Prepare Required Documents
Depending on the project, you may need:
- Architectural plans/drawings
- Engineering calculations
- Site survey
- Contractor licenses and insurance
- Asbestos/lead survey (for renovation of pre-1978 buildings)

### Step 6: Submit Your Application
Submit your completed forms and documents to your local construction office. You can often do this in person, by mail, or online (varies by municipality).

### Step 7: Pay Fees
Fees are typically calculated based on:
- Estimated cost of construction
- Number of fixtures (plumbing)
- Number of devices (electrical)
- Square footage (some municipalities)

### Step 8: Plan Review
Your plans will be reviewed by the relevant subcode officials. This typically takes 20 business days. You may receive:
- Approval
- Conditional approval (with required changes)
- Rejection (with reasons)

## After Approval

### Step 9: Receive Your Permit
Once approved, your construction permit will be issued. Important:
- Post the permit at the job site
- Keep approved plans on site
- The permit is valid for a limited time (typically 12 months)
- Start work within 6 months or the permit expires

### Step 10: Schedule Inspections
As work progresses, schedule required inspections at least 24 hours in advance. Common inspection points:
- Foundation
- Framing
- Rough plumbing
- Rough electrical
- Insulation/energy
- Final

### Step 11: Final Inspection & Certificate of Occupancy
After all work is complete:
1. Request a final inspection for each subcode
2. All finals must pass
3. A Certificate of Occupancy (CO) or Certificate of Approval (CA) is issued
4. Keep this certificate — you'll need it when selling the property`,
    },
    {
      id: "kb-app-navigation",
      title: "Permits on the Go — App Navigation Guide",
      source: "app-navigation-guide",
      sourceType: "APP_GUIDE",
      content: `# Permits on the Go — How to Use the App

## Getting Started

### Creating Your Account
1. Download the app or visit the website
2. Click "Sign Up" and enter your email and password
3. Complete your profile with your name and phone number
4. You're ready to start managing permits!

### Your Dashboard
The dashboard shows:
- Your properties and their permit counts
- Recent activity across all permits
- Quick actions: Add Property, Create Permit
- Upcoming inspections and deadlines

## Managing Properties

### Adding a Property
1. Click "Add Property" from the dashboard
2. Enter the property details:
   - Name (e.g., "123 Main St Duplex")
   - Full address
   - Property type (Residential, Commercial, Industrial, Mixed Use)
   - Block/Lot number
   - Year built, square footage, number of units
3. Select the jurisdiction (municipality)
4. Save the property

### Property Detail View
Each property page shows:
- Property information and address
- All permits associated with this property
- AI chat button to ask questions about this property

## Managing Permits

### Creating a New Permit
1. Go to a property's detail page
2. Click "New Permit"
3. Fill in:
   - Title (e.g., "Kitchen Renovation")
   - Project type (New Construction, Addition, Renovation, Repair, Demolition)
   - Subcode type (Building, Plumbing, Electrical, Fire, Zoning, Mechanical)
   - Description of work
   - Estimated value
   - Priority level
4. Save as Draft or Submit

### Permit Timeline
Each permit has a timeline showing milestones:
- Application Submitted
- Plan Review
- Permit Approved
- Inspections
- Certificate of Occupancy

### Filling Out Subcode Forms
1. Go to a permit's detail page
2. Click "Forms"
3. Select the appropriate form template for your subcode
4. Fill in the form — property and owner info auto-fills
5. Save as Draft to continue later, or Submit

### Uploading Documents
1. Go to a permit's detail page
2. Click "Documents"
3. Upload plans, surveys, licenses, or other files
4. Categorize each document

### Managing Inspections
1. Go to a permit's detail page
2. Click "Inspections"
3. Schedule an inspection with date, type, and inspector
4. Track inspection results (Pass, Fail, Defer)

### Adding Team Members (Parties)
1. Go to a permit's detail page
2. Click "Parties"
3. Add team members by email with a role:
   - Expeditor: Full access, manages the process
   - Contractor: Upload documents, send messages
   - Architect/Engineer: Upload documents, send messages
   - Inspector: View and manage inspections
   - Viewer: Read-only access

## AI Chat Assistant

### General Chat
Use the general chat to ask questions about:
- The permit process
- Code requirements
- How to use the app
- General construction and permit advice

### Property-Specific Chat
Each property has an AI assistant that knows about:
- The property's address and details
- All permits for that property
- Permit statuses, milestones, and inspections
- Documents and forms submitted

Click "Ask AI" on any property page to start a property-specific conversation.

## Tips
- Keep your permits up-to-date — update statuses as they change
- Upload documents as soon as you receive them
- Schedule inspections early to avoid delays
- Use the AI chat for quick answers about code requirements
- Add all team members to permits so everyone stays in sync`,
    },
  ];

  for (const doc of knowledgeDocuments) {
    await prisma.knowledgeDocument.upsert({
      where: { id: doc.id },
      update: { content: doc.content },
      create: {
        id: doc.id,
        title: doc.title,
        source: doc.source,
        sourceType: doc.sourceType,
        jurisdiction: doc.jurisdiction,
        content: doc.content,
      },
    });

    // Create chunks (simple paragraph-based chunking for seed data)
    const paragraphs = doc.content.split(/\n\n+/).filter((p) => p.trim().length > 50);
    const chunkSize = 3; // Group paragraphs into chunks of 3
    const chunks: string[] = [];

    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      chunks.push(paragraphs.slice(i, i + chunkSize).join("\n\n"));
    }

    // Delete existing chunks for this document before recreating
    await prisma.knowledgeChunk.deleteMany({ where: { documentId: doc.id } });

    await prisma.knowledgeChunk.createMany({
      data: chunks.map((chunk, index) => ({
        content: chunk,
        chunkIndex: index,
        documentId: doc.id,
      })),
    });
  }

  console.log(`Created ${knowledgeDocuments.length} knowledge base documents with chunks`);

  // ============================================================
  // WORKFLOW TEMPLATES — Task Workflows for Common Permit Types
  // ============================================================

  const workflowTemplates = [
    {
      name: "New Construction Workflow",
      description: "Complete workflow for new construction projects from plans to Certificate of Occupancy",
      permitType: "",
      isDefault: false,
      steps: [
        { title: "Review architectural plans", description: "Review and verify all architectural plans and drawings are complete", priority: "NORMAL", estimatedDays: 3, sortOrder: 1 },
        { title: "Prepare permit application package", description: "Compile all required forms, documents, and supporting materials", priority: "NORMAL", estimatedDays: 2, sortOrder: 2 },
        { title: "Submit application to municipality", description: "Submit complete permit application package to local construction office", priority: "HIGH", estimatedDays: 1, sortOrder: 3 },
        { title: "Await plan review and approval", description: "Municipality reviews submitted plans for code compliance", priority: "NORMAL", estimatedDays: 14, sortOrder: 4 },
        { title: "Address review comments if any", description: "Make required revisions based on plan review feedback", priority: "NORMAL", estimatedDays: 5, sortOrder: 5 },
        { title: "Receive permit approval", description: "Obtain approved permit and posted notice", priority: "NORMAL", estimatedDays: 3, sortOrder: 6 },
        { title: "Schedule foundation inspection", description: "Request inspection before pouring concrete", priority: "HIGH", estimatedDays: 2, sortOrder: 7 },
        { title: "Schedule framing inspection", description: "Request inspection after framing is complete", priority: "NORMAL", estimatedDays: 5, sortOrder: 8 },
        { title: "Schedule rough electrical inspection", description: "Request inspection before covering electrical work", priority: "NORMAL", estimatedDays: 3, sortOrder: 9 },
        { title: "Schedule rough plumbing inspection", description: "Request inspection before covering plumbing work", priority: "NORMAL", estimatedDays: 3, sortOrder: 10 },
        { title: "Schedule HVAC inspection", description: "Request inspection of HVAC system installation", priority: "NORMAL", estimatedDays: 3, sortOrder: 11 },
        { title: "Schedule insulation inspection", description: "Request inspection before installing drywall", priority: "NORMAL", estimatedDays: 2, sortOrder: 12 },
        { title: "Schedule final inspection", description: "Request final inspection after all work is complete", priority: "HIGH", estimatedDays: 5, sortOrder: 13 },
        { title: "Obtain Certificate of Occupancy", description: "Receive CO or CA from municipality", priority: "URGENT", estimatedDays: 3, sortOrder: 14 },
      ],
    },
    {
      name: "Renovation Workflow",
      description: "Workflow for renovation and alteration projects",
      permitType: "RENOVATION",
      isDefault: false,
      steps: [
        { title: "Document existing conditions", description: "Photo documentation and assessment of current conditions", priority: "NORMAL", estimatedDays: 2, sortOrder: 1 },
        { title: "Prepare renovation plans", description: "Create detailed plans showing scope of renovation work", priority: "NORMAL", estimatedDays: 5, sortOrder: 2 },
        { title: "Submit permit application", description: "Submit completed application with plans to municipality", priority: "HIGH", estimatedDays: 1, sortOrder: 3 },
        { title: "Await approval", description: "Wait for plan review and permit approval", priority: "NORMAL", estimatedDays: 10, sortOrder: 4 },
        { title: "Demolition phase (if applicable)", description: "Complete any required demolition work", priority: "NORMAL", estimatedDays: 5, sortOrder: 5 },
        { title: "Construction phase", description: "Execute renovation work per approved plans", priority: "NORMAL", estimatedDays: 14, sortOrder: 6 },
        { title: "Schedule inspections", description: "Request required inspections at appropriate stages", priority: "HIGH", estimatedDays: 2, sortOrder: 7 },
        { title: "Final inspection", description: "Pass final inspection for all work completed", priority: "HIGH", estimatedDays: 3, sortOrder: 8 },
        { title: "Close out permit", description: "Obtain final sign-off and close permit", priority: "NORMAL", estimatedDays: 2, sortOrder: 9 },
      ],
    },
    {
      name: "Simple Permit Workflow",
      description: "Streamlined workflow for straightforward permit applications",
      permitType: "",
      isDefault: true,
      steps: [
        { title: "Gather required documents", description: "Collect all necessary plans, licenses, and supporting documents", priority: "NORMAL", estimatedDays: 3, sortOrder: 1 },
        { title: "Complete permit application", description: "Fill out all required subcode application forms", priority: "NORMAL", estimatedDays: 2, sortOrder: 2 },
        { title: "Submit to local authority", description: "Submit application package to construction office", priority: "HIGH", estimatedDays: 1, sortOrder: 3 },
        { title: "Await review", description: "Wait for plan review by subcode officials", priority: "NORMAL", estimatedDays: 7, sortOrder: 4 },
        { title: "Address corrections if required", description: "Make any requested changes or provide additional information", priority: "NORMAL", estimatedDays: 3, sortOrder: 5 },
        { title: "Receive approval", description: "Obtain approved permit and posted notice", priority: "NORMAL", estimatedDays: 2, sortOrder: 6 },
        { title: "Schedule inspection", description: "Request required inspection at appropriate time", priority: "HIGH", estimatedDays: 2, sortOrder: 7 },
        { title: "Pass inspection", description: "Complete work and pass required inspection", priority: "HIGH", estimatedDays: 1, sortOrder: 8 },
        { title: "Close permit", description: "Receive final approval and close permit", priority: "NORMAL", estimatedDays: 1, sortOrder: 9 },
      ],
    },
  ];

  for (const template of workflowTemplates) {
    await prisma.workflowTemplate.upsert({
      where: { id: `seed-workflow-${template.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {
        description: template.description,
        steps: template.steps,
      },
      create: {
        id: `seed-workflow-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: template.name,
        description: template.description,
        permitType: template.permitType,
        steps: template.steps,
        isDefault: template.isDefault,
      },
    });
  }

  console.log(`Created ${workflowTemplates.length} workflow templates`);

  console.log("\n--- Seed Complete ---");
  console.log("Login with: demo@permitsonthego.com / Password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
