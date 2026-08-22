import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { VenueBrand } from "./brand";

export interface EnquiryAckEmailProps {
  brand: VenueBrand;
  contactName: string;
  referenceNumber: string;
}

export function EnquiryAckEmail({ brand, contactName, referenceNumber }: EnquiryAckEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Thanks for your enquiry, {contactName} — {brand.name} has it (ref {referenceNumber})</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: brand.bodyFont }}>
        <Container style={{ padding: "24px" }}>
          <Heading style={{ fontFamily: brand.headingFont, color: brand.blackColor }}>{brand.name}</Heading>
          <Text>Hi {contactName},</Text>
          <Text>
            Thanks for getting in touch about your event. We&apos;ve logged your enquiry (reference{" "}
            <strong>{referenceNumber}</strong>) and someone from our functions team will be in touch shortly.
          </Text>
          <Text style={{ color: brand.goldColor }}>— {brand.name}</Text>
        </Container>
      </Body>
    </Html>
  );
}
