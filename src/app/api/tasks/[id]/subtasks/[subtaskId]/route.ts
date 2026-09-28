import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSubtaskTable } from "@/lib/ensureSubtaskTable";

export const dynamic = "force-dynamic";

// PATCH /api/tasks/[id]/subtasks/[subtaskId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    await ensureSubtaskTable();
    const body = await req.json();
    const { isCompleted, title, completedById } = body;

    const existingSubtask = await (prisma as any).subtask.findUnique({
      where: { id: params.subtaskId },
    });

    if (!existingSubtask || existingSubtask.taskId !== params.id) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (typeof isCompleted === "boolean") {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
        updateData.completedById = completedById || null;
      } else {
        updateData.completedAt = null;
        updateData.completedById = null;
      }
    }

    const updatedSubtask = await (prisma as any).subtask.update({
      where: { id: params.subtaskId },
      data: updateData,
    });

    // Recalculate main task progress
    const allSubtasks = await (prisma as any).subtask.findMany({
      where: { taskId: params.id },
    });

    const total = allSubtasks.length;
    const completed = allSubtasks.filter((s: any) => s.isCompleted).length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const taskUpdateData: any = {
      progress: newProgress,
    };

    // If task was To Do and a subtask started/completed, move task to In Progress
    const mainTask = await (prisma as any).task.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (mainTask && mainTask.status === "To Do" && completed > 0 && newProgress < 100) {
      taskUpdateData.status = "In Progress";
    }

    const updatedTask = await (prisma as any).task.update({
      where: { id: params.id },
      data: taskUpdateData,
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      subtask: updatedSubtask,
      task: updatedTask,
      allCompleted: total > 0 && completed === total,
    });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id]/subtasks/[subtaskId] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subtask" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/subtasks/[subtaskId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    await ensureSubtaskTable();

    await (prisma as any).subtask.delete({
      where: { id: params.subtaskId },
    });

    // Recalculate main task progress
    const remaining = await (prisma as any).subtask.findMany({
      where: { taskId: params.id },
    });

    const total = remaining.length;
    const completed = remaining.filter((s: any) => s.isCompleted).length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const updatedTask = await (prisma as any).task.update({
      where: { id: params.id },
      data: { progress: newProgress },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[id]/subtasks/[subtaskId] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
