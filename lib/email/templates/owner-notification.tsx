import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { VenueBrand } from "./brand";

export interface OwnerNotificationEmailProps {
  brand: VenueBrand;
  ownerName: string;
  contactName: string;
  referenceNumber: string;
  enquiryUrl: string;
}

export function OwnerNotificationEmail({
  brand,
  ownerName,
  contactName,
  referenceNumber,
  enquiryUrl,
}: OwnerNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New enquiry {referenceNumber} from {contactName}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: brand.bodyFont }}>
        <Container style={{ padding: "24px" }}>
          <Heading style={{ fontFamily: brand.headingFont, color: brand.blackColor }}>New enquiry assigned to you</Heading>
          <Text>Hi {ownerName},</Text>
          <Text>
            A new enquiry from <strong>{contactName}</strong> (reference {referenceNumber}) has been assigned to
            you at {brand.name}. A follow-up task has been created.
          </Text>
          <Text>
            <a href={enquiryUrl}>View the enquiry</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
