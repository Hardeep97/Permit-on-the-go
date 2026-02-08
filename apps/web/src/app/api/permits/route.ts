import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createPermitSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const subcodeType = searchParams.get("subcodeType");
    const propertyId = searchParams.get("propertyId");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { creatorId: user.id };
    if (status) where.status = status;
    if (subcodeType) where.subcodeType = subcodeType;
    if (propertyId) where.propertyId = propertyId;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { permitNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [permits, total] = await Promise.all([
      prisma.permit.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, address: true, city: true, state: true },
          },
          _count: {
            select: {
              milestones: true,
              documents: true,
              photos: true,
              parties: true,
              inspections: true,
              tasks: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.permit.count({ where }),
    ]);

    return success({
      permits,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List permits error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createPermitSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: parsed.data.propertyId, ownerId: user.id },
    });
    if (!property) {
      return badRequest("Property not found or access denied");
    }

    const permit = await prisma.permit.create({
      data: {
        ...parsed.data,
        creatorId: user.id,
        jurisdictionId: property.jurisdictionId,
        organizationId: property.organizationId,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true, state: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATED,
      entityType: "PERMIT",
      entityId: permit.id,
      description: `Created permit "${permit.title}" for ${property.name}`,
      permitId: permit.id,
    });

    return success(permit, 201);
  } catch (error) {
    console.error("Create permit error:", error);
    return serverError("Failed to create permit");
  }
}
