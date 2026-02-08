import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PermitStatusEmailProps {
  userName: string;
  permitTitle: string;
  propertyAddress: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  permitUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY_TO_SUBMIT: "Ready to Submit",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTIONS_NEEDED: "Corrections Needed",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  DENIED: "Denied",
  PERMIT_ISSUED: "Permit Issued",
  INSPECTION_SCHEDULED: "Inspection Scheduled",
  INSPECTION_PASSED: "Inspection Passed",
  INSPECTION_FAILED: "Inspection Failed",
  CERTIFICATE_OF_OCCUPANCY: "Certificate of Occupancy",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

export default function PermitStatusEmail({
  userName = "there",
  permitTitle = "Kitchen Renovation",
  propertyAddress = "123 Main St",
  oldStatus = "SUBMITTED",
  newStatus = "UNDER_REVIEW",
  updatedBy = "System",
}: PermitStatusEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Permit status updated: {permitTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Permit Status Update</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            The status of your permit has been updated:
          </Text>
          <Section style={statusCard}>
            <Text style={permitName}>{permitTitle}</Text>
            <Text style={propertyText}>{propertyAddress}</Text>
            <Section style={statusRow}>
              <Text style={statusOld}>{STATUS_LABELS[oldStatus] || oldStatus}</Text>
              <Text style={arrow}> → </Text>
              <Text style={statusNew}>{STATUS_LABELS[newStatus] || newStatus}</Text>
            </Section>
            <Text style={updatedByText}>Updated by {updatedBy}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Permits on the Go - Permit management, simplified.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#1f2937",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px",
};

const statusCard = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  border: "1px solid #e5e7eb",
  margin: "16px 0",
};

const permitName = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1f2937",
  margin: "0 0 4px",
};

const propertyText = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 16px",
};

const statusRow = {
  display: "flex" as const,
  flexDirection: "row" as const,
  alignItems: "center" as const,
};

const statusOld = {
  fontSize: "14px",
  color: "#6b7280",
  textDecoration: "line-through" as const,
  display: "inline" as const,
};

const arrow = {
  fontSize: "14px",
  color: "#9ca3af",
  display: "inline" as const,
  margin: "0 4px",
};

const statusNew = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#2563eb",
  display: "inline" as const,
};

const updatedByText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "12px 0 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
};
