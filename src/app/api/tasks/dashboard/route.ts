import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDhakaStartOfDay, getDhakaEndOfDay, formatDhakaDate } from "@/lib/dateUtils";
import { ensureSubtaskTable } from "@/lib/ensureSubtaskTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await ensureSubtaskTable();
    const params = req.nextUrl.searchParams;
    const employeeId = params.get("employeeId");
    const currentUserId = params.get("currentUserId");
    const taskCategory = params.get("taskCategory");

    const now = new Date();
    const startOfToday = getDhakaStartOfDay(now);
    const endOfToday = getDhakaEndOfDay(now);

    const where: any = { deletedAt: null };

    if (employeeId && employeeId !== "all") {
      where.OR = [
        { assignedToId: employeeId },
        { assignees: { some: { employeeId } } },
        { assignedById: employeeId }
      ];
    } else if (taskCategory && currentUserId) {
      if (taskCategory === "my_tasks") {
        where.OR = [
          { assignedToId: currentUserId },
          { assignees: { some: { employeeId: currentUserId } } }
        ];
      } else if (taskCategory === "self") {
        where.AND = [
          {
            OR: [
              { assignedToId: currentUserId },
              { assignees: { some: { employeeId: currentUserId } } }
            ]
          },
          {
            OR: [
              { assignedById: currentUserId },
              { assignedById: null }
            ]
          }
        ];
      } else if (taskCategory === "assigned_by_others") {
        where.AND = [
          {
            OR: [
              { assignedToId: currentUserId },
              { assignees: { some: { employeeId: currentUserId } } }
            ]
          },
          { assignedById: { not: currentUserId } }
        ];
      } else if (taskCategory === "assigned_to_others") {
        where.AND = [
          { assignedById: currentUserId },
          {
            NOT: {
              OR: [
                { assignedToId: currentUserId },
                { assignees: { some: { employeeId: currentUserId } } }
              ]
            }
          }
        ];
      } else if (taskCategory === "unassigned") {
        where.AND = [
          { assignedToId: null },
          { assignees: { none: {} } }
        ];
      }
    }

    const allTasks: any[] = await (prisma as any).task.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true }
        },
        assignees: {
          select: { employeeId: true }
        },
        assignedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dueDate: "asc" },
    });

    const isTerminal = (status: string) => status === "Completed" || status === "Canceled" || status === "Cancelled";

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "Completed").length;
    const todoTasks = allTasks.filter((t) => t.status === "To Do" || t.status === "Pending").length;
    const pendingTasks = todoTasks; // backward compatibility alias
    const inProgressTasks = allTasks.filter((t) => t.status === "In Progress").length;
    const inReviewTasks = allTasks.filter((t) => t.status === "In Review").length;
    const cancelledTasks = allTasks.filter((t) => t.status === "Canceled" || t.status === "Cancelled").length;
    const unassignedTasks = allTasks.filter((t) => !t.assignedToId && (!t.assignees || t.assignees.length === 0)).length;

    const overdueTasks = allTasks.filter(
      (t) => new Date(t.dueDate) < now && !isTerminal(t.status)
    ).length;

    const monthlyTasks = allTasks.filter((t) => Boolean(t.isMonthly)).length;
    const activeMonthlyTasks = allTasks.filter(
      (t) => Boolean(t.isMonthly) && !isTerminal(t.status)
    ).length;

    const tasksToday = allTasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday && !isTerminal(t.status);
    }).length;

    const upcomingTasks = allTasks.filter(
      (t) => new Date(t.dueDate) >= now && !isTerminal(t.status)
    ).length;

    // Daily breakdown for the next 7 days (Dhaka timezone)
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(startOfToday.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStart = getDhakaStartOfDay(dayDate);
      const dayEnd = getDhakaEndOfDay(dayDate);

      const count = allTasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d >= dayStart && d <= dayEnd;
      }).length;

      const dayLabel = formatDhakaDate(dayDate, { weekday: "short", month: "short", day: "numeric" }, "en-US");
      return { label: dayLabel, count, date: dayStart.toISOString() };
    });

    // Priority breakdown
    const urgentPriority = allTasks.filter((t) => (t.priority === "Urgent" || t.priority === "Argent") && !isTerminal(t.status)).length;
    const highPriority = allTasks.filter((t) => t.priority === "High" && !isTerminal(t.status)).length;
    const mediumPriority = allTasks.filter((t) => t.priority === "Medium" && !isTerminal(t.status)).length;
    const lowPriority = allTasks.filter((t) => t.priority === "Low" && !isTerminal(t.status)).length;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      todoTasks,
      pendingTasks,
      inProgressTasks,
      inReviewTasks,
      cancelledTasks,
      unassignedTasks,
      overdueTasks,
      monthlyTasks,
      activeMonthlyTasks,
      tasksToday,
      upcomingTasks,
      next7Days,
      priorities: {
        Urgent: urgentPriority,
        High: highPriority,
        Medium: mediumPriority,
        Low: lowPriority,
      },
    });
  } catch (error: any) {
    console.error("GET /api/tasks/dashboard error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
