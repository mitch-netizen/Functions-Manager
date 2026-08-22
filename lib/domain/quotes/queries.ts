import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/types/database.types";

export interface QuoteSummary {
  id: string;
  version: number;
  status: QuoteStatus;
  total: number;
  sentAt: string | null;
  createdAt: string;
}

export async function listQuotesForEnquiry(enquiryId: string): Promise<QuoteSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, version, status, total, sent_at, created_at")
    .eq("enquiry_id", enquiryId)
    .order("version", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    version: r.version,
    status: r.status,
    total: r.total,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  }));
}

export interface QuoteLineItemView {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  packageId: string | null;
}

export interface QuoteDetail {
  id: string;
  enquiryId: string;
  version: number;
  status: QuoteStatus;
  subtotal: number;
  gstAmount: number;
  total: number;
  minimumSpendApplied: number | null;
  validUntil: string | null;
  pdfFileId: string | null;
  lineItems: QuoteLineItemView[];
}

export async function getQuoteDetail(quoteId: string): Promise<QuoteDetail | null> {
  const supabase = await createClient();
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, enquiry_id, version, status, subtotal, gst_amount, total, minimum_spend_applied, valid_until, pdf_file_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (quoteError) throw quoteError;
  if (!quote) return null;

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("quote_line_items")
    .select("id, description, quantity, unit_price, line_total, package_id")
    .eq("quote_id", quoteId)
    .order("display_order");
  if (lineItemsError) throw lineItemsError;

  return {
    id: quote.id,
    enquiryId: quote.enquiry_id,
    version: quote.version,
    status: quote.status,
    subtotal: quote.subtotal,
    gstAmount: quote.gst_amount,
    total: quote.total,
    minimumSpendApplied: quote.minimum_spend_applied,
    validUntil: quote.valid_until,
    pdfFileId: quote.pdf_file_id,
    lineItems: (lineItems ?? []).map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unit_price,
      lineTotal: li.line_total,
      packageId: li.package_id,
    })),
  };
}
