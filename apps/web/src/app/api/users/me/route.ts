import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { updateProfileSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        onboardingComplete: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            aiCreditsRemaining: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            ownedProperties: true,
            permits: true,
          },
        },
      },
    });

    return success(user);
  } catch (error) {
    console.error("Get user error:", error);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return unauthorized();

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        onboardingComplete: true,
      },
    });

    return success(user);
  } catch (error) {
    console.error("Update user error:", error);
    return serverError("Failed to update profile");
  }
}
