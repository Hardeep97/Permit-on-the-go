import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PhotoShareEmailProps {
  recipientName: string;
  senderName: string;
  permitTitle: string;
  photoUrl: string;
  message?: string;
}

export default function PhotoShareEmail({
  recipientName = "there",
  senderName = "John Doe",
  permitTitle = "Kitchen Renovation",
  photoUrl = "https://placehold.co/600x400",
  message,
}: PhotoShareEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{senderName} shared a photo from {permitTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Photo Shared</Heading>
          <Text style={paragraph}>Hi {recipientName},</Text>
          <Text style={paragraph}>
            <strong>{senderName}</strong> shared a photo from the permit "{permitTitle}":
          </Text>
          {message && (
            <Section style={messageBox}>
              <Text style={messageText}>"{message}"</Text>
            </Section>
          )}
          <Section style={photoContainer}>
            <Img src={photoUrl} alt="Permit photo" style={photoStyle} />
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

const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 16px",
};

const messageText = {
  fontSize: "14px",
  fontStyle: "italic" as const,
  color: "#4b5563",
  margin: "0",
};

const photoContainer = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const photoStyle = {
  maxWidth: "100%",
  borderRadius: "8px",
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
