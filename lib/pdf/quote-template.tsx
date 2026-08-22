import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { VenueBrand } from "@/lib/email/templates/brand";
import type { QuoteLineItemView } from "@/lib/domain/quotes/queries";

export interface QuotePdfProps {
  brand: VenueBrand;
  legalEntityName: string | null;
  venueAddress: string | null;
  abn: string | null;
  referenceNumber: string;
  contactName: string;
  version: number;
  lineItems: QuoteLineItemView[];
  subtotal: number;
  gstAmount: number;
  total: number;
  minimumSpendApplied: number | null;
  validUntil: string | null;
}

// Standard built-in PDF fonts only (Helvetica/Times) — no network font
// registration at render time. The brand's actual Playfair Display /
// Montserrat typefaces are a follow-up once font assets are hosted
// somewhere @react-pdf/renderer can fetch them; noted in DECISIONS.md.
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#0d0d0d" },
  heading: { fontFamily: "Times-Bold", fontSize: 22, marginBottom: 4 },
  subheading: { fontSize: 9, color: "#555555", marginBottom: 16 },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#0d0d0d", paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#cccccc" },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#0d0d0d" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#888888" },
});

export function QuotePdf({
  brand,
  legalEntityName,
  venueAddress,
  abn,
  referenceNumber,
  contactName,
  version,
  lineItems,
  subtotal,
  gstAmount,
  total,
  minimumSpendApplied,
  validUntil,
}: QuotePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={[styles.heading, { color: brand.goldColor }]}>{brand.name}</Text>
        <Text style={styles.subheading}>
          {legalEntityName ?? "Legal entity name not yet confirmed"}
          {abn ? ` · ABN ${abn}` : ""}
          {venueAddress ? ` · ${venueAddress}` : ""}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Quote for: {contactName}</Text>
            <Text>Reference: {referenceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text>Version: {version}</Text>
            {validUntil && <Text>Valid until: {validUntil}</Text>}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {lineItems.map((li) => (
          <View style={styles.tableRow} key={li.id}>
            <Text style={styles.colDescription}>{li.description}</Text>
            <Text style={styles.colQty}>{li.quantity}</Text>
            <Text style={styles.colPrice}>${li.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colTotal}>${li.lineTotal.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </View>
          {minimumSpendApplied != null && (
            <View style={styles.totalRow}>
              <Text>Minimum spend applied</Text>
              <Text>${minimumSpendApplied.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>GST</Text>
            <Text>${gstAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Total</Text>
            <Text>${total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This quote is provided by {brand.name} and is subject to availability at the time of confirmation.
        </Text>
      </Page>
    </Document>
  );
}
