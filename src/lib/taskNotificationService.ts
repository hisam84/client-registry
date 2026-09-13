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
 * Checks all pending / in-progress tasks for:
 * 1. Tasks due in 2 hours (only if total task duration was >= 2 hours)
 * 2. Overdue tasks (strictly once per task)
 */
export async function checkAndSendTaskAlerts(): Promise<TaskAlertCheckResult> {
  const result: TaskAlertCheckResult = {
    checkedCount: 0,
    remindersSent: 0,
    overdueSent: 0,
    errors: [],
  };

  try {
    // Synchronize with database persistent record to prevent duplicate emails across serverless instances
    const persisted = await loadPersistedAlerts();
    for (const id of persisted.overdue) sentOverdueMemory.add(id);
    for (const id of persisted.reminders) sentRemindersMemory.add(id);

    const tasks: any[] = await (prisma as any).task.findMany({
      where: {
        deletedAt: null,
        status: { in: ["Pending", "In Progress"] },
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
      if (!task.assignedTo?.email) continue;

      const dueDate = new Date(task.dueDate);
      const createdAt = new Date(task.createdAt);
      const msUntilDue = dueDate.getTime() - now.getTime();
      const totalDurationMs = dueDate.getTime() - createdAt.getTime();

      // CASE A: 2 Hours Before Deadline Alert
      // Rule: Trigger if due within 2 hours, BUT SKIP if total task lifetime is less than 2 hours.
      const isDueInTwoHours = msUntilDue > 0 && msUntilDue <= TWO_HOURS_MS;
      const isEligibleDuration = totalDurationMs >= TWO_HOURS_MS;
      const reminderAlreadySent = sentRemindersMemory.has(task.id);

      if (isDueInTwoHours && isEligibleDuration && !reminderAlreadySent) {
        try {
          sentRemindersMemory.add(task.id);
          await savePersistedAlerts(sentOverdueMemory, sentRemindersMemory);

          await sendTaskDueSoonEmail({
            taskTitle: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            institutionName: task.institutionName || task.institution?.instituteName,
            assignedByName: task.assignedBy?.name || null,
            assignedToEmail: task.assignedTo.email,
            assignedToName: task.assignedTo.name,
            hoursRemaining: 2,
          });

          result.remindersSent++;
        } catch (err: any) {
          result.errors.push(`Failed to send 2h reminder for task ${task.id}: ${err.message}`);
        }
      }

      // CASE B: Task Overdue Alert (Sent strictly once per task)
      const isOverdue = msUntilDue < 0;
      const overdueAlreadySent = sentOverdueMemory.has(task.id);

      if (isOverdue && !overdueAlreadySent) {
        try {
          sentOverdueMemory.add(task.id);
          await savePersistedAlerts(sentOverdueMemory, sentRemindersMemory);

          const hoursOverdue = Math.max(1, Math.round(Math.abs(msUntilDue) / (1000 * 60 * 60)));
          const timeOverdueText = `This task is overdue by ${hoursOverdue} hour${hoursOverdue === 1 ? "" : "s"}.`;

          await sendTaskOverdueEmail({
            taskTitle: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            institutionName: task.institutionName || task.institution?.instituteName,
            assignedByName: task.assignedBy?.name || null,
            assignedToEmail: task.assignedTo.email,
            assignedToName: task.assignedTo.name,
            assignerEmail: task.assignedBy?.email || null,
            timeOverdueText,
          });

          result.overdueSent++;
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
