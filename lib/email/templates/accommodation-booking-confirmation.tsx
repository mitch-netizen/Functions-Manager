import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { VenueBrand } from "./brand";

export interface AccommodationBookingConfirmationEmailProps {
  brand: VenueBrand;
  guestName: string;
  checkIn: string;
  checkOut: string;
  rmsBookingReference: string;
}

export function AccommodationBookingConfirmationEmail({
  brand,
  guestName,
  checkIn,
  checkOut,
  rmsBookingReference,
}: AccommodationBookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your room at {brand.name} is booked ({checkIn} – {checkOut})
      </Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: brand.bodyFont }}>
        <Container style={{ padding: "24px" }}>
          <Heading style={{ fontFamily: brand.headingFont, color: brand.blackColor }}>{brand.name}</Heading>
          <Text>Hi {guestName},</Text>
          <Text>
            Your room is booked for <strong>{checkIn}</strong> to <strong>{checkOut}</strong> (booking reference{" "}
            <strong>{rmsBookingReference}</strong>).
          </Text>
          <Text style={{ color: brand.goldColor }}>— {brand.name}</Text>
        </Container>
      </Body>
    </Html>
  );
}
