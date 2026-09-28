import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSubtaskTable } from "@/lib/ensureSubtaskTable";

export const dynamic = "force-dynamic";

// GET /api/tasks/[id]/subtasks
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSubtaskTable();
    const subtasks = await (prisma as any).subtask.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(subtasks);
  } catch (error: any) {
    console.error("GET /api/tasks/[id]/subtasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch subtasks" }, { status: 500 });
  }
}

// POST /api/tasks/[id]/subtasks
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSubtaskTable();
    const body = await req.json();
    const { title, createdById } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Subtask title is required" }, { status: 400 });
    }

    const task = await (prisma as any).task.findUnique({
      where: { id: params.id },
    });

    if (!task || task.deletedAt) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create subtask
    const newSubtask = await (prisma as any).subtask.create({
      data: {
        taskId: params.id,
        title: title.trim(),
        createdById: createdById || null,
        isCompleted: false,
      },
    });

    // Recalculate task progress
    const allSubtasks = await (prisma as any).subtask.findMany({
      where: { taskId: params.id },
    });

    const total = allSubtasks.length;
    const completed = allSubtasks.filter((s: any) => s.isCompleted).length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : task.progress;

    const updatedTask = await (prisma as any).task.update({
      where: { id: params.id },
      data: {
        progress: newProgress,
      },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        subtask: newSubtask,
        task: updatedTask,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/tasks/[id]/subtasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to create subtask" }, { status: 500 });
  }
}
