import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await (prisma as any).task.findUnique({
      where: { id: params.id },
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

    if (!task || task.deletedAt) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch task" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (completionNote !== undefined) data.completionNote = completionNote ? completionNote.trim() : null;

    if (progress !== undefined) {
      data.progress = Math.min(100, Math.max(0, Number(progress)));
    } else if (status === "Completed") {
      data.progress = 100;
    }

    if (institutionId !== undefined) data.institutionId = institutionId || null;
    if (institutionName !== undefined) data.institutionName = institutionName || null;

    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (assignedById !== undefined) data.assignedById = assignedById || null;

    if (institutionId && !institutionName) {
      const inst = await prisma.institution.findUnique({
        where: { id: institutionId },
        select: { instituteName: true },
      });
      if (inst) data.institutionName = inst.instituteName;
    }

    const updated = await (prisma as any).task.update({
      where: { id: params.id },
      data,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updated = await (prisma as any).task.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
