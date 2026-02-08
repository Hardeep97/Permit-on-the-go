import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { success, badRequest, serverError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const city = searchParams.get("city");

    if (!state) return badRequest("state is required");
    if (!city) return badRequest("city is required");

    // First try exact match on name + state
    let jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        state,
        name: city,
      },
      include: {
        parent: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { children: true, properties: true, permits: true },
        },
      },
    });

    // Then try contains match (case insensitive)
    if (!jurisdiction) {
      jurisdiction = await prisma.jurisdiction.findFirst({
        where: {
          state,
          name: { contains: city, mode: "insensitive" },
        },
        include: {
          parent: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { children: true, properties: true, permits: true },
          },
        },
      });
    }

    return success(jurisdiction);
  } catch (error) {
    console.error("Lookup jurisdiction error:", error);
    return serverError();
  }
}
