import type { ReactElement } from "react";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
  /** e.g. { venueId, enquiryId } — provider-side tagging, never used for bulk/broadcast sends. */
  tags?: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id: string;
}

/**
 * Every transactional email in the app goes through this interface, so the
 * provider (currently Resend) can be swapped by adding one new
 * implementation file — no call-site changes. Deliberately has no bulk/
 * broadcast method: every automated email is tied to a specific active
 * enquiry or event, per the brief's Australian spam-law constraint.
 */
export interface EmailSender {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
