import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { addVendorInsuranceSchema } from "@permits/shared";
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

    const insurance = await prisma.vendorInsurance.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
    });

    return success(insurance);
  } catch (error) {
    console.error("List vendor insurance error:", error);
    return serverError("Failed to list insurance");
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

    if (vendor.userId !== user.id) {
      return forbidden("Not your vendor profile");
    }

    const body = await request.json();
    const parsed = addVendorInsuranceSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const insurance = await prisma.vendorInsurance.create({
      data: {
        ...parsed.data,
        vendorId: id,
        expiresAt: new Date(parsed.data.expiresAt),
      },
    });

    return success(insurance, 201);
  } catch (error) {
    console.error("Add vendor insurance error:", error);
    return serverError("Failed to add insurance");
  }
}
