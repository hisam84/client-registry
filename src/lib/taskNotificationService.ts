import { prisma } from "@/lib/prisma";
import { sendTaskDueSoonEmail, sendTaskOverdueEmail } from "@/lib/mailer";

// In-memory fallback sets to guarantee no duplicate emails even if database columns haven't been pushed yet
const sentRemindersMemory = new Set<string>();
const sentOverdueMemory = new Set<string>();

export interface TaskAlertCheckResult {
  checkedCount: number;
  remindersSent: number;
  overdueSent: number;
  errors: string[];
}

/**
 * Checks all pending / in-progress tasks for:
 * 1. Tasks due in 2 hours (only if total task duration was >= 2 hours)
 * 2. Overdue tasks
 */
export async function checkAndSendTaskAlerts(): Promise<TaskAlertCheckResult> {
  const result: TaskAlertCheckResult = {
    checkedCount: 0,
    remindersSent: 0,
    overdueSent: 0,
    errors: [],
  };

  try {
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
      const reminderAlreadySent = Boolean(task.reminderSentAt) || sentRemindersMemory.has(task.id);

      if (isDueInTwoHours && isEligibleDuration && !reminderAlreadySent) {
        try {
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

          sentRemindersMemory.add(task.id);
          result.remindersSent++;

          // Attempt to update database timestamp
          try {
            await (prisma as any).task.update({
              where: { id: task.id },
              data: { reminderSentAt: now },
            });
          } catch (dbErr) {
            // Safe fallback if column not yet added to live DB
          }
        } catch (err: any) {
          result.errors.push(`Failed to send 2h reminder for task ${task.id}: ${err.message}`);
        }
      }

      // CASE B: Task Overdue Alert
      const isOverdue = msUntilDue < 0;
      const overdueAlreadySent = Boolean(task.overdueSentAt) || sentOverdueMemory.has(task.id);

      if (isOverdue && !overdueAlreadySent) {
        try {
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

          sentOverdueMemory.add(task.id);
          result.overdueSent++;

          // Attempt to update database timestamp
          try {
            await (prisma as any).task.update({
              where: { id: task.id },
              data: { overdueSentAt: now },
            });
          } catch (dbErr) {
            // Safe fallback if column not yet added to live DB
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
