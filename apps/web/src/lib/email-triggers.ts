import { prisma } from "@permits/database";
import { sendEmail, permitStatusUpdateEmail, inspectionReminderEmail } from "./email";
import { PERMIT_STATUS_LABELS } from "@permits/shared";

/**
 * Send emails to all parties when a permit status changes.
 */
export async function triggerStatusChangeEmails(
  permitId: string,
  actorUserId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: {
        property: { select: { address: true, city: true, state: true } },
        parties: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            contact: { select: { name: true, email: true } },
          },
        },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!permit) return;

    const actorName =
      permit.creator.id === actorUserId
        ? permit.creator.name
        : permit.parties.find((p) => p.user?.id === actorUserId)?.user?.name || "System";

    const propertyAddress = `${permit.property?.address}, ${permit.property?.city}, ${permit.property?.state}`;
    const oldLabel = PERMIT_STATUS_LABELS[oldStatus as keyof typeof PERMIT_STATUS_LABELS] || oldStatus;
    const newLabel = PERMIT_STATUS_LABELS[newStatus as keyof typeof PERMIT_STATUS_LABELS] || newStatus;

    // Collect all recipients (except the actor)
    const recipients: { name: string; email: string }[] = [];

    // Add creator
    if (permit.creator.id !== actorUserId && permit.creator.email) {
      recipients.push({ name: permit.creator.name || "User", email: permit.creator.email });
    }

    // Add party users and contacts
    for (const party of permit.parties) {
      if (party.user && party.user.id !== actorUserId && party.user.email) {
        recipients.push({ name: party.user.name || "User", email: party.user.email });
      }
      if (party.contact?.email) {
        recipients.push({ name: party.contact.name || "Contact", email: party.contact.email });
      }
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const uniqueRecipients = recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    // Send emails in parallel
    const promises = uniqueRecipients.map((recipient) => {
      const { subject, html } = permitStatusUpdateEmail({
        recipientName: recipient.name,
        permitTitle: permit.title,
        propertyAddress,
        oldStatus: oldLabel,
        newStatus: newLabel,
        updatedBy: actorName || "Unknown",
      });

      return sendEmail({ to: recipient.email, subject, html }).catch((err) =>
        console.error(`Failed to email ${recipient.email}:`, err)
      );
    });

    await Promise.allSettled(promises);

    // Log emails sent
    await prisma.emailLog.createMany({
      data: uniqueRecipients.map((r) => ({
        to: r.email,
        subject: `Permit Update: ${permit.title} — ${newLabel}`,
        body: `Status changed from ${oldLabel} to ${newLabel}`,
        status: "SENT",
        permitId,
      })),
    });
  } catch (error) {
    console.error("triggerStatusChangeEmails error:", error);
  }
}

/**
 * Send email when a new party is added to a permit.
 */
export async function triggerPartyAddedEmail(
  permitId: string,
  partyEmail: string,
  partyName: string,
  role: string,
  addedByName: string
) {
  try {
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: {
        property: { select: { address: true, city: true, state: true } },
      },
    });

    if (!permit || !partyEmail) return;

    const propertyAddress = `${permit.property?.address}, ${permit.property?.city}, ${permit.property?.state}`;

    const { subject, html } = {
      subject: `You've been added to a permit: ${permit.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">Permits on the Go</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hi ${partyName},</p>
            <p><strong>${addedByName}</strong> has added you as <strong>${role}</strong> on the following permit:</p>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Permit:</strong> ${permit.title}</p>
              <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
              <p style="margin: 4px 0;"><strong>Your Role:</strong> ${role}</p>
            </div>
            <p>You can now view and collaborate on this permit through the platform.</p>
            <p style="color: #6B7280; font-size: 12px;">Sent via Permits on the Go</p>
          </div>
        </div>
      `,
    };

    await sendEmail({ to: partyEmail, subject, html });
  } catch (error) {
    console.error("triggerPartyAddedEmail error:", error);
  }
}

/**
 * Send inspection reminder emails to all parties on a permit.
 */
export async function triggerInspectionReminderEmails(
  permitId: string,
  inspectionType: string,
  inspectionDate: string,
  inspectorName?: string
) {
  try {
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: {
        property: { select: { address: true, city: true, state: true } },
        creator: { select: { name: true, email: true } },
        parties: {
          include: {
            user: { select: { name: true, email: true } },
            contact: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!permit) return;

    const propertyAddress = `${permit.property?.address}, ${permit.property?.city}, ${permit.property?.state}`;
    const recipients: { name: string; email: string }[] = [];

    if (permit.creator.email) {
      recipients.push({ name: permit.creator.name || "User", email: permit.creator.email });
    }

    for (const party of permit.parties) {
      if (party.user?.email) {
        recipients.push({ name: party.user.name || "User", email: party.user.email });
      }
      if (party.contact?.email) {
        recipients.push({ name: party.contact.name || "Contact", email: party.contact.email });
      }
    }

    const seen = new Set<string>();
    const uniqueRecipients = recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    const promises = uniqueRecipients.map((recipient) => {
      const { subject, html } = inspectionReminderEmail({
        recipientName: recipient.name,
        permitTitle: permit.title,
        propertyAddress,
        inspectionType: inspectionType.replace(/_/g, " "),
        inspectionDate,
        inspectorName,
      });

      return sendEmail({ to: recipient.email, subject, html }).catch((err) =>
        console.error(`Failed to email ${recipient.email}:`, err)
      );
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("triggerInspectionReminderEmails error:", error);
  }
}

/**
 * Send photo share emails to selected recipients.
 */
export async function triggerPhotoShareEmails(
  photoId: string,
  senderName: string,
  recipientEmails: string[],
  message?: string
) {
  try {
    const photo = await prisma.permitPhoto.findUnique({
      where: { id: photoId },
      include: {
        permit: { select: { title: true } },
      },
    });

    if (!photo) return;

    const promises = recipientEmails.map((email) => {
      const { subject, html } = {
        subject: `${senderName} shared a photo from ${photo.permit.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">Permits on the Go</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi there,</p>
              <p><strong>${senderName}</strong> shared a photo from the permit "${photo.permit.title}":</p>
              ${message ? `<p style="background: #F9FAFB; padding: 12px; border-radius: 8px; font-style: italic;">"${message}"</p>` : ""}
              <div style="text-align: center; margin: 16px 0;">
                <img src="${photo.fileUrl}" style="max-width: 100%; border-radius: 8px;" alt="Permit photo" />
              </div>
              <p style="color: #6B7280; font-size: 12px;">Sent via Permits on the Go</p>
            </div>
          </div>
        `,
      };

      return sendEmail({ to: email, subject, html }).catch((err) =>
        console.error(`Failed to email ${email}:`, err)
      );
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("triggerPhotoShareEmails error:", error);
  }
}
