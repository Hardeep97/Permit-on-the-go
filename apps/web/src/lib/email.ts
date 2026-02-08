import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import {
  PermitStatusEmail,
  InspectionReminderEmail,
  PartyAddedEmail,
  PhotoShareEmail,
} from "@permits/email-templates";

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

// React Email template renderers

export async function permitStatusUpdateEmail(params: {
  recipientName: string;
  permitTitle: string;
  propertyAddress: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
}) {
  const html = await render(
    createElement(PermitStatusEmail, {
      userName: params.recipientName,
      permitTitle: params.permitTitle,
      propertyAddress: params.propertyAddress,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      updatedBy: params.updatedBy,
    })
  );

  return {
    subject: `Permit Update: ${params.permitTitle} — ${params.newStatus}`,
    html,
  };
}

export async function inspectionReminderEmail(params: {
  recipientName: string;
  permitTitle: string;
  propertyAddress: string;
  inspectionType: string;
  inspectionDate: string;
  inspectorName?: string;
}) {
  const html = await render(
    createElement(InspectionReminderEmail, {
      userName: params.recipientName,
      permitTitle: params.permitTitle,
      propertyAddress: params.propertyAddress,
      inspectionType: params.inspectionType,
      inspectionDate: params.inspectionDate,
      inspectorName: params.inspectorName,
    })
  );

  return {
    subject: `Inspection Reminder: ${params.inspectionType} — ${params.inspectionDate}`,
    html,
  };
}

export async function partyAddedEmail(params: {
  recipientName: string;
  permitTitle: string;
  propertyAddress: string;
  role: string;
  addedBy: string;
}) {
  const html = await render(
    createElement(PartyAddedEmail, {
      userName: params.recipientName,
      permitTitle: params.permitTitle,
      propertyAddress: params.propertyAddress,
      role: params.role,
      addedBy: params.addedBy,
    })
  );

  return {
    subject: `You've been added to a permit: ${params.permitTitle}`,
    html,
  };
}

export async function photoShareEmail(params: {
  recipientName: string;
  senderName: string;
  permitTitle: string;
  photoUrl: string;
  message?: string;
}) {
  const html = await render(
    createElement(PhotoShareEmail, {
      recipientName: params.recipientName,
      senderName: params.senderName,
      permitTitle: params.permitTitle,
      photoUrl: params.photoUrl,
      message: params.message,
    })
  );

  return {
    subject: `${params.senderName} shared a photo from ${params.permitTitle}`,
    html,
  };
}
