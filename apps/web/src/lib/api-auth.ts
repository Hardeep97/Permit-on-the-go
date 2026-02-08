import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { authOptions } from "./auth";
import { prisma } from "@permits/database";

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Get the authenticated user from either NextAuth session (web) or JWT Bearer token (mobile)
 */
export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthUser | null> {
  // Try NextAuth session first (web)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: (session.user as { id: string }).id,
      email: session.user.email!,
      name: session.user.name!,
    };
  }

  // Try Bearer token (mobile)
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!
        ) as { userId: string };

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true },
        });

        if (user) return user;
      } catch {
        // Invalid token
      }
    }
  }

  return null;
}

/**
 * Helper to create a standardized JSON error response
 */
export function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: message, code: "BAD_REQUEST" },
    { status: 400 }
  );
}

export function notFound(entity: string = "Resource") {
  return NextResponse.json(
    { success: false, error: `${entity} not found`, code: "NOT_FOUND" },
    { status: 404 }
  );
}

export function serverError(message: string = "Internal server error") {
  return NextResponse.json(
    { success: false, error: message, code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export function success<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
