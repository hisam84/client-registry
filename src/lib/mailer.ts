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

  // Use explicit TLS SMTP config for optimal Gmail deliverability
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
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

  const assignedByText = assignedByName ? assignedByName : "Admin";

  const loginUrl = "https://client-registry-gray.vercel.app/login";

  // Clean, natural plain-text version to satisfy SPF/SpamAssassin check
  const textContent = `
Task Assignment: ${taskTitle}

Dear ${assignedToName},

You have been assigned a new task by ${assignedByText}.

Task: ${taskTitle}
Assigned By: ${assignedByText}
Due Date: ${formattedDate}
Priority: ${priority}
${institutionName ? `Institution: ${institutionName}\n` : ""}${description ? `Notes: ${description}\n` : ""}
You can view this task on your dashboard:
${loginUrl}

Client Registry
  `.trim();

  // Optimized HTML with high inbox deliverability & full mobile responsiveness
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Task Assignment</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; padding: 8px !important; }
      .content-cell { padding: 16px 12px !important; }
      .responsive-td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .responsive-btn { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container-table" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 18px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; font-family: Arial, sans-serif;">Task Assignment Notification</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content-cell" style="padding: 24px; color: #334155;">
              <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>${assignedToName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; color: #475569;">
                You have been assigned a new task by <strong>${assignedByText}</strong>. Please find the details below:
              </p>

              <!-- Task Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${priorityColor}; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; width: 120px; color: #64748b;">Task Title:</td>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: 600; color: #0f172a;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; color: #64748b;">Assigned By:</td>
                        <td class="responsive-td" style="padding: 6px 0; color: #0f172a;">${assignedByText}</td>
                      </tr>
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; color: #64748b;">Due Date:</td>
                        <td class="responsive-td" style="padding: 6px 0; color: #0f172a;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; color: #64748b;">Priority:</td>
                        <td class="responsive-td" style="padding: 6px 0;">
                          <span style="background-color: ${priorityColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                      ${
                        institutionName
                          ? `
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; color: #64748b;">Institution:</td>
                        <td class="responsive-td" style="padding: 6px 0; color: #0f172a;">${institutionName}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        description
                          ? `
                      <tr>
                        <td class="responsive-td" style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Description:</td>
                        <td class="responsive-td" style="padding: 6px 0; color: #334155; line-height: 1.4; white-space: pre-wrap;">${description}</td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0 20px 0;">
                    <a href="${loginUrl}" class="responsive-btn" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block;">
                      View Task on Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
                Direct Link: <a href="${loginUrl}" style="color: #2563eb; text-decoration: underline;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Client Registry Management System &copy; ${new Date().getFullYear()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: gmailUser,
    replyTo: gmailUser,
    to: assignedToEmail,
    subject: `Task Assignment: ${taskTitle}`,
    text: textContent,
    html,
  });
}
