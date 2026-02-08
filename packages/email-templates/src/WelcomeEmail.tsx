import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
}

export default function WelcomeEmail({ userName = "there" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Permits on the Go</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to Permits on the Go</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            Thank you for joining Permits on the Go! We're here to make permit
            management simple, fast, and stress-free for property owners and
            expeditors.
          </Text>
          <Section style={featureSection}>
            <Text style={featureTitle}>Here's what you can do:</Text>
            <Text style={featureItem}>Track permits across all your properties</Text>
            <Text style={featureItem}>Upload documents and photos on the go</Text>
            <Text style={featureItem}>Collaborate with contractors and inspectors</Text>
            <Text style={featureItem}>Get AI-powered permit guidance</Text>
          </Section>
          <Text style={paragraph}>
            Get started by adding your first property and creating a permit.
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

const featureSection = {
  backgroundColor: "#f0f7ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const featureTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1f2937",
  margin: "0 0 12px",
};

const featureItem = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0",
  paddingLeft: "12px",
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
