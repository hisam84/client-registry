import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fields = await prisma.customFieldDefinition.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(fields);
}

function slugify(label: string) {
  return (
    "cf_" +
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "cf_field"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.label || typeof body.label !== "string") {
    return NextResponse.json({ error: "Field label is required." }, { status: 400 });
  }
  const fieldType = ["text", "number", "date"].includes(body.fieldType) ? body.fieldType : "text";

  let key = slugify(body.label);
  const existing = await prisma.customFieldDefinition.findMany();
  const usedKeys = new Set(existing.map((f: { key: string }) => f.key));
  let unique = key;
  let i = 2;
  while (usedKeys.has(unique)) {
    unique = `${key}_${i}`;
    i++;
  }

  const created = await prisma.customFieldDefinition.create({
    data: { key: unique, label: body.label, fieldType },
  });
  return NextResponse.json(created, { status: 201 });
}
