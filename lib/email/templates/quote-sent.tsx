import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { VenueBrand } from "./brand";

export interface QuoteSentEmailProps {
  brand: VenueBrand;
  contactName: string;
  referenceNumber: string;
}

export function QuoteSentEmail({ brand, contactName, referenceNumber }: QuoteSentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your quote from {brand.name} (ref {referenceNumber})</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: brand.bodyFont }}>
        <Container style={{ padding: "24px" }}>
          <Heading style={{ fontFamily: brand.headingFont, color: brand.blackColor }}>{brand.name}</Heading>
          <Text>Hi {contactName},</Text>
          <Text>
            Thanks again for your enquiry (reference <strong>{referenceNumber}</strong>). Please find your quote
            attached — let us know if you have any questions or would like to make any changes.
          </Text>
          <Text style={{ color: brand.goldColor }}>— {brand.name}</Text>
        </Container>
      </Body>
    </Html>
  );
}
