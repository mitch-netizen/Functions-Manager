"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import { addBusinessDays } from "@/lib/automation/business-days";
import { getEmailSender } from "@/lib/email/resend-sender";
import { resolveBrand } from "@/lib/email/templates/brand";
import { QuoteSentEmail } from "@/lib/email/templates/quote-sent";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { QuotePdf } from "@/lib/pdf/quote-template";
import type { ActionResult } from "@/lib/domain/shared";

export async function createQuoteDraft(enquiryId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("quotes")
    .select("version")
    .eq("enquiry_id", enquiryId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (existing?.[0]?.version ?? 0) + 1;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      venue_id: ctx.activeVenueId,
      enquiry_id: enquiryId,
      version: nextVersion,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !quote) return { ok: false, error: error?.message ?? "failed to create quote" };

  revalidatePath(`/enquiries/${enquiryId}`);
  return { ok: true, data: { id: quote.id } };
}

const addLineItemSchema = z.object({
  quoteId: z.string().uuid(),
  enquiryId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export async function addLineItem(input: z.infer<typeof addLineItemSchema>): Promise<ActionResult<null>> {
  const parsed = addLineItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  let description = parsed.data.description ?? "";
  let unitPrice = parsed.data.unitPrice;

  if (parsed.data.packageId) {
    const { data: pkg } = await supabase.from("packages").select("name, per_head_price").eq("id", parsed.data.packageId).single();
    if (!description) description = pkg?.name ?? "Package";
    if (unitPrice === undefined) unitPrice = pkg?.per_head_price ?? 0;
  }

  if (!description || unitPrice === undefined) {
    return { ok: false, error: "a description and unit price are required for an ad hoc line" };
  }

  const lineTotal = parsed.data.quantity * unitPrice;

  const { error } = await supabase.from("quote_line_items").insert({
    venue_id: ctx.activeVenueId,
    quote_id: parsed.data.quoteId,
    package_id: parsed.data.packageId ?? null,
    description,
    quantity: parsed.data.quantity,
    unit_price: unitPrice,
    line_total: lineTotal,
  });
  if (error) return { ok: false, error: error.message };

  const recalcError = await recalcQuoteTotals(parsed.data.quoteId);
  if (recalcError) return { ok: false, error: recalcError };

  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, data: null };
}

export async function removeLineItem(lineItemId: string, quoteId: string, enquiryId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_line_items").delete().eq("id", lineItemId);
  if (error) return { ok: false, error: error.message };

  const recalcError = await recalcQuoteTotals(quoteId);
  if (recalcError) return { ok: false, error: recalcError };

  revalidatePath(`/enquiries/${enquiryId}`);
  return { ok: true, data: null };
}

/**
 * Recomputes subtotal/gst/total from the quote's current line items plus
 * the venue's GST rate, and — if the enquiry has a preferred space with a
 * minimum spend that the raw subtotal doesn't reach — applies it. This is
 * a judgment call not spelled out by the brief: `subtotal` always reflects
 * the raw line-item sum, `minimum_spend_applied` records the minimum when
 * it exceeds that sum, and `total` (and its GST) are computed from
 * whichever of the two is larger. See DECISIONS.md.
 */
async function recalcQuoteTotals(quoteId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("venue_id, enquiry_id")
    .eq("id", quoteId)
    .single();
  if (quoteError || !quote) return quoteError?.message ?? "quote not found";

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("quote_line_items")
    .select("line_total")
    .eq("quote_id", quoteId);
  if (lineItemsError) return lineItemsError.message;

  const subtotal = (lineItems ?? []).reduce((sum, li) => sum + li.line_total, 0);

  const { data: settings } = await supabase.from("venue_settings").select("gst_rate").eq("venue_id", quote.venue_id).single();
  const gstRate = settings?.gst_rate ?? 0.1;

  const { data: enquiry } = await supabase.from("enquiries").select("space_preference_id").eq("id", quote.enquiry_id).single();
  let minimumSpend: number | null = null;
  if (enquiry?.space_preference_id) {
    const { data: space } = await supabase.from("spaces").select("minimum_spend").eq("id", enquiry.space_preference_id).single();
    minimumSpend = space?.minimum_spend ?? null;
  }

  const minimumSpendApplied = minimumSpend !== null && minimumSpend > subtotal ? minimumSpend : null;
  const effectiveSubtotal = minimumSpendApplied ?? subtotal;
  const gstAmount = Math.round(effectiveSubtotal * gstRate * 100) / 100;
  const total = effectiveSubtotal + gstAmount;

  const { error: updateError } = await supabase
    .from("quotes")
    .update({ subtotal, gst_amount: gstAmount, total, minimum_spend_applied: minimumSpendApplied })
    .eq("id", quoteId);

  return updateError?.message ?? null;
}

export async function sendQuote(quoteId: string): Promise<ActionResult<null>> {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, enquiry_id, version, subtotal, gst_amount, total, minimum_spend_applied, valid_until")
    .eq("id", quoteId)
    .single();
  if (quoteError || !quote) return { ok: false, error: quoteError?.message ?? "quote not found" };

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("quote_line_items")
    .select("id, description, quantity, unit_price, line_total, package_id")
    .eq("quote_id", quoteId)
    .order("display_order");
  if (lineItemsError) return { ok: false, error: lineItemsError.message };
  if (!lineItems || lineItems.length === 0) return { ok: false, error: "add at least one line item before sending" };

  const { data: enquiry, error: enquiryError } = await supabase
    .from("enquiries")
    .select("contact_name, contact_email, reference_number")
    .eq("id", quote.enquiry_id)
    .single();
  if (enquiryError || !enquiry) return { ok: false, error: enquiryError?.message ?? "enquiry not found" };
  if (!enquiry.contact_email) return { ok: false, error: "this enquiry has no contact email to send the quote to" };

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("name, address, abn, brand_config")
    .eq("id", ctx.activeVenueId)
    .single();
  if (venueError || !venue) return { ok: false, error: venueError?.message ?? "venue not found" };

  const { data: settings } = await supabase.from("venue_settings").select("legal_entity_name, default_followup_proposal_sent_business_days").eq("venue_id", ctx.activeVenueId).single();

  const brand = resolveBrand(venue.name, venue.brand_config);
  const pdfBuffer = await renderPdfToBuffer(
    QuotePdf({
      brand,
      legalEntityName: settings?.legal_entity_name ?? null,
      venueAddress: venue.address,
      abn: venue.abn,
      referenceNumber: enquiry.reference_number,
      contactName: enquiry.contact_name,
      version: quote.version,
      lineItems: lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unit_price,
        lineTotal: li.line_total,
        packageId: li.package_id,
      })),
      subtotal: quote.subtotal,
      gstAmount: quote.gst_amount,
      total: quote.total,
      minimumSpendApplied: quote.minimum_spend_applied,
      validUntil: quote.valid_until,
    })
  );

  const filename = `quote-v${quote.version}.pdf`;
  const storagePath = `${ctx.activeVenueId}/${quote.enquiry_id}/${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await supabase.storage.from("quote-pdfs").upload(storagePath, pdfBuffer, { contentType: "application/pdf" });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: file, error: fileError } = await supabase
    .from("files")
    .insert({
      venue_id: ctx.activeVenueId,
      enquiry_id: quote.enquiry_id,
      filename,
      storage_path: storagePath,
      file_type: "other",
      uploaded_by: ctx.userId,
    })
    .select("id")
    .single();
  if (fileError || !file) return { ok: false, error: fileError?.message ?? "failed to record the generated PDF" };

  // Single UPDATE while this row is still 'draft' from the trigger/RLS
  // policy's point of view — see enforce_quote_immutability's comment.
  const { error: sendUpdateError } = await supabase
    .from("quotes")
    .update({ status: "sent", pdf_file_id: file.id, sent_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (sendUpdateError) return { ok: false, error: sendUpdateError.message };

  const { error: statusError } = await supabase.rpc("update_enquiry_status", {
    p_enquiry_id: quote.enquiry_id,
    p_to_status: "proposal_sent",
  });
  if (statusError) return { ok: false, error: statusError.message };

  const followupDays = settings?.default_followup_proposal_sent_business_days ?? 3;
  await supabase.from("tasks").insert({
    venue_id: ctx.activeVenueId,
    enquiry_id: quote.enquiry_id,
    title: `Follow up on quote v${quote.version} with ${enquiry.contact_name}`,
    due_date: addBusinessDays(new Date(), followupDays).toISOString().slice(0, 10),
    assignee_user_id: ctx.userId,
    source: "auto_proposal_sent",
  });

  try {
    await getEmailSender().send({
      to: enquiry.contact_email,
      subject: `Your quote from ${venue.name} — ${enquiry.reference_number}`,
      react: QuoteSentEmail({ brand, contactName: enquiry.contact_name, referenceNumber: enquiry.reference_number }),
      tags: { venueId: ctx.activeVenueId, enquiryId: quote.enquiry_id },
      attachments: [{ filename, content: pdfBuffer }],
    });
    await supabase.from("activities").insert({
      venue_id: ctx.activeVenueId,
      enquiry_id: quote.enquiry_id,
      type: "email_sent",
      body: `Quote v${quote.version} sent to ${enquiry.contact_email}.`,
      actor_user_id: ctx.userId,
    });
  } catch {
    // The quote is recorded as sent regardless — email delivery failure
    // shouldn't leave the quote stuck in draft; the activity log's absence
    // is itself the signal something needs a manual follow-up.
  }

  revalidatePath(`/enquiries/${quote.enquiry_id}`);
  return { ok: true, data: null };
}

export async function reviseQuote(quoteId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: previous, error: previousError } = await supabase
    .from("quotes")
    .select("id, enquiry_id, version")
    .eq("id", quoteId)
    .single();
  if (previousError || !previous) return { ok: false, error: previousError?.message ?? "quote not found" };

  const { data: previousLineItems } = await supabase
    .from("quote_line_items")
    .select("package_id, description, quantity, unit_price, line_total, display_order")
    .eq("quote_id", quoteId);

  const { data: newQuote, error: insertError } = await supabase
    .from("quotes")
    .insert({
      venue_id: ctx.activeVenueId,
      enquiry_id: previous.enquiry_id,
      version: previous.version + 1,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (insertError || !newQuote) return { ok: false, error: insertError?.message ?? "failed to create new version" };

  if (previousLineItems && previousLineItems.length > 0) {
    const { error: copyError } = await supabase.from("quote_line_items").insert(
      previousLineItems.map((li) => ({
        venue_id: ctx.activeVenueId,
        quote_id: newQuote.id,
        package_id: li.package_id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        line_total: li.line_total,
        display_order: li.display_order,
      }))
    );
    if (copyError) return { ok: false, error: copyError.message };
  }

  await recalcQuoteTotals(newQuote.id);

  const { error: supersedeError } = await supabase.from("quotes").update({ status: "superseded" }).eq("id", quoteId);
  if (supersedeError) return { ok: false, error: supersedeError.message };

  revalidatePath(`/enquiries/${previous.enquiry_id}`);
  return { ok: true, data: { id: newQuote.id } };
}
