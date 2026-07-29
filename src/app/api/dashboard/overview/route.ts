import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // 1. Fetch Institutions
    const institutions = await prisma.institution.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        instituteName: true,
        category: true,
        instituteType: true,
        expireDate: true,
        district: true,
        subDistrict: true,
      },
    });

    let instActive = 0;
    let instExpiringSoon = 0;
    let instExpired = 0;
    let instNoExpiry = 0;

    const categoryCounts: Record<string, number> = {
      Website: 0,
      Software: 0,
      "Website & Software": 0,
      Other: 0,
    };
    const typeCounts: Record<string, number> = {};

    institutions.forEach((inst) => {
      // Type count
      const type = inst.instituteType || "Other";
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // Category count parsing (case-insensitive & trimmed)
      const rawCat = (inst.category || "").trim();
      const lower = rawCat.toLowerCase();

      if (lower.includes("website") && lower.includes("software")) {
        categoryCounts["Website & Software"]++;
      } else if (lower.includes("website") || lower === "web") {
        categoryCounts["Website"]++;
      } else if (lower.includes("software") || lower === "app") {
        categoryCounts["Software"]++;
      } else if (rawCat) {
        // Capitalize first letter for display
        const displayKey = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
        categoryCounts[displayKey] = (categoryCounts[displayKey] || 0) + 1;
      } else {
        categoryCounts["Other"]++;
      }

      // Status count
      if (!inst.expireDate) {
        instNoExpiry++;
      } else {
        const exp = new Date(inst.expireDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          instExpired++;
        } else if (diffDays <= 30) {
          instExpiringSoon++;
        } else {
          instActive++;
        }
      }
    });

    // Clean zero-entry categories if not core
    Object.keys(categoryCounts).forEach((key) => {
      if (categoryCounts[key] === 0 && !["Website", "Software"].includes(key)) {
        delete categoryCounts[key];
      }
    });

    // Top 5 Expiring Soon Institutions
    const expiringSoonList = institutions
      .filter((inst) => {
        if (!inst.expireDate) return false;
        const exp = new Date(inst.expireDate);
        return exp >= now && exp <= soonThreshold;
      })
      .sort((a, b) => new Date(a.expireDate!).getTime() - new Date(b.expireDate!).getTime())
      .slice(0, 5);

    // 2. Fetch Targeted Clients
    const targetedClients = await prisma.targetedClient.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        priority: true,
        isArchived: true,
      },
    });

    const targetedTotalActive = targetedClients.filter((c) => !c.isArchived).length;
    const targetedHighPriority = targetedClients.filter((c) => !c.isArchived && c.priority === "High").length;
    const targetedArchived = targetedClients.filter((c) => c.isArchived).length;

    // 3. Fetch Tasks
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const tasks: any[] = await (prisma as any).task.findMany({
      where: { deletedAt: null },
      include: {
        institution: {
          select: { id: true, instituteName: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const overdueTasks = tasks.filter(
      (t) => new Date(t.dueDate) < now && t.status !== "Completed" && t.status !== "Cancelled"
    ).length;
    const tasksToday = tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday && t.status !== "Completed";
    }).length;
    const upcomingTasksCount = tasks.filter(
      (t) => new Date(t.dueDate) >= now && t.status !== "Completed" && t.status !== "Cancelled"
    ).length;

    const upcomingTasksList = tasks
      .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
      .slice(0, 5);

    return NextResponse.json({
      institutions: {
        total: institutions.length,
        active: instActive,
        expiringSoon: instExpiringSoon,
        expired: instExpired,
        noExpiry: instNoExpiry,
        categories: categoryCounts,
        types: typeCounts,
        expiringSoonList,
      },
      targetedClients: {
        active: targetedTotalActive,
        highPriority: targetedHighPriority,
        archived: targetedArchived,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        tasksToday,
        upcomingCount: upcomingTasksCount,
        upcomingList: upcomingTasksList,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/overview error:", error);
    return NextResponse.json({ error: error.message || "Failed to load overview metrics" }, { status: 500 });
  }
}
