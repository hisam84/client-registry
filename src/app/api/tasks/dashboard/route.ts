import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const employeeId = params.get("employeeId");
    const currentUserId = params.get("currentUserId");
    const taskCategory = params.get("taskCategory");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = { deletedAt: null };

    if (employeeId && employeeId !== "all") {
      where.OR = [
        { assignedToId: employeeId },
        { assignedById: employeeId }
      ];
    } else if (taskCategory && currentUserId) {
      if (taskCategory === "my_tasks") {
        where.assignedToId = currentUserId;
      } else if (taskCategory === "self") {
        where.assignedToId = currentUserId;
        where.OR = [
          { assignedById: currentUserId },
          { assignedById: null }
        ];
      } else if (taskCategory === "assigned_by_others") {
        where.assignedToId = currentUserId;
        where.assignedById = { not: currentUserId };
      } else if (taskCategory === "assigned_to_others") {
        where.assignedById = currentUserId;
        where.assignedToId = { not: currentUserId };
      } else if (taskCategory === "unassigned") {
        where.assignedToId = null;
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
    const unassignedTasks = allTasks.filter((t) => !t.assignedToId).length;

    const overdueTasks = allTasks.filter(
      (t) => new Date(t.dueDate) < now && !isTerminal(t.status)
    ).length;

    const tasksToday = allTasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday && !isTerminal(t.status);
    }).length;

    const upcomingTasks = allTasks.filter(
      (t) => new Date(t.dueDate) >= now && !isTerminal(t.status)
    ).length;

    // Daily breakdown for the next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(startOfToday);
      dayDate.setDate(dayDate.getDate() + i);
      const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

      const count = allTasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d >= dayDate && d <= dayEnd;
      }).length;

      const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return { label: dayLabel, count, date: dayDate.toISOString() };
    });

    // Priority breakdown
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
      tasksToday,
      upcomingTasks,
      next7Days,
      priorities: {
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
