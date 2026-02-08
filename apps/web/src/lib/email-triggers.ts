import { prisma } from "@permits/database";
import {
  sendEmail,
  permitStatusUpdateEmail,
  inspectionReminderEmail,
  partyAddedEmail,
  photoShareEmail,
} from "./email";
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
    const promises = uniqueRecipients.map(async (recipient) => {
      const { subject, html } = await permitStatusUpdateEmail({
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

    const { subject, html } = await partyAddedEmail({
      recipientName: partyName,
      permitTitle: permit.title,
      propertyAddress,
      role,
      addedBy: addedByName,
    });

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

    const promises = uniqueRecipients.map(async (recipient) => {
      const { subject, html } = await inspectionReminderEmail({
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

    const promises = recipientEmails.map(async (email) => {
      const { subject, html } = await photoShareEmail({
        recipientName: "there",
        senderName,
        permitTitle: photo.permit.title,
        photoUrl: photo.fileUrl,
        message,
      });

      return sendEmail({ to: email, subject, html }).catch((err) =>
        console.error(`Failed to email ${email}:`, err)
      );
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("triggerPhotoShareEmails error:", error);
  }
}
