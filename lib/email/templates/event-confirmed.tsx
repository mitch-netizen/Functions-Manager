import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { VenueBrand } from "./brand";

export interface EventConfirmedEmailProps {
  brand: VenueBrand;
  contactName: string;
  referenceNumber: string;
  confirmedDate: string;
}

export function EventConfirmedEmail({ brand, contactName, referenceNumber, confirmedDate }: EventConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your event at {brand.name} is confirmed for {confirmedDate}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: brand.bodyFont }}>
        <Container style={{ padding: "24px" }}>
          <Heading style={{ fontFamily: brand.headingFont, color: brand.blackColor }}>{brand.name}</Heading>
          <Text>Hi {contactName},</Text>
          <Text>
            We&apos;re pleased to confirm your event on <strong>{confirmedDate}</strong> (reference{" "}
            {referenceNumber}). We&apos;ll be in touch closer to the date to finalise numbers and any remaining
            details.
          </Text>
          <Text style={{ color: brand.goldColor }}>— {brand.name}</Text>
        </Container>
      </Body>
    </Html>
  );
}
