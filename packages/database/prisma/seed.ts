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
