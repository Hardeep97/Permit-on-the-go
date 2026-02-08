import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createVendorReviewSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const [reviews, total] = await Promise.all([
      prisma.vendorReview.findMany({
        where: { vendorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vendorReview.count({ where: { vendorId: id } }),
    ]);

    return success({
      reviews,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List vendor reviews error:", error);
    return serverError("Failed to list reviews");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vendor) {
      return notFound("Vendor");
    }

    // Can't review own profile
    if (vendor.userId === user.id) {
      return forbidden("You cannot review your own profile");
    }

    // Check if user already reviewed this vendor
    const existingReview = await prisma.vendorReview.findFirst({
      where: {
        vendorId: id,
        reviewerId: user.id,
      },
    });

    if (existingReview) {
      return badRequest("You have already reviewed this vendor");
    }

    const body = await request.json();
    const parsed = createVendorReviewSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    // Create review
    const review = await prisma.vendorReview.create({
      data: {
        ...parsed.data,
        vendorId: id,
        reviewerId: user.id,
      },
    });

    // Recalculate vendor rating and review count
    const stats = await prisma.vendorReview.aggregate({
      where: { vendorId: id },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.vendorProfile.update({
      where: { id },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });

    return success(review, 201);
  } catch (error) {
    console.error("Create vendor review error:", error);
    return serverError("Failed to create review");
  }
}
