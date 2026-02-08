import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { getAuthenticatedUser, unauthorized, success, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const county = searchParams.get("county");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // STATE, COUNTY, CITY, TOWNSHIP, etc.

    const where: Record<string, unknown> = {};

    if (state) where.state = state;
    if (county) where.county = county;
    if (type) where.type = type;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const jurisdictions = await prisma.jurisdiction.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        state: true,
        county: true,
        permitPortalUrl: true,
        phone: true,
        email: true,
        address: true,
        officeHours: true,
        fees: true,
        isVerified: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return success(jurisdictions);
  } catch (error) {
    console.error("List jurisdictions error:", error);
    return serverError();
  }
}
