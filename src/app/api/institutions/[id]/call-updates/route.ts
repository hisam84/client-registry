import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CallUpdate } from "@/lib/types";

// GET /api/institutions/[id]/call-updates - List call updates for an institution
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      select: { id: true, customFields: true },
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const cf = (institution.customFields as any) || {};
    const callUpdates: CallUpdate[] = Array.isArray(cf.callUpdates) ? cf.callUpdates : [];

    return NextResponse.json({ callUpdates });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/call-updates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch call updates" },
      { status: 500 }
    );
  }
}

// POST /api/institutions/[id]/call-updates - Add a new call update
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { employeeId, employeeName, subject, details } = body;

    if (!employeeName || !employeeName.trim()) {
      return NextResponse.json(
        { error: "Employee selection is required" },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Call subject is required" },
        { status: 400 }
      );
    }

    if (!details || !details.trim()) {
      return NextResponse.json(
        { error: "Call description/notes are required" },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const currentCf =
      institution.customFields && typeof institution.customFields === "object"
        ? (institution.customFields as any)
        : {};

    const existingCalls: CallUpdate[] = Array.isArray(currentCf.callUpdates)
      ? currentCf.callUpdates
      : [];

    const newCallUpdate: CallUpdate = {
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      employeeId: employeeId || null,
      employeeName: employeeName.trim(),
      subject: subject.trim(),
      details: details.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCalls = [newCallUpdate, ...existingCalls];

    const updated = await prisma.institution.update({
      where: { id: params.id },
      data: {
        customFields: {
          ...currentCf,
          callUpdates: updatedCalls,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        callUpdate: newCallUpdate,
        callUpdates: updatedCalls,
        institution: updated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/call-updates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save call update" },
      { status: 500 }
    );
  }
}
