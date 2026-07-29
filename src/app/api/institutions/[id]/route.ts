import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInstitutionData } from "@/lib/institution";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const institution = await prisma.institution.findUnique({ where: { id: params.id } });
  if (!institution) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(institution);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // If restoring soft deleted institution
  if (body.restore === true) {
    try {
      const restored = await (prisma as any).institution.update({
        where: { id: params.id },
        data: { deletedAt: null },
      });
      return NextResponse.json(restored);
    } catch (err) {
      return NextResponse.json({ error: "Institution not found." }, { status: 404 });
    }
  }

  if (!body.instituteName || typeof body.instituteName !== "string") {
    return NextResponse.json({ error: "Institute name is required." }, { status: 400 });
  }

  try {
    const data = buildInstitutionData(body);
    const updated = await prisma.institution.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isPermanent = req.nextUrl.searchParams.get("permanent") === "true";

  try {
    if (isPermanent) {
      await prisma.institution.delete({ where: { id: params.id } });
    } else {
      // Soft delete: move to Trash Bin for 30 days
      await (prisma as any).institution.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }
}
