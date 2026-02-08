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

  // ============================================================
  // MULTI-STATE JURISDICTIONS — All 50 States + DC + Top Cities
  // ============================================================

  const usStates: { code: string; name: string }[] = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" },
  ];

  // Map stateCode -> jurisdictionId for parentId references
  const stateJurisdictionMap = new Map<string, string>();

  // NJ already created above, store its id
  stateJurisdictionMap.set("NJ", njState.id);

  for (const st of usStates) {
    const stateRecord = await prisma.jurisdiction.upsert({
      where: { name_state_type: { name: st.name, state: st.code, type: "STATE" } },
      update: {},
      create: {
        name: st.name,
        type: "STATE",
        state: st.code,
        isVerified: true,
      },
    });
    stateJurisdictionMap.set(st.code, stateRecord.id);
  }

  console.log(`Created ${usStates.length} additional state jurisdictions (${usStates.length + 1} total including NJ)`);

  // Top 10 cities per 14 major states
  const stateCities: Record<string, string[]> = {
    NY: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
    CA: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Long Beach", "Fresno", "Anaheim", "Santa Ana"],
    PA: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "York"],
    FL: ["Miami", "Jacksonville", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Fort Lauderdale", "Tallahassee", "Cape Coral", "Pembroke Pines"],
    TX: ["Houston", "Dallas", "San Antonio", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
    IL: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield", "Elgin", "Peoria", "Champaign", "Waukegan"],
    OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Canton", "Youngstown", "Lorain", "Hamilton"],
    GA: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Roswell", "Macon", "Johns Creek", "Albany"],
    NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"],
    MA: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"],
    CT: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden"],
    VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk"],
    MD: ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Waldorf", "Glen Burnie", "Ellicott City", "Frederick", "Dundalk", "Rockville"],
    WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Federal Way", "Spokane Valley"],
  };

  let totalCitiesCreated = 0;

  for (const [stateCode, cities] of Object.entries(stateCities)) {
    const parentId = stateJurisdictionMap.get(stateCode);
    for (const cityName of cities) {
      await prisma.jurisdiction.upsert({
        where: { name_state_type: { name: cityName, state: stateCode, type: "CITY" } },
        update: {},
        create: {
          name: cityName,
          type: "CITY",
          state: stateCode,
          parentId: parentId,
          isVerified: true,
        },
      });
      totalCitiesCreated++;
    }
  }

  console.log(`Created ${totalCitiesCreated} city jurisdictions across ${Object.keys(stateCities).length} states`);

  // ============================================================
  // STATE PERMIT GUIDE KNOWLEDGE DOCS — Top 5 States
  // ============================================================

  const statePermitGuides = [
    {
      id: "kb-ny-permit-guide",
      title: "New York State Building Code & Permit Guide",
      source: "ny-permit-guide",
      sourceType: "GUIDE",
      jurisdiction: "NY",
      content: `# New York State Building Code & Permit Guide

## Building Code System

New York State enforces the Uniform Fire Prevention and Building Code, commonly known as the NYS Building Code. The code is based on the International Code Council (ICC) family of codes with New York-specific amendments. The NYS Department of State, Division of Building Standards and Codes oversees the statewide code.

## Key Agencies

- **NYS Department of State, Division of Building Standards and Codes**: Sets statewide building standards, provides training, and oversees local enforcement.
- **NYC Department of Buildings (DOB)**: New York City operates its own building code (NYC Building Code) separate from the rest of the state, based on the 1968 code with ongoing updates.
- **Local Code Enforcement Officers**: Outside NYC, municipalities appoint local code enforcement officials who review plans, issue permits, and conduct inspections.

## General Permit Process

1. Determine if a permit is required by contacting your local building department or NYC DOB.
2. Prepare construction documents including architectural and engineering plans.
3. Submit the application with all required forms, fees, and supporting documents.
4. Await plan review by the code enforcement official (timelines vary by municipality).
5. Receive the building permit upon approval.
6. Post the permit at the job site and begin work per approved plans.
7. Schedule inspections at required stages (foundation, framing, rough trades, final).
8. Obtain a Certificate of Occupancy or Certificate of Compliance upon passing final inspection.

## Notable Requirements

- NYC projects must comply with the NYC Building Code which has unique zoning and energy requirements.
- The state mandates energy code compliance per the NYS Energy Conservation Construction Code (based on IECC).
- Asbestos surveys are required for renovation or demolition of structures built before 1974 under state labor law.
- Licensed professional engineers (PE) or registered architects (RA) must stamp plans for most non-exempt projects.
- New York requires a 10-day notice to the Department of Labor for certain demolition and construction activities.`,
    },
    {
      id: "kb-ca-permit-guide",
      title: "California Building Code & Permit Guide",
      source: "ca-permit-guide",
      sourceType: "GUIDE",
      jurisdiction: "CA",
      content: `# California Building Code & Permit Guide

## Building Code System

California enforces the California Building Standards Code, commonly known as Title 24, published by the California Building Standards Commission (CBSC). Title 24 consists of 12 parts covering building, electrical, mechanical, plumbing, energy, fire, and accessibility standards. California adopts the ICC model codes with extensive state amendments, making it one of the most stringent codes in the nation.

## Key Agencies

- **California Building Standards Commission (CBSC)**: Adopts and publishes the California Building Standards Code (Title 24).
- **Division of the State Architect (DSA)**: Reviews plans for public schools and community colleges.
- **Office of Statewide Health Planning and Development (OSHPD)**: Reviews plans for hospitals and healthcare facilities.
- **Local Building Departments**: Cities and counties enforce Title 24 for most private construction. Each jurisdiction may adopt local amendments that are more restrictive than the state code.

## General Permit Process

1. Check with your local building department to determine required permits and local amendments.
2. Prepare plans that comply with all applicable parts of Title 24.
3. Submit permit application with construction documents to the local building department.
4. Plan check review (typically 2-6 weeks depending on project complexity).
5. Pay permit fees, which are generally based on project valuation.
6. Receive the building permit and begin construction.
7. Schedule inspections at required milestones (foundation, framing, electrical, plumbing, mechanical, energy, final).
8. Obtain a Certificate of Occupancy after passing all final inspections.

## Notable Requirements

- Title 24 Part 6 (Energy Code) imposes rigorous energy efficiency standards, including mandatory solar photovoltaic systems on new residential construction since 2020.
- California requires seismic design per the California Building Code (CBC), which is more stringent than the base IBC.
- CalGreen (Title 24 Part 11) mandates green building standards for new construction and major renovations.
- Accessory Dwelling Unit (ADU) legislation streamlines permitting for secondary units statewide.
- The California Environmental Quality Act (CEQA) may apply to larger projects, requiring environmental review.`,
    },
    {
      id: "kb-pa-permit-guide",
      title: "Pennsylvania Building Code & Permit Guide",
      source: "pa-permit-guide",
      sourceType: "GUIDE",
      jurisdiction: "PA",
      content: `# Pennsylvania Building Code & Permit Guide

## Building Code System

Pennsylvania enforces the Uniform Construction Code (PA UCC) under Act 45 of 1999. The PA UCC adopts the ICC family of codes including the International Building Code (IBC), International Residential Code (IRC), International Mechanical Code (IMC), International Plumbing Code (IPC), International Energy Conservation Code (IECC), and International Fire Code (IFC). The code is updated on a triennial cycle following ICC updates.

## Key Agencies

- **Pennsylvania Department of Labor & Industry (L&I)**: Administers and enforces the PA UCC statewide. Sets building code standards and certifies building code officials.
- **Local Code Enforcement Agencies**: Municipalities can choose to enforce the UCC locally by adopting an ordinance and employing certified code officials. If a municipality opts out, the state's third-party agency program provides enforcement.
- **Third-Party Agencies**: Approved by L&I to conduct plan reviews and inspections in municipalities that do not have their own code enforcement programs.

## General Permit Process

1. Contact your local building department or L&I to identify which entity handles permits in your municipality.
2. Prepare construction documents in compliance with the PA UCC.
3. Submit the permit application along with plans and required documentation.
4. Plan review is conducted by the local code official or approved third-party agency.
5. Pay applicable permit fees upon approval.
6. Receive the building permit and post it at the construction site.
7. Schedule inspections at each phase: foundation, framing, rough-in (electrical, plumbing, mechanical), insulation, and final.
8. Obtain a Certificate of Occupancy after passing all required final inspections.

## Notable Requirements

- Pennsylvania requires all building code officials to be certified through L&I training programs.
- Residential buildings of three stories or fewer follow the IRC; all others follow the IBC.
- Act 13 (impact fee law) may apply in areas near natural gas drilling operations.
- Accessibility requirements follow the PA UCC and the Americans with Disabilities Act (ADA).
- Municipalities that opt out of local enforcement must use L&I-approved third-party agencies, which can affect review timelines.`,
    },
    {
      id: "kb-fl-permit-guide",
      title: "Florida Building Code & Permit Guide",
      source: "fl-permit-guide",
      sourceType: "GUIDE",
      jurisdiction: "FL",
      content: `# Florida Building Code & Permit Guide

## Building Code System

Florida enforces the Florida Building Code (FBC), administered by the Florida Building Commission under the Florida Department of Business and Professional Regulation (DBPR). The FBC is based on the ICC model codes with significant Florida-specific amendments, particularly for hurricane and wind resistance. The code is updated on a triennial cycle and includes the Florida Building Code - Building, Residential, Existing Building, Mechanical, Plumbing, Fuel Gas, and Energy Conservation volumes.

## Key Agencies

- **Florida Building Commission**: Adopts and maintains the Florida Building Code. Oversees the code development process with public input.
- **Florida Department of Business and Professional Regulation (DBPR)**: Licenses contractors and regulates building-related professions.
- **Local Building Departments**: Cities and counties enforce the FBC. Local jurisdictions may not adopt local technical amendments that are less stringent than the FBC.
- **Miami-Dade County**: Maintains additional high-velocity hurricane zone (HVHZ) requirements with its own product approval process.

## General Permit Process

1. Contact your local building department to determine permit requirements.
2. Prepare construction documents compliant with the current edition of the FBC.
3. Submit the permit application with plans, surveys, and required documents.
4. Plan review by local building officials (Florida law requires a 30-business-day maximum for review of single-family residential permits).
5. Pay permit and impact fees.
6. Receive the building permit.
7. Schedule inspections at required stages: foundation, slab, framing, roofing, rough-in trades, insulation, and final.
8. Obtain a Certificate of Occupancy or Certificate of Completion upon passing final inspection.

## Notable Requirements

- Florida's High-Velocity Hurricane Zone (HVHZ) code applies in Miami-Dade and Broward counties with stricter wind-resistance standards.
- All products used in construction must be approved through the Florida Product Approval system.
- Licensed general contractors, building contractors, or specialty contractors are required for most work (homeowner exemptions exist for owner-occupied single-family homes).
- The Florida Energy Code mandates energy efficiency standards including HVAC efficiency, insulation, and fenestration requirements.
- Flood zone compliance is required in FEMA-designated flood hazard areas, which are extensive throughout Florida.`,
    },
    {
      id: "kb-tx-permit-guide",
      title: "Texas Building Code & Permit Guide",
      source: "tx-permit-guide",
      sourceType: "GUIDE",
      jurisdiction: "TX",
      content: `# Texas Building Code & Permit Guide

## Building Code System

Texas does not have a mandatory statewide building code for all construction. Instead, the state sets minimum standards for certain building types and allows municipalities to adopt and enforce their own building codes. Most Texas cities adopt the International Building Code (IBC) and International Residential Code (IRC) with local amendments. Unincorporated areas in many counties have no building code enforcement at all. For specific building types, the state mandates compliance: the Texas Industrialized Housing and Buildings program governs factory-built structures, and the Texas Accessibility Standards (TAS) apply statewide.

## Key Agencies

- **Texas Department of Licensing and Regulation (TDLR)**: Enforces the Texas Accessibility Standards (TAS), regulates industrialized housing, and licenses certain trades (electricians, HVAC technicians).
- **Texas Department of Insurance (TDI)**: Regulates windstorm-resistant construction along the Texas Gulf Coast through the Windstorm Inspection Program.
- **Local Building Departments**: Cities and some counties adopt and enforce building codes locally. Houston, Dallas, San Antonio, Austin, and other major cities have their own building departments and adopted codes.

## General Permit Process

1. Contact your city or county building department to determine if permits are required in your jurisdiction.
2. Prepare construction documents in compliance with the locally adopted code edition.
3. Submit the permit application with plans, site surveys, and required documentation.
4. Plan review by local building officials (review timelines vary by city; some cities offer expedited review for a fee).
5. Pay permit fees, typically based on project valuation or square footage.
6. Receive the building permit and post it at the construction site.
7. Schedule inspections at required stages: foundation, framing, mechanical, electrical, plumbing, insulation, and final.
8. Obtain a Certificate of Occupancy after passing all inspections.

## Notable Requirements

- Texas does not require a state contractor license; licensing is handled at the municipal level. Some cities require contractor registration.
- The Texas Windstorm Insurance Association (TWIA) requires windstorm-resistant construction certificates (WPI-8) for properties in designated coastal counties.
- Licensed electricians are required statewide (regulated by TDLR). HVAC contractors need state registration.
- Texas Accessibility Standards (TAS) based on ADA apply to commercial and public buildings statewide.
- Rural and unincorporated areas may have minimal or no building code enforcement, but lender and insurance requirements still apply.`,
    },
  ];

  for (const doc of statePermitGuides) {
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
    const chunkSize = 3;
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

  console.log(`Created ${statePermitGuides.length} state permit guide knowledge documents with chunks`);

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
