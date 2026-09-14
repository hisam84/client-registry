import { NextResponse } from "next/server";
import { getMailSettings, saveMailSettings, DEFAULT_BREVO_CONFIG } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getMailSettings();
    const brevoSenderEmail = "imperialitbd2011@gmail.com";
    const hasApiKey = Boolean(process.env.BREVO_API_KEY || DEFAULT_BREVO_CONFIG.apiKey);
    const hasSmtpUser = Boolean(process.env.BREVO_SMTP_USER || DEFAULT_BREVO_CONFIG.smtpUser);

    return NextResponse.json({
      success: true,
      settings,
      provider: {
        name: "Brevo (Sendinblue)",
        senderEmail: brevoSenderEmail,
        restApiConfigured: hasApiKey,
        smtpRelayConfigured: hasSmtpUser,
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
