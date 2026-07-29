import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/tasks?search=&status=&priority=&upcoming=&institutionId=&assignedToId=&assignedById=&taskCategory=&currentUserId=&employeeId=
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const status = params.get("status");
    const priority = params.get("priority");
    const upcoming = params.get("upcoming"); // "true" or "false"
    const institutionId = params.get("institutionId");
    const assignedToId = params.get("assignedToId");
    const assignedById = params.get("assignedById");
    const taskCategory = params.get("taskCategory"); // "self" | "assigned_by_others" | "assigned_to_others" | "unassigned"
    const currentUserId = params.get("currentUserId");
    const employeeId = params.get("employeeId"); // Super Admin filter

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { institutionName: { contains: search, mode: "insensitive" } },
        { institution: { instituteName: { contains: search, mode: "insensitive" } } },
        { assignedTo: { name: { contains: search, mode: "insensitive" } } },
        { assignedBy: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (upcoming === "true") {
      const now = new Date();
      where.dueDate = { gte: now };
      if (!status) {
        where.status = { in: ["Pending", "In Progress"] };
      }
    }

    // Specific employee filter (Super Admin view)
    if (employeeId && employeeId !== "all") {
      where.OR = [
        { assignedToId: employeeId },
        { assignedById: employeeId },
      ];
    } else if (assignedToId) {
      if (assignedToId === "unassigned") {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    } else if (assignedById) {
      where.assignedById = assignedById;
    }

    // Category Tabs Filter
    if (taskCategory && currentUserId) {
      if (taskCategory === "my_tasks") {
        // All tasks assigned to me
        where.assignedToId = currentUserId;
      } else if (taskCategory === "self") {
        // Self assigned: assigned to me AND (assigned by me OR assignedById is null)
        where.assignedToId = currentUserId;
        where.OR = [
          { assignedById: currentUserId },
          { assignedById: null }
        ];
      } else if (taskCategory === "assigned_by_others") {
        // Assigned to me by someone else
        where.assignedToId = currentUserId;
        where.assignedById = { not: currentUserId };
      } else if (taskCategory === "assigned_to_others") {
        // Tasks assigned by me to another employee
        where.assignedById = currentUserId;
        where.assignedToId = { not: currentUserId };
      } else if (taskCategory === "unassigned") {
        // Unassigned tasks
        where.assignedToId = null;
      }
    }

    const tasks = await (prisma as any).task.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orderSerial: true,
            designation: true,
            phone: true,
            avatarColor: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orderSerial: true,
            designation: true,
            phone: true,
            avatarColor: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      dueDate,
      status,
      priority,
      completionNote,
      progress,
      institutionId,
      institutionName,
      assignedToId,
      assignedById,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: "Due date and time are required." }, { status: 400 });
    }

    let finalInstName = institutionName;
    if (institutionId && !finalInstName) {
      const inst = await prisma.institution.findUnique({
        where: { id: institutionId },
        select: { instituteName: true },
      });
      if (inst) finalInstName = inst.instituteName;
    }

    const taskStatus = status || "Pending";
    let progressVal = progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : (taskStatus === "Completed" ? 100 : 0);

    const task = await (prisma as any).task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: new Date(dueDate),
        status: taskStatus,
        priority: priority || "Medium",
        completionNote: completionNote?.trim() || null,
        progress: progressVal,
        institutionId: institutionId || null,
        institutionName: finalInstName || null,
        assignedToId: assignedToId || null,
        assignedById: assignedById || null,
      },
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orderSerial: true,
            designation: true,
            phone: true,
            avatarColor: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orderSerial: true,
            designation: true,
            phone: true,
            avatarColor: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
