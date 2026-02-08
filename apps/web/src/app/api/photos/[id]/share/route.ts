import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";
import { triggerPhotoShareEmails } from "@/lib/email-triggers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return badRequest("At least one recipient is required");
    }

    const photo = await prisma.permitPhoto.findUnique({
      where: { id },
      include: { permit: true },
    });
    if (!photo) return notFound("Photo");

    // Create share records
    const shares = await Promise.all(
      recipients.map(
        (r: { email: string; name?: string; message?: string }) =>
          prisma.permitPhotoShare.create({
            data: {
              photoId: id,
              recipientEmail: r.email,
              recipientName: r.name,
              message: r.message,
            },
          })
      )
    );

    // Send emails to all recipients
    const recipientEmails = recipients.map((r: { email: string }) => r.email);
    const shareMessage = recipients[0]?.message;
    triggerPhotoShareEmails(id, user.name, recipientEmails, shareMessage).catch(console.error);

    await logActivity({
      userId: user.id,
      action: ACTIONS.PHOTO_SHARED,
      entityType: "PHOTO",
      entityId: id,
      description: `Shared photo with ${recipients.length} recipient(s)`,
      permitId: photo.permitId,
      metadata: { recipientEmails: recipients.map((r: { email: string }) => r.email) },
    });

    return success({ shares, count: shares.length });
  } catch (error) {
    console.error("Share photo error:", error);
    return serverError("Failed to share photo");
  }
}
