import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { EventDetail } from "@/lib/domain/events/queries";

export interface RunSheetPdfProps {
  venueName: string;
  event: EventDetail;
}

// Deliberately relies only on weight/size/borders/spacing — never colour —
// to convey structure, since this must stay legible printed in black and
// white (brief 6.5).
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#000000" },
  heading: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 2 },
  subheading: { fontSize: 10, marginBottom: 16 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 14, marginBottom: 4, textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#000000", paddingBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { fontFamily: "Helvetica-Bold" },
  bodyText: { marginTop: 2 },
  dietaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: "#666666" },
});

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
}

export function RunSheetPdf({ venueName, event }: RunSheetPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{venueName} — Run Sheet</Text>
        <Text style={styles.subheading}>
          {event.contactName} · {event.referenceNumber}
        </Text>

        <View style={styles.sectionTitle}>
          <Text>Schedule</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Event</Text>
          <Text>
            {formatDateTime(event.confirmedStartsAt)} – {formatDateTime(event.confirmedEndsAt)}
          </Text>
        </View>
        {event.bumpInAt && (
          <View style={styles.row}>
            <Text style={styles.label}>Bump-in</Text>
            <Text>{formatDateTime(event.bumpInAt)}</Text>
          </View>
        )}
        {event.bumpOutAt && (
          <View style={styles.row}>
            <Text style={styles.label}>Bump-out</Text>
            <Text>{formatDateTime(event.bumpOutAt)}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Space(s)</Text>
          <Text>{event.spaceNames.join(", ") || "Not set"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Final headcount</Text>
          <Text>{event.finalHeadcount ?? "Not yet confirmed"}</Text>
        </View>

        <View style={styles.sectionTitle}>
          <Text>Dietary requirements</Text>
        </View>
        {event.dietaryRequirements.length === 0 ? (
          <Text>None recorded.</Text>
        ) : (
          event.dietaryRequirements.map((d) => (
            <View style={styles.dietaryRow} key={d.id}>
              <Text>{d.requirement}</Text>
              <Text>× {d.headcount}</Text>
            </View>
          ))
        )}

        <View style={styles.sectionTitle}>
          <Text>Room setup</Text>
        </View>
        <Text style={styles.bodyText}>{event.roomSetup || "Not specified"}</Text>

        <View style={styles.sectionTitle}>
          <Text>AV requirements</Text>
        </View>
        <Text style={styles.bodyText}>{event.avRequirements || "Not specified"}</Text>

        <View style={styles.sectionTitle}>
          <Text>Special instructions</Text>
        </View>
        <Text style={styles.bodyText}>{event.specialInstructions || "None"}</Text>

        {event.runSheetNotes && (
          <>
            <View style={styles.sectionTitle}>
              <Text>Notes</Text>
            </View>
            <Text style={styles.bodyText}>{event.runSheetNotes}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}
