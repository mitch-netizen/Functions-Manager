import { Resend } from "resend";
import type { EmailSender, SendEmailInput, SendEmailResult } from "./sender";

export class ResendEmailSender implements EmailSender {
  private client: Resend;

  constructor(apiKey: string = process.env.RESEND_API_KEY!) {
    this.client = new Resend(apiKey);
  }

  async send({ to, subject, react, tags, attachments }: SendEmailInput): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: process.env.RESEND_FROM_ADDRESS!,
      to,
      subject,
      react,
      tags: tags ? Object.entries(tags).map(([name, value]) => ({ name, value })) : undefined,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });

    if (error) throw new Error(`Resend send failed: ${error.message}`);
    return { id: data!.id };
  }
}

let defaultSender: EmailSender | null = null;

export function getEmailSender(): EmailSender {
  if (!defaultSender) defaultSender = new ResendEmailSender();
  return defaultSender;
}
