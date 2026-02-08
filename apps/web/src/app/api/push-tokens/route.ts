import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  success,
  serverError,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { token, platform } = body;

    if (!token) return badRequest("Push token is required");
    if (!platform || !["IOS", "ANDROID", "WEB"].includes(platform)) {
      return badRequest("Platform must be IOS, ANDROID, or WEB");
    }

    // Upsert — same token can only belong to one user
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { userId: user.id, platform },
      create: { token, platform, userId: user.id },
    });

    return success(pushToken, 201);
  } catch (error) {
    console.error("Register push token error:", error);
    return serverError("Failed to register push token");
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) return badRequest("Push token is required");

    await prisma.pushToken.deleteMany({
      where: { token, userId: user.id },
    });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete push token error:", error);
    return serverError();
  }
}
