import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { targetEmail } = await request.json();

    const recipient = (targetEmail || "").trim();
    if (!recipient) {
      return NextResponse.json({ success: false, message: "Target email address is required" }, { status: 400 });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Brevo Mailer Connectivity Test</title></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0D47A1, #2196F3); padding: 20px 24px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700;">✅ Brevo Mailer Test Success</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Client Registry Management System</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        This is a test email dispatched from your <strong>Imperial IT Client Registry</strong> application.
      </p>
      <div style="background-color: #f1f5f9; border-left: 4px solid #2196F3; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #1e293b; margin-bottom: 20px;">
        <div><strong>Status:</strong> Connected & Operational</div>
        <div><strong>Provider:</strong> Brevo (Sendinblue)</div>
        <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        Your Brevo mailing configuration is active and ready to deliver task alerts, reminders, and verification codes.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const result = await sendEmail({
      to: recipient,
      subject: "Test Email from Client Registry (Brevo Mailer)",
      html,
      text: "Test email successfully received from Brevo Mailer on Client Registry.",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to deliver test email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Test email successfully sent to ${recipient}` });
  } catch (error: any) {
    console.error("POST /api/mail-settings/test error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to send test email" }, { status: 500 });
  }
}
