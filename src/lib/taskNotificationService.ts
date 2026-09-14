import { prisma } from "@/lib/prisma";
import { sendTaskDueSoonEmail, sendTaskOverdueEmail } from "@/lib/mailer";

// In-memory cache for fast lookups
const sentRemindersMemory = new Set<string>();
const sentOverdueMemory = new Set<string>();

export interface TaskAlertCheckResult {
  checkedCount: number;
  remindersSent: number;
  overdueSent: number;
  errors: string[];
}

/**
 * Loads previously sent alerts from persistent storage (SiteSettings record).
 */
async function loadPersistedAlerts(): Promise<{ overdue: Set<string>; reminders: Set<string> }> {
  try {
    const record = await (prisma as any).siteSettings.findUnique({
      where: { id: "sent_task_alerts" },
    });
    if (record?.adminEmail) {
      const data = JSON.parse(record.adminEmail);
      return {
        overdue: new Set(Array.isArray(data.overdue) ? data.overdue : []),
        reminders: new Set(Array.isArray(data.reminders) ? data.reminders : []),
      };
    }
  } catch (err: any) {
    console.warn("Could not load persisted task alerts state:", err?.message);
  }
  return { overdue: new Set(), reminders: new Set() };
}

/**
 * Persists sent alert IDs permanently across all serverless invocations and restarts.
 */
async function savePersistedAlerts(overdue: Set<string>, reminders: Set<string>) {
  try {
    const payload = JSON.stringify({
      overdue: Array.from(overdue),
      reminders: Array.from(reminders),
      updatedAt: new Date().toISOString(),
    });
    await (prisma as any).siteSettings.upsert({
      where: { id: "sent_task_alerts" },
      create: {
        id: "sent_task_alerts",
        password: "internal_alerts",
        adminEmail: payload,
      },
      update: {
        adminEmail: payload,
      },
    });
  } catch (err: any) {
    console.error("Could not save persisted task alerts state:", err?.message);
  }
}

/**
 * Clears the persisted task alerts cache, allowing alerts to re-trigger.
 */
export async function clearPersistedTaskAlerts() {
  sentOverdueMemory.clear();
  sentRemindersMemory.clear();
  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: "sent_task_alerts" },
      create: {
        id: "sent_task_alerts",
        password: "internal_alerts",
        adminEmail: JSON.stringify({ overdue: [], reminders: [], updatedAt: new Date().toISOString() }),
      },
      update: {
        adminEmail: JSON.stringify({ overdue: [], reminders: [], updatedAt: new Date().toISOString() }),
      },
    });
  } catch (err: any) {
    console.error("Could not clear persisted task alerts state:", err?.message);
  }
}

/**
 * Checks all pending / in-progress tasks for:
 * 1. Tasks due in 2 hours (only if total task duration was >= 2 hours)
 * 2. Overdue tasks (strictly once per task, unless forced)
 */
export async function checkAndSendTaskAlerts(options?: { force?: boolean }): Promise<TaskAlertCheckResult> {
  const result: TaskAlertCheckResult = {
    checkedCount: 0,
    remindersSent: 0,
    overdueSent: 0,
    errors: [],
  };

  try {
    // Synchronize with database persistent record
    const persisted = await loadPersistedAlerts();
    for (const id of persisted.overdue) sentOverdueMemory.add(id);
    for (const id of persisted.reminders) sentRemindersMemory.add(id);

    if (options?.force) {
      sentOverdueMemory.clear();
      sentRemindersMemory.clear();
    }

    const tasks: any[] = await (prisma as any).task.findMany({
      where: {
        deletedAt: null,
        status: { in: ["To Do", "In Progress", "In Review", "Pending"] },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        institution: {
          select: {
            id: true,
            instituteName: true,
          },
        },
      },
    });

    result.checkedCount = tasks.length;
    const now = new Date();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms

    for (const task of tasks) {
      const dueDate = new Date(task.dueDate);
      const createdAt = new Date(task.createdAt);
      const msUntilDue = dueDate.getTime() - now.getTime();
      const totalDurationMs = dueDate.getTime() - createdAt.getTime();

      // Resolve recipient emails with fallback so unassigned or admin-created tasks are never skipped
      const assignedToEmail = task.assignedTo?.email?.trim();
      const assignedToName = task.assignedTo?.name || "Assigned Team Member";
      const assignedByEmail = task.assignedBy?.email?.trim();
      const assignedByName = task.assignedBy?.name || "Administrator";

      const primaryEmail = assignedToEmail || assignedByEmail || "imperialitbd2011@gmail.com";
      const primaryName = assignedToEmail ? assignedToName : (assignedByEmail ? assignedByName : "System Administrator");
      const assignerNotificationEmail = assignedByEmail || (assignedToEmail ? null : "imperialitbd2011@gmail.com");

      // CASE A: 2 Hours Before Deadline Alert
      // Trigger if due within 2 hours, BUT SKIP if total task lifetime is less than 2 hours.
      const isDueInTwoHours = msUntilDue > 0 && msUntilDue <= TWO_HOURS_MS;
      const isEligibleDuration = totalDurationMs >= TWO_HOURS_MS;
      const reminderAlreadySent = sentRemindersMemory.has(task.id);

      if (isDueInTwoHours && isEligibleDuration && (!reminderAlreadySent || options?.force)) {
        try {
          const sendResult = await sendTaskDueSoonEmail({
            taskTitle: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            institutionName: task.institutionName || task.institution?.instituteName,
            assignedByName: assignedByName,
            assignedToEmail: primaryEmail,
            assignedToName: primaryName,
            hoursRemaining: 2,
          });

          if (sendResult?.success) {
            sentRemindersMemory.add(task.id);
            await savePersistedAlerts(sentOverdueMemory, sentRemindersMemory);
            result.remindersSent++;
          } else {
            result.errors.push(`2h reminder not delivered for "${task.title}": ${sendResult?.error || "Unknown delivery error"}`);
          }
        } catch (err: any) {
          result.errors.push(`Failed to send 2h reminder for task ${task.id}: ${err.message}`);
        }
      }

      // CASE B: Task Overdue Alert
      const isOverdue = msUntilDue < 0;
      const overdueAlreadySent = sentOverdueMemory.has(task.id);

      if (isOverdue && (!overdueAlreadySent || options?.force)) {
        try {
          const totalHoursOverdue = Math.max(1, Math.round(Math.abs(msUntilDue) / (1000 * 60 * 60)));
          let timeOverdueText = `This task is overdue by ${totalHoursOverdue} hour${totalHoursOverdue === 1 ? "" : "s"}.`;
          if (totalHoursOverdue >= 48) {
            const daysOverdue = Math.floor(totalHoursOverdue / 24);
            timeOverdueText = `This task is overdue by ${daysOverdue} days.`;
          }

          const sendResult = await sendTaskOverdueEmail({
            taskTitle: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            institutionName: task.institutionName || task.institution?.instituteName,
            assignedByName: assignedByName,
            assignedToEmail: primaryEmail,
            assignedToName: primaryName,
            assignerEmail: assignerNotificationEmail,
            timeOverdueText,
          });

          if (sendResult?.success) {
            sentOverdueMemory.add(task.id);
            await savePersistedAlerts(sentOverdueMemory, sentRemindersMemory);
            result.overdueSent++;
          } else {
            result.errors.push(`Overdue alert not delivered for "${task.title}": ${sendResult?.error || "Unknown delivery error"}`);
          }
        } catch (err: any) {
          result.errors.push(`Failed to send overdue alert for task ${task.id}: ${err.message}`);
        }
      }
    }
  } catch (error: any) {
    console.error("checkAndSendTaskAlerts general error:", error);
    result.errors.push(error.message || "General check error");
  }

  return result;
}
