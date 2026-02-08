import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set — emails will be logged but not sent");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "Permits on the Go <noreply@permitsonthego.com>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];

  if (!resend) {
    console.log("[Email Preview]", { to: recipients, subject });
    return { id: "preview-" + Date.now() };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: recipients,
    subject,
    html,
    replyTo,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

// Pre-built email templates

export function permitStatusUpdateEmail(params: {
  recipientName: string;
  permitTitle: string;
  propertyAddress: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
}) {
  return {
    subject: `Permit Update: ${params.permitTitle} — ${params.newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Permits on the Go</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${params.recipientName},</p>
          <p>The status of a permit you're involved with has been updated:</p>
          <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Permit:</strong> ${params.permitTitle}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${params.propertyAddress}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${params.oldStatus} → <strong>${params.newStatus}</strong></p>
            <p style="margin: 4px 0;"><strong>Updated by:</strong> ${params.updatedBy}</p>
          </div>
          <p style="color: #6B7280; font-size: 12px;">You're receiving this because you're a party on this permit.</p>
        </div>
      </div>
    `,
  };
}

export function photoShareEmail(params: {
  recipientName: string;
  senderName: string;
  permitTitle: string;
  photoUrl: string;
  message?: string;
}) {
  return {
    subject: `${params.senderName} shared a photo from ${params.permitTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Permits on the Go</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${params.recipientName || "there"},</p>
          <p><strong>${params.senderName}</strong> shared a photo from the permit "${params.permitTitle}":</p>
          ${params.message ? `<p style="background: #F9FAFB; padding: 12px; border-radius: 8px; font-style: italic;">"${params.message}"</p>` : ""}
          <div style="text-align: center; margin: 16px 0;">
            <img src="${params.photoUrl}" style="max-width: 100%; border-radius: 8px;" alt="Permit photo" />
          </div>
          <p style="color: #6B7280; font-size: 12px;">Sent via Permits on the Go</p>
        </div>
      </div>
    `,
  };
}

export function inspectionReminderEmail(params: {
  recipientName: string;
  permitTitle: string;
  propertyAddress: string;
  inspectionType: string;
  inspectionDate: string;
  inspectorName?: string;
}) {
  return {
    subject: `Inspection Reminder: ${params.inspectionType} — ${params.inspectionDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Inspection Reminder</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${params.recipientName},</p>
          <p>You have an upcoming inspection:</p>
          <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Type:</strong> ${params.inspectionType}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${params.inspectionDate}</p>
            <p style="margin: 4px 0;"><strong>Permit:</strong> ${params.permitTitle}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${params.propertyAddress}</p>
            ${params.inspectorName ? `<p style="margin: 4px 0;"><strong>Inspector:</strong> ${params.inspectorName}</p>` : ""}
          </div>
          <p>Make sure the site is ready for inspection.</p>
          <p style="color: #6B7280; font-size: 12px;">Sent via Permits on the Go</p>
        </div>
      </div>
    `,
  };
}
