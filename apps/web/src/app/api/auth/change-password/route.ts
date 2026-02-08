import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@permits/database";
import { changePasswordSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  success,
  serverError,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return unauthorized();

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { password: true },
    });

    if (!user?.password) {
      return badRequest(
        "Cannot change password for accounts using social login"
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return badRequest("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: authUser.id },
      data: { password: hashedPassword },
    });

    return success({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return serverError("Failed to change password");
  }
}
