import { NextResponse } from "next/server";
import { getMailSettings, saveMailSettings, DEFAULT_BREVO_CONFIG } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getMailSettings();

    const hasDirectGmail = Boolean((process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || "").trim());
    const customSmtpHost = process.env.SMTP_HOST?.trim();
    const hasCustomSmtp = Boolean(customSmtpHost && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    const hasBrevoApiKey = Boolean(process.env.BREVO_API_KEY || DEFAULT_BREVO_CONFIG.apiKey);
    const hasBrevoSmtp = Boolean(process.env.BREVO_SMTP_USER || DEFAULT_BREVO_CONFIG.smtpUser);

    const activeSenderEmail = (
      (hasDirectGmail ? (process.env.GMAIL_USER || "imperialitbd2011@gmail.com") : undefined) ||
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SMTP_SENDER_EMAIL ||
      DEFAULT_BREVO_CONFIG.senderEmail
    ).trim();

    let activeProviderName = "Brevo SMTP Relay";
    let deliverabilityGrade = "Standard Relay (SPF/DMARC Warning for @gmail.com)";
    let isOptimal = false;

    if (hasDirectGmail) {
      activeProviderName = "Direct Gmail SMTP (Official Google Relay)";
      deliverabilityGrade = "Optimal (100% DKIM & SPF Pass, 0% Spam)";
      isOptimal = true;
    } else if (hasCustomSmtp) {
      activeProviderName = `Custom SMTP (${customSmtpHost})`;
      deliverabilityGrade = "Custom Mail Server";
      isOptimal = true;
    }

    return NextResponse.json({
      success: true,
      settings,
      provider: {
        name: activeProviderName,
        senderEmail: activeSenderEmail,
        deliverabilityGrade,
        isOptimal,
        directGmailConfigured: hasDirectGmail,
        customSmtpConfigured: hasCustomSmtp,
        restApiConfigured: hasBrevoApiKey,
        smtpRelayConfigured: hasBrevoSmtp,
      },
    });
  } catch (error: any) {
    console.error("GET /api/mail-settings error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch mail settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await saveMailSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("PUT /api/mail-settings error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update mail settings" }, { status: 500 });
  }
}
