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

interface PartyAddedEmailProps {
  userName: string;
  permitTitle: string;
  propertyAddress: string;
  role: string;
  addedBy: string;
}

export default function PartyAddedEmail({
  userName = "there",
  permitTitle = "Kitchen Renovation",
  propertyAddress = "123 Main St",
  role = "Contractor",
  addedBy = "John Doe",
}: PartyAddedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been added to a permit: {permitTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Added to Permit</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            <strong>{addedBy}</strong> has added you as <strong>{role}</strong> on a permit:
          </Text>
          <Section style={detailCard}>
            <Text style={detailLabel}>Permit</Text>
            <Text style={detailValue}>{permitTitle}</Text>
            <Text style={detailLabel}>Property</Text>
            <Text style={detailValue}>{propertyAddress}</Text>
            <Text style={detailLabel}>Your Role</Text>
            <Text style={detailValue}>{role}</Text>
          </Section>
          <Text style={paragraph}>
            You can now view and collaborate on this permit through the platform.
          </Text>
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

const detailCard = {
  backgroundColor: "#f0f7ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const detailLabel = {
  fontSize: "11px",
  fontWeight: "600" as const,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "12px 0 2px",
};

const detailValue = {
  fontSize: "15px",
  color: "#1f2937",
  margin: "0",
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
