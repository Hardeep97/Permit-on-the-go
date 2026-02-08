import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createPropertySchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { ownerId: user.id };
    if (state) where.state = state;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          jurisdiction: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { permits: true, documents: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);

    return success({
      properties,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List properties error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    // Check subscription limits for free users
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (subscription?.plan === "FREE") {
      const propertyCount = await prisma.property.count({
        where: { ownerId: user.id },
      });
      if (propertyCount >= 1) {
        return badRequest(
          "Free plan is limited to 1 property. Upgrade to Annual ($250/year) for unlimited properties."
        );
      }
    }

    // Try to find matching jurisdiction
    let jurisdictionId: string | undefined;
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        state: parsed.data.state,
        name: { contains: parsed.data.city, mode: "insensitive" },
      },
    });
    if (jurisdiction) {
      jurisdictionId = jurisdiction.id;
    }

    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        ownerId: user.id,
        jurisdictionId,
      },
      include: {
        jurisdiction: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { permits: true },
        },
      },
    });

    return success(property, 201);
  } catch (error) {
    console.error("Create property error:", error);
    return serverError("Failed to create property");
  }
}
