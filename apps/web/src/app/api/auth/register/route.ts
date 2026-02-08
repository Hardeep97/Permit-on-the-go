import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@permits/database";
import { registerSchema } from "@permits/shared";
import { success, badRequest, serverError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return badRequest("An account with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with free subscription
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
            aiCreditsRemaining: 5,
            aiCreditsTotal: 5,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return success(user, 201);
  } catch (error) {
    console.error("Registration error:", error);
    return serverError("Failed to create account");
  }
}
