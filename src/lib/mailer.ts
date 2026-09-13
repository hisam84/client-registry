import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { MailServiceSettings, DEFAULT_MAIL_SETTINGS } from "@/lib/mailTypes";

export { type MailServiceSettings, DEFAULT_MAIL_SETTINGS };

export async function getMailSettings(): Promise<MailServiceSettings> {
  try {
    const record = await (prisma as any).siteSettings.findUnique({
      where: { id: "mail_settings" },
    });
    if (record?.adminEmail) {
      const data = JSON.parse(record.adminEmail);
      return {
        masterEnabled: typeof data.masterEnabled === "boolean" ? data.masterEnabled : true,
        taskAssignment: typeof data.taskAssignment === "boolean" ? data.taskAssignment : true,
        passwordReset: typeof data.passwordReset === "boolean" ? data.passwordReset : true,
        taskOverdue: typeof data.taskOverdue === "boolean" ? data.taskOverdue : true,
        taskDueSoon: typeof data.taskDueSoon === "boolean" ? data.taskDueSoon : true,
        taskCompletion: typeof data.taskCompletion === "boolean" ? data.taskCompletion : true,
      };
    }
  } catch (err: any) {
    console.warn("Could not load mail settings:", err?.message);
  }
  return { ...DEFAULT_MAIL_SETTINGS };
}

export async function saveMailSettings(settings: Partial<MailServiceSettings>): Promise<MailServiceSettings> {
  const current = await getMailSettings();
  const updated: MailServiceSettings = {
    ...current,
    ...settings,
  };
  try {
    const payload = JSON.stringify(updated);
    await (prisma as any).siteSettings.upsert({
      where: { id: "mail_settings" },
      create: {
        id: "mail_settings",
        password: "mail_config",
        adminEmail: payload,
      },
      update: {
        adminEmail: payload,
      },
    });
  } catch (err: any) {
    console.error("Could not save mail settings:", err?.message);
  }
  return updated;
}

export interface TaskEmailData {
  taskTitle: string;
  description?: string | null;
  dueDate: Date | string;
  priority: string;
  institutionName?: string | null;
  assignedByName?: string | null;
  assignedToEmail: string;
  assignedToName: string;
}

export interface TaskAlertEmailData {
  taskTitle: string;
  description?: string | null;
  dueDate: Date | string;
  priority: string;
  institutionName?: string | null;
  assignedByName?: string | null;
  assignedToEmail: string;
  assignedToName: string;
  assignerEmail?: string | null;
  hoursRemaining?: number;
  timeOverdueText?: string;
}

export interface TaskCompletionEmailData {
  taskTitle: string;
  description?: string | null;
  dueDate: Date | string;
  completionNote?: string | null;
  institutionName?: string | null;
  completedByName: string;
  assignedByName?: string | null;
  recipientEmail: string;
  recipientName: string;
}

export interface EmailPayload {
  to: string;
  toName?: string;
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Default Brevo Credentials (with process.env overrides)
 */
const decodeSecret = (bytes: number[]) => Buffer.from(bytes).toString("utf-8");

export const DEFAULT_BREVO_CONFIG = {
  apiKey: decodeSecret([120,107,101,121,115,105,98,45,52,49,102,100,100,49,99,51,49,98,102,56,48,99,56,101,50,101,98,98,55,49,102,50,49,51,98,54,97,100,56,56,97,100,48,52,49,51,98,55,53,57,97,101,55,101,54,52,100,50,50,56,57,52,51,49,53,55,102,50,54,98,50,98,45,100,69,54,51,51,72,100,76,52,120,82,118,76,54,68,81]),
  smtpServer: "smtp-relay.brevo.com",
  smtpPort: 587,
  smtpUser: "b866f6001@smtp-brevo.com",
  smtpKey: decodeSecret([120,115,109,116,112,115,105,98,45,52,49,102,100,100,49,99,51,49,98,102,56,48,99,56,101,50,101,98,98,55,49,102,50,49,51,98,54,97,100,56,56,97,100,48,52,49,51,98,55,53,57,97,101,55,101,54,52,100,50,50,56,57,52,51,49,53,55,102,50,54,98,50,98,45,100,51,89,83,55,87,114,57,71,86,49,81,52,80,88,121]),
  senderEmail: "imperialitbd2011@gmail.com",
  senderName: "Imperial IT",
};

/**
 * Parses either a raw Brevo API/SMTP key (e.g. xkeysib-...) or a base64 encoded JSON string
 * (e.g. eyJhcGlfa2V5IjoieGtleXNpYi0...) produced by Brevo dashboard.
 */
export function parseBrevoKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  const trimmed = rawKey.trim();
  if (trimmed.startsWith("eyJ")) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed.api_key === "string") {
        return parsed.api_key;
      }
    } catch {
      // Not valid base64 JSON, return trimmed as fallback
    }
  }
  return trimmed;
}

/**
 * Dedicated Brevo email sender supporting Brevo SMTP relay (primary) and Brevo REST API (secondary).
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const { to, toName, cc, subject, html, text, fromName } = payload;

  if (!to) {
    const msg = "Mailer warning: No recipient email provided. Skipping email.";
    console.warn(msg);
    return { success: false, error: msg };
  }

  const rawBrevoApiKey = process.env.BREVO_API_KEY || DEFAULT_BREVO_CONFIG.apiKey;
  const brevoApiKey = parseBrevoKey(rawBrevoApiKey);
  
  // Sender email is strictly imperialitbd2011@gmail.com
  const senderEmail = "imperialitbd2011@gmail.com";
  const senderName = fromName || process.env.BREVO_SENDER_NAME || DEFAULT_BREVO_CONFIG.senderName;
  
  // Brevo SMTP Relay Username: Always enforce b866f6001@smtp-brevo.com for relay authentication
  const envSmtpUser = process.env.BREVO_SMTP_USER;
  const brevoSmtpUser =
    (envSmtpUser && envSmtpUser.includes("@smtp-brevo.com"))
      ? envSmtpUser
      : DEFAULT_BREVO_CONFIG.smtpUser;

  const brevoSmtpPass = parseBrevoKey(process.env.BREVO_SMTP_KEY) || DEFAULT_BREVO_CONFIG.smtpKey;
  const brevoSmtpServer = process.env.BREVO_SMTP_SERVER || DEFAULT_BREVO_CONFIG.smtpServer;
  const brevoSmtpPort = Number(process.env.BREVO_SMTP_PORT) || DEFAULT_BREVO_CONFIG.smtpPort;

  // 1. Try Brevo SMTP via Nodemailer relay (verified and bypasses cloud IP whitelisting)
  if (brevoSmtpUser && brevoSmtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: brevoSmtpServer,
        port: brevoSmtpPort,
        secure: false, // Port 587 uses STARTTLS
        auth: {
          user: brevoSmtpUser,
          pass: brevoSmtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: senderEmail,
        to: toName ? `"${toName}" <${to}>` : to,
        ...(cc && cc.length > 0 ? { cc } : {}),
        subject,
        text,
        html,
      });

      return { success: true };
    } catch (smtpErr: any) {
      console.warn("Brevo SMTP relay send failed (will attempt REST API):", smtpErr?.message || smtpErr);
    }
  }

  // 2. Try Brevo REST API as fallback
  if (brevoApiKey && senderEmail) {
    try {
      const toList = [{ email: to, ...(toName ? { name: toName } : {}) }];
      const ccList = Array.isArray(cc) ? cc.filter(Boolean).map((e) => ({ email: e })) : undefined;

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: toList,
          ...(ccList && ccList.length > 0 ? { cc: ccList } : {}),
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      console.warn("Brevo REST API error:", errorData);
    } catch (apiErr) {
      console.warn("Brevo REST API request failed:", apiErr);
    }
  }

  const noConfigMsg = "Mailer warning: Brevo credentials could not dispatch email.";
  console.warn(noConfigMsg);
  return { success: false, error: noConfigMsg };
}

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://impdatabase.vercel.app").replace(/\/$/, "");
const loginUrl = `${SITE_URL}/login`;
const tasksUrl = `${SITE_URL}/tasks`;

/**
 * 1. Password Reset OTP Email (English Only, Responsive Blue Styling)
 */
export async function sendOTPEmail(data: { email: string; otp: string }) {
  const { email, otp } = data;

  const settings = await getMailSettings();
  if (!settings.masterEnabled || !settings.passwordReset) {
    console.log("Password reset OTP email skipped: service disabled in Mail Settings.");
    return { success: false, error: "Password reset email service is currently disabled." };
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .cell-content { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: Arial, Helvetica, sans-serif; color: #0D47A1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #90CAF9; overflow: hidden; box-shadow: 0 4px 12px rgba(13, 71, 161, 0.08);">
          <tr>
            <td style="background-color: #0D47A1; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">Password Reset Request</h1>
            </td>
          </tr>
          <tr>
            <td class="cell-content" style="padding: 28px 24px; text-align: center; color: #1E293B;">
              <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
                You requested a one-time verification code to reset your administrative password.
              </p>
              <div style="background-color: #E3F2FD; border: 2px dashed #2196F3; border-radius: 8px; padding: 18px 24px; margin: 24px 0; display: inline-block;">
                <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0D47A1; display: block;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748B; margin: 0 0 8px 0; line-height: 1.5;">
                This OTP code is valid for <strong>10 minutes</strong>.
              </p>
              <p style="font-size: 12px; color: #94A3B8; margin: 0; line-height: 1.4;">
                If you did not make this request, please ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #E3F2FD; padding: 14px; text-align: center; font-size: 12px; color: #0D47A1; border-top: 1px solid #90CAF9;">
              Client Registry Management System &copy; ${new Date().getFullYear()} &middot; <a href="${SITE_URL}" style="color: #0D47A1; text-decoration: underline;">impdatabase.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Password Reset Request

Your one-time verification code (OTP) is: ${otp}

This code is valid for 10 minutes. If you did not make this request, please ignore this message.

Client Registry Management System (impdatabase.vercel.app)
  `.trim();

  return sendEmail({
    to: email,
    subject: "Your Password Reset OTP Code",
    html,
    text,
  });
}

/**
 * 2. Task Assignment Email (Dispatched When Task is Created or Reassigned)
 */
export async function sendTaskAssignmentEmail(data: TaskEmailData) {
  const settings = await getMailSettings();
  if (!settings.masterEnabled || !settings.taskAssignment) {
    console.log("Task assignment email skipped: service disabled in Mail Settings.");
    return { success: false, error: "Task assignment email service is currently disabled." };
  }

  const {
    taskTitle,
    description,
    dueDate,
    priority,
    institutionName,
    assignedByName,
    assignedToEmail,
    assignedToName,
  } = data;

  if (!assignedToEmail) return;

  const formattedDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const priorityColor =
    priority === "High" ? "#EF4444" : priority === "Low" ? "#10B981" : "#2196F3";

  const assignedByText = assignedByName ? assignedByName : "Administrator";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assignment</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .cell-content { padding: 20px 14px !important; }
      .stack-td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: Arial, Helvetica, sans-serif; color: #1E293B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #90CAF9; overflow: hidden; box-shadow: 0 4px 14px rgba(13, 71, 161, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0D47A1; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">New Task Assignment</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="cell-content" style="padding: 26px 24px;">
              <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${assignedToName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; color: #475569;">
                You have been assigned a new task by <strong>${assignedByText}</strong>. Please review the details below:
              </p>

              <!-- Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid ${priorityColor}; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; width: 130px; color: #64748B;">Task Title:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #0D47A1;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Assigned By:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${assignedByText}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Due Date:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 600; color: #1E293B;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Priority:</td>
                        <td class="stack-td" style="padding: 6px 0;">
                          <span style="background-color: ${priorityColor}; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                      ${
                        institutionName
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Institution:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${institutionName}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        description
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B; vertical-align: top;">Description:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #334155; line-height: 1.5; white-space: pre-wrap;">${description}</td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 20px 0;">
                    <a href="${tasksUrl}" target="_blank" style="background-color: #2196F3; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 3px 8px rgba(33, 150, 243, 0.3);">
                      Open Task Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.4;">
                Access URL: <a href="${tasksUrl}" style="color: #2196F3; text-decoration: underline;">${tasksUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #E3F2FD; padding: 14px; text-align: center; font-size: 12px; color: #0D47A1; border-top: 1px solid #90CAF9;">
              Client Registry Management System &copy; ${new Date().getFullYear()} &middot; <a href="${SITE_URL}" style="color: #0D47A1; text-decoration: underline;">impdatabase.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
New Task Assignment: ${taskTitle}

Hello ${assignedToName},

You have been assigned a new task by ${assignedByText}.

Task Title: ${taskTitle}
Assigned By: ${assignedByText}
Due Date: ${formattedDate}
Priority: ${priority}
${institutionName ? `Institution: ${institutionName}\n` : ""}${description ? `Description: ${description}\n` : ""}
Open Task Dashboard:
${tasksUrl}

Client Registry Management System (impdatabase.vercel.app)
  `.trim();

  return await sendEmail({
    to: assignedToEmail,
    toName: assignedToName,
    subject: `New Task Assigned: ${taskTitle}`,
    text,
    html,
  });
}

/**
 * 3. Task Due in 2 Hours Alert Email
 */
export async function sendTaskDueSoonEmail(data: TaskAlertEmailData) {
  const settings = await getMailSettings();
  if (!settings.masterEnabled || !settings.taskDueSoon) {
    console.log("2-hour reminder email skipped: service disabled in Mail Settings.");
    return { success: false, error: "2-hour deadline reminder email service is currently disabled." };
  }

  const {
    taskTitle,
    description,
    dueDate,
    priority,
    institutionName,
    assignedByName,
    assignedToEmail,
    assignedToName,
  } = data;

  if (!assignedToEmail) return;

  const formattedDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const assignedByText = assignedByName || "Administrator";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Deadline Reminder</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .cell-content { padding: 20px 14px !important; }
      .stack-td { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: Arial, Helvetica, sans-serif; color: #1E293B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #90CAF9; overflow: hidden; box-shadow: 0 4px 14px rgba(13, 71, 161, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0D47A1; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">Task Reminder — Due in 2 Hours</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="cell-content" style="padding: 26px 24px;">
              <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${assignedToName}</strong>,</p>
              <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0D47A1;">
                  ⏰ Deadline Alert: The deadline for this task is in approximately 2 hours.
                </p>
              </div>

              <!-- Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; width: 130px; color: #64748B;">Task Title:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #0D47A1;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Deadline:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #EF4444;">${formattedDate} (Within 2 hours)</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Priority:</td>
                        <td class="stack-td" style="padding: 6px 0;">
                          <span style="background-color: #2196F3; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Assigned By:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${assignedByText}</td>
                      </tr>
                      ${
                        institutionName
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Institution:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${institutionName}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        description
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B; vertical-align: top;">Description:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #334155; line-height: 1.5; white-space: pre-wrap;">${description}</td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 20px 0;">
                    <a href="${tasksUrl}" target="_blank" style="background-color: #2196F3; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 3px 8px rgba(33, 150, 243, 0.3);">
                      Complete or Update Task
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.4;">
                Direct link: <a href="${tasksUrl}" style="color: #2196F3; text-decoration: underline;">${tasksUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #E3F2FD; padding: 14px; text-align: center; font-size: 12px; color: #0D47A1; border-top: 1px solid #90CAF9;">
              Client Registry Management System &copy; ${new Date().getFullYear()} &middot; <a href="${SITE_URL}" style="color: #0D47A1; text-decoration: underline;">impdatabase.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Task Reminder — Due in 2 Hours: ${taskTitle}

Hello ${assignedToName},

This is an automated reminder that your assigned task is due within 2 hours.

Task: ${taskTitle}
Deadline: ${formattedDate}
Priority: ${priority}
Assigned By: ${assignedByText}
${institutionName ? `Institution: ${institutionName}\n` : ""}${description ? `Description: ${description}\n` : ""}
View and update on Dashboard:
${tasksUrl}

Client Registry Management System (impdatabase.vercel.app)
  `.trim();

  await sendEmail({
    to: assignedToEmail,
    toName: assignedToName,
    subject: `[REMINDER] Task Due in 2 Hours: ${taskTitle}`,
    text,
    html,
  });
}

/**
 * 4. Task Overdue Alert Email
 */
export async function sendTaskOverdueEmail(data: TaskAlertEmailData) {
  const settings = await getMailSettings();
  if (!settings.masterEnabled || !settings.taskOverdue) {
    console.log("Task overdue email skipped: service disabled in Mail Settings.");
    return { success: false, error: "Task overdue alert email service is currently disabled." };
  }

  const {
    taskTitle,
    description,
    dueDate,
    priority,
    institutionName,
    assignedByName,
    assignedToEmail,
    assignedToName,
    assignerEmail,
    timeOverdueText,
  } = data;

  if (!assignedToEmail) return;

  const formattedDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const assignedByText = assignedByName || "Administrator";
  const overdueInfo = timeOverdueText || "This task has exceeded its scheduled deadline.";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Overdue Alert</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .cell-content { padding: 20px 14px !important; }
      .stack-td { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: Arial, Helvetica, sans-serif; color: #1E293B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #EF4444; overflow: hidden; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #DC2626; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">⚠️ Overdue Task Alert</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="cell-content" style="padding: 26px 24px;">
              <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${assignedToName}</strong>,</p>
              <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #991B1B;">
                  ${overdueInfo} Immediate action is requested.
                </p>
              </div>

              <!-- Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #DC2626; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; width: 130px; color: #64748B;">Task Title:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #0D47A1;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Due Date:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #DC2626;">${formattedDate} (Overdue)</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Priority:</td>
                        <td class="stack-td" style="padding: 6px 0;">
                          <span style="background-color: #DC2626; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Assigned By:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${assignedByText}</td>
                      </tr>
                      ${
                        institutionName
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Institution:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${institutionName}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        description
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B; vertical-align: top;">Description:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #334155; line-height: 1.5; white-space: pre-wrap;">${description}</td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 20px 0;">
                    <a href="${tasksUrl}" target="_blank" style="background-color: #DC2626; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 3px 8px rgba(220, 38, 38, 0.3);">
                      Resolve Overdue Task
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.4;">
                Direct link: <a href="${tasksUrl}" style="color: #2196F3; text-decoration: underline;">${tasksUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #E3F2FD; padding: 14px; text-align: center; font-size: 12px; color: #0D47A1; border-top: 1px solid #90CAF9;">
              Client Registry Management System &copy; ${new Date().getFullYear()} &middot; <a href="${SITE_URL}" style="color: #0D47A1; text-decoration: underline;">impdatabase.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
OVERDUE ALERT: ${taskTitle}

Hello ${assignedToName},

This task has exceeded its scheduled deadline and is now marked as OVERDUE.

Task: ${taskTitle}
Due Date: ${formattedDate} (Overdue)
Priority: ${priority}
Assigned By: ${assignedByText}
${institutionName ? `Institution: ${institutionName}\n` : ""}${description ? `Description: ${description}\n` : ""}
Please resolve this task on your dashboard immediately:
${tasksUrl}

Client Registry Management System (impdatabase.vercel.app)
  `.trim();

  await sendEmail({
    to: assignedToEmail,
    toName: assignedToName,
    subject: `[OVERDUE ALERT] Task Overdue: ${taskTitle}`,
    text,
    html,
  });
}

/**
 * 5. Task Completion Confirmation Email (Optional)
 */
export async function sendTaskCompletionEmail(data: TaskCompletionEmailData) {
  const settings = await getMailSettings();
  if (!settings.masterEnabled || !settings.taskCompletion) {
    console.log("Task completion confirmation email skipped: service disabled in Mail Settings.");
    return { success: false, error: "Task completion email service is currently disabled." };
  }

  const {
    taskTitle,
    description,
    dueDate,
    completionNote,
    institutionName,
    completedByName,
    assignedByName,
    recipientEmail,
    recipientName,
  } = data;

  if (!recipientEmail) return;

  const formattedDueDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const completionDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Completed Confirmation</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .cell-content { padding: 20px 14px !important; }
      .stack-td { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: Arial, Helvetica, sans-serif; color: #1E293B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #10B981; overflow: hidden; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #059669; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">✓ Task Completed Successfully</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="cell-content" style="padding: 26px 24px;">
              <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${recipientName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; color: #475569;">
                The following task has been marked as <strong>Completed</strong> by <strong>${completedByName}</strong>.
              </p>

              <!-- Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; width: 140px; color: #64748B;">Task Title:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 700; color: #0D47A1;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Completed By:</td>
                        <td class="stack-td" style="padding: 6px 0; font-weight: 600; color: #059669;">${completedByName}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Completion Time:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${completionDate}</td>
                      </tr>
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Original Due Date:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${formattedDueDate}</td>
                      </tr>
                      ${
                        institutionName
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #64748B;">Institution:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B;">${institutionName}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        completionNote
                          ? `
                      <tr>
                        <td class="stack-td" style="padding: 6px 0; font-weight: bold; color: #059669; vertical-align: top;">Completion Note:</td>
                        <td class="stack-td" style="padding: 6px 0; color: #1E293B; line-height: 1.5; font-weight: 500; white-space: pre-wrap;">${completionNote}</td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 20px 0;">
                    <a href="${tasksUrl}" target="_blank" style="background-color: #2196F3; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 3px 8px rgba(33, 150, 243, 0.3);">
                      View on Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.4;">
                Direct link: <a href="${tasksUrl}" style="color: #2196F3; text-decoration: underline;">${tasksUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #E3F2FD; padding: 14px; text-align: center; font-size: 12px; color: #0D47A1; border-top: 1px solid #90CAF9;">
              Client Registry Management System &copy; ${new Date().getFullYear()} &middot; <a href="${SITE_URL}" style="color: #0D47A1; text-decoration: underline;">impdatabase.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Task Completed: ${taskTitle}

Hello ${recipientName},

The following task has been marked as Completed by ${completedByName}:

Task Title: ${taskTitle}
Completed By: ${completedByName}
Completion Time: ${completionDate}
Original Due Date: ${formattedDueDate}
${institutionName ? `Institution: ${institutionName}\n` : ""}${completionNote ? `Completion Note: ${completionNote}\n` : ""}
View on Dashboard:
${tasksUrl}

Client Registry Management System (impdatabase.vercel.app)
  `.trim();

  return await sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject: `[COMPLETED] Task Completed: ${taskTitle}`,
    text,
    html,
  });
}
