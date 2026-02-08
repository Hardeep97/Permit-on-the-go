import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createVendorProfileSchema, vendorSearchSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = vendorSearchSchema.safeParse({
      query: searchParams.get("query") ?? undefined,
      subcodeType: searchParams.get("subcodeType") ?? undefined,
      serviceArea: searchParams.get("serviceArea") ?? undefined,
      isVerified: searchParams.get("isVerified") ?? undefined,
      minRating: searchParams.get("minRating") ?? undefined,
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "12",
    });

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { query, subcodeType, serviceArea, isVerified, minRating, page, pageSize } = parsed.data;

    const where: Record<string, unknown> = { isActive: true };

    if (query) {
      where.companyName = { contains: query, mode: "insensitive" };
    }

    if (subcodeType) {
      where.licenses = {
        some: { subcodeType },
      };
    }

    if (serviceArea) {
      where.serviceAreas = { has: serviceArea };
    }

    if (isVerified) {
      where.isVerified = true;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    const [vendors, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          licenses: true,
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vendorProfile.count({ where }),
    ]);

    return success({
      vendors,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List vendors error:", error);
    return serverError("Failed to list vendors");
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createVendorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    // Check if user already has a vendor profile
    const existing = await prisma.vendorProfile.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return badRequest("You already have a vendor profile");
    }

    const vendorProfile = await prisma.vendorProfile.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return success(vendorProfile, 201);
  } catch (error) {
    console.error("Create vendor profile error:", error);
    return serverError("Failed to create vendor profile");
  }
}
