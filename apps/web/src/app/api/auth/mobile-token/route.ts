import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@permits/database";
import { loginSchema } from "@permits/shared";
import { success, badRequest, serverError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user || !user.password) {
      return badRequest("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return badRequest("Invalid email or password");
    }

    // Generate JWT for mobile
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
    const accessToken = jwt.sign({ userId: user.id }, secret, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId: user.id, type: "refresh" }, secret, {
      expiresIn: "30d",
    });

    return success({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        onboardingComplete: user.onboardingComplete,
        plan: user.subscription?.plan || "FREE",
      },
    });
  } catch (error) {
    console.error("Mobile token error:", error);
    return serverError("Authentication failed");
  }
}
