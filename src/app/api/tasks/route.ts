import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/tasks?search=&status=&priority=&upcoming=&institutionId=
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const status = params.get("status");
    const priority = params.get("priority");
    const upcoming = params.get("upcoming"); // "true" or "false"
    const institutionId = params.get("institutionId");

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { institutionName: { contains: search, mode: "insensitive" } },
        { institution: { instituteName: { contains: search, mode: "insensitive" } } },
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

    const tasks = await (prisma as any).task.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
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
    const { title, description, dueDate, status, priority, completionNote, progress, institutionId, institutionName } = body;

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
      },
      include: {
        institution: {
          select: {
            id: true,
            instituteName: true,
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
