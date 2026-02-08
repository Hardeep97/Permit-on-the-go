import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@permits/database";
import { resetPasswordSchema } from "@permits/shared";
import { success, badRequest, serverError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return badRequest("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return success({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return serverError("Failed to reset password");
  }
}
