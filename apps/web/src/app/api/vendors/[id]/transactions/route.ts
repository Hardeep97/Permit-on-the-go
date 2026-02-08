import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const [transactions, total] = await Promise.all([
      prisma.vendorTransaction.findMany({
        where: { vendorId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vendorTransaction.count({ where: { vendorId: id } }),
    ]);

    return success({
      transactions,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List vendor transactions error:", error);
    return serverError("Failed to list transactions");
  }
}
