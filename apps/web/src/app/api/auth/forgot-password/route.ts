import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@permits/database";
import { forgotPasswordSchema } from "@permits/shared";
import { success, badRequest, serverError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return success({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:
          process.env.EMAIL_FROM || "Permits OTG <noreply@permitsonthego.com>",
        to: user.email,
        subject: "Reset your password - Permits on the Go",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      // Don't fail the request if email fails in dev
    }

    return success({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return serverError("Failed to process request");
  }
}
