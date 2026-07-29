import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const allTasks: any[] = await (prisma as any).task.findMany({
      where: { deletedAt: null },
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "Completed").length;
    const pendingTasks = allTasks.filter((t) => t.status === "Pending").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "In Progress").length;
    const cancelledTasks = allTasks.filter((t) => t.status === "Cancelled").length;

    const overdueTasks = allTasks.filter(
      (t) => new Date(t.dueDate) < startOfToday && t.status !== "Completed" && t.status !== "Cancelled"
    ).length;

    const tasksToday = allTasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday && t.status !== "Completed" && t.status !== "Cancelled";
    }).length;

    const upcomingTasks = allTasks.filter(
      (t) => new Date(t.dueDate) >= startOfToday && t.status !== "Completed" && t.status !== "Cancelled"
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
    const highPriority = allTasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;
    const mediumPriority = allTasks.filter((t) => t.priority === "Medium" && t.status !== "Completed").length;
    const lowPriority = allTasks.filter((t) => t.priority === "Low" && t.status !== "Completed").length;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      cancelledTasks,
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
