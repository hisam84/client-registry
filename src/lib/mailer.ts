import nodemailer from "nodemailer";

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

export async function sendTaskAssignmentEmail(data: TaskEmailData) {
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

  if (!assignedToEmail) {
    console.warn("Mailer warning: No recipient email provided. Skipping task email.");
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn("Mailer warning: GMAIL_USER or GMAIL_APP_PASSWORD environment variable is missing. Email skipped.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const formattedDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const priorityColor =
    priority === "High" ? "#dc2626" : priority === "Low" ? "#2563eb" : "#d97706";

  const assignedByText = assignedByName ? assignedByName : "Admin / Administrator";

  const baseUrl = process.env.APP_URL
    ? process.env.APP_URL.replace(/\/$/, "")
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
    : "http://localhost:3000";

  const loginUrl = `${baseUrl}/login`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; padding: 24px 12px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        
        <!-- Header -->
        <div style="background-color: #1e293b; color: #ffffff; padding: 20px 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">📋 New Task Assigned / নতুন টাস্ক অর্পণ</h2>
        </div>

        <!-- Content Body -->
        <div style="padding: 24px;">
          <!-- English Greeting & Intro -->
          <p style="font-size: 15px; color: #374151; margin-top: 0;">Dear <strong>${assignedToName}</strong>,</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">
            You have been assigned a new task by <strong>${assignedByText}</strong>. Please review the details below:
          </p>

          <!-- Divider -->
          <hr style="border: none; border-top: 1px dashed #d1d5db; margin: 20px 0;" />

          <!-- Bangla Greeting & Intro -->
          <p style="font-size: 15px; color: #374151;">প্রিয় <strong>${assignedToName}</strong>,</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            <strong>${assignedByText}</strong> আপনাকে একটি নতুন টাস্ক অর্পণ করেছেন। নিচে বিস্তারিত বিবরণ দেওয়া হলো:
          </p>

          <!-- Task Card (100% English) -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${priorityColor}; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 130px; color: #64748b;">Task Title:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a; font-size: 15px;">${taskTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Assigned By:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${assignedByText}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Due Date:</td>
                <td style="padding: 6px 0; color: #0f172a;">📅 ${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Priority:</td>
                <td style="padding: 6px 0;">
                  <span style="background-color: ${priorityColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                    ${priority}
                  </span>
                </td>
              </tr>
              ${
                institutionName
                  ? `
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Institution:</td>
                <td style="padding: 6px 0; color: #0f172a;">🏛️ ${institutionName}</td>
              </tr>
              `
                  : ""
              }
              ${
                description
                  ? `
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Description:</td>
                <td style="padding: 6px 0; color: #334155; line-height: 1.4; white-space: pre-wrap;">${description}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          <!-- Dashboard Login Button & Link -->
          <div style="text-align: center; margin-top: 28px; margin-bottom: 16px;">
            <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 3px 6px rgba(37,99,235,0.25);">
              🔐 Log In to Dashboard / ড্যাশবোর্ডে লগইন করুন
            </a>
          </div>

          <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 12px; margin-bottom: 0;">
            Direct link / সরাসরি লিংক: <a href="${loginUrl}" style="color: #2563eb; text-decoration: underline;">${loginUrl}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Client Registry Management System &copy; ${new Date().getFullYear()}
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Client Manager" <${gmailUser}>`,
    to: assignedToEmail,
    subject: `📋 New Task Assigned: ${taskTitle}`,
    html,
  });
}
