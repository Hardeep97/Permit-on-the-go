import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  notFound,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        licenses: {
          orderBy: { createdAt: "desc" },
        },
        insurance: {
          orderBy: { createdAt: "desc" },
        },
        photos: {
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return notFound("Vendor profile");
    }

    return success(vendor);
  } catch (error) {
    console.error("Get vendor profile error:", error);
    return serverError("Failed to get vendor profile");
  }
}
