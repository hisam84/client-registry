import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInstitutionData } from "@/lib/institution";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of institutions." }, { status: 400 });
    }

    const validInstitutions = [];
    const errors = [];

    for (let i = 0; i < body.length; i++) {
      const item = body[i];
      if (!item.instituteName || typeof item.instituteName !== "string") {
        errors.push(`Row ${i + 2}: Institute name is required.`);
        continue;
      }
      validInstitutions.push(buildInstitutionData(item));
    }

    if (validInstitutions.length > 0) {
      const created = await prisma.institution.createMany({
        data: validInstitutions,
      });
      return NextResponse.json({
        success: true,
        count: created.count,
        errors: errors.length > 0 ? errors : undefined
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: "No valid institutions found in the file.",
        details: errors
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Failed to process bulk upload." }, { status: 500 });
  }
}
