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

  const loginUrl = process.env.APP_URL
    ? `${process.env.APP_URL.replace(/\/$/, "")}/login`
    : "https://client-registry-gray.vercel.app/login";

  // Plain Text Version (Essential to prevent Spam classification)
  const textContent = `
New Task Assigned

Dear ${assignedToName},

You have been assigned a new task by ${assignedByText}.

Task Details:
-------------------------------------------
Task Title: ${taskTitle}
Assigned By: ${assignedByText}
Due Date: ${formattedDate}
Priority: ${priority}
${institutionName ? `Institution: ${institutionName}\n` : ""}${description ? `Description: ${description}\n` : ""}-------------------------------------------

Please log in to your dashboard to view or update this task:
${loginUrl}

Client Registry Management System
  `.trim();

  // Fully Mobile-Responsive HTML Template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Task Assigned</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 10px 4px !important;
      }
      .email-card {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 6px !important;
      }
      .content-body {
        padding: 16px 14px !important;
      }
      .task-table, .task-table tbody, .task-table tr, .task-table td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .task-label {
        padding-top: 8px !important;
        padding-bottom: 2px !important;
        color: #64748b !important;
        font-size: 13px !important;
      }
      .task-value {
        padding-bottom: 8px !important;
        font-size: 14px !important;
      }
      .action-btn {
        display: block !important;
        width: 100% !important;
        padding: 14px 10px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      .break-link {
        word-break: break-all !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div class="email-wrapper" style="background-color: #f4f6f8; padding: 24px 12px; width: 100%; box-sizing: border-box;">
    <div class="email-card" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <div style="background-color: #1e293b; color: #ffffff; padding: 18px 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">New Task Assigned / নতুন টাস্ক অর্পণ</h2>
      </div>

      <!-- Content Body -->
      <div class="content-body" style="padding: 24px; color: #374151;">
        <!-- English Greeting -->
        <p style="font-size: 15px; color: #374151; margin-top: 0; margin-bottom: 8px;">Dear <strong>${assignedToName}</strong>,</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.5; margin-top: 0; margin-bottom: 16px;">
          You have been assigned a new task by <strong>${assignedByText}</strong>. Please review the details below:
        </p>

        <!-- Divider -->
        <hr style="border: none; border-top: 1px dashed #d1d5db; margin: 16px 0;" />

        <!-- Bangla Greeting -->
        <p style="font-size: 15px; color: #374151; margin-top: 0; margin-bottom: 8px;">প্রিয় <strong>${assignedToName}</strong>,</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
          <strong>${assignedByText}</strong> আপনাকে একটি নতুন টাস্ক অর্পণ করেছেন। নিচে বিস্তারিত বিবরণ দেওয়া হলো:
        </p>

        <!-- Task Card (100% English & Mobile Responsive) -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${priorityColor}; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table class="task-table" style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; width: 120px; color: #64748b; vertical-align: top;">Task Title:</td>
              <td class="task-value" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-size: 15px; vertical-align: top;">${taskTitle}</td>
            </tr>
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Assigned By:</td>
              <td class="task-value" style="padding: 6px 0; font-weight: 600; color: #0f172a; vertical-align: top;">${assignedByText}</td>
            </tr>
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Due Date:</td>
              <td class="task-value" style="padding: 6px 0; color: #0f172a; vertical-align: top;">${formattedDate}</td>
            </tr>
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Priority:</td>
              <td class="task-value" style="padding: 6px 0; vertical-align: top;">
                <span style="background-color: ${priorityColor}; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                  ${priority}
                </span>
              </td>
            </tr>
            ${
              institutionName
                ? `
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Institution:</td>
              <td class="task-value" style="padding: 6px 0; color: #0f172a; vertical-align: top;">${institutionName}</td>
            </tr>
            `
                : ""
            }
            ${
              description
                ? `
            <tr>
              <td class="task-label" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Description:</td>
              <td class="task-value" style="padding: 6px 0; color: #334155; line-height: 1.4; white-space: pre-wrap; vertical-align: top;">${description}</td>
            </tr>
            `
                : ""
            }
          </table>
        </div>

        <!-- Dashboard Login Button & Link -->
        <div style="text-align: center; margin-top: 24px; margin-bottom: 16px;">
          <a href="${loginUrl}" class="action-btn" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 3px 6px rgba(37,99,235,0.2);">
            Log In to Dashboard / ড্যাশবোর্ডে লগইন করুন
          </a>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 14px; margin-bottom: 0; line-height: 1.4;">
          Direct login URL / সরাসরি লগইন লিংক:<br />
          <a href="${loginUrl}" class="break-link" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${loginUrl}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Client Registry Management System &copy; ${new Date().getFullYear()}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Client Registry Notifications" <${gmailUser}>`,
    to: assignedToEmail,
    subject: `New Task Assigned: ${taskTitle}`,
    text: textContent,
    html,
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "Importance": "Normal",
    },
  });
}
