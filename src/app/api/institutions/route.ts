import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { buildInstitutionData } from "@/lib/institution";

// GET /api/institutions?search=&type=&category=&subDistrict=&district=&status=
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const search = params.get("search")?.trim();
  const type = params.get("type");
  const category = params.get("category");
  const subDistrict = params.get("subDistrict");
  const district = params.get("district");
  const status = params.get("status"); // active | expiring_soon | expired

  const where: any = { AND: [{ deletedAt: null }] };
  const and = where.AND as any[];

  if (search) {
    and.push({
      OR: [
        { instituteName: { contains: search, mode: "insensitive" } },
        { instituteNameBangla: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { instituteHead: { contains: search, mode: "insensitive" } },
        { contact1: { contains: search, mode: "insensitive" } },
        { contact2: { contains: search, mode: "insensitive" } },
        { inChargeTeacher: { contains: search, mode: "insensitive" } },
        { inChargeTeacherContact: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (type) and.push({ instituteType: type });
  if (category) and.push({ category: category });
  if (subDistrict) and.push({ subDistrict: { equals: subDistrict, mode: "insensitive" } });
  if (district) and.push({ district: { equals: district, mode: "insensitive" } });

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (status === "expired") {
    and.push({ expireDate: { lt: now } });
  } else if (status === "expiring_soon") {
    and.push({ expireDate: { gte: now, lte: soon } });
  } else if (status === "active") {
    and.push({ expireDate: { gt: soon } });
  }

  const institutions = await prisma.institution.findMany({
    where,
    orderBy: { instituteName: "asc" },
  });

  const TYPE_PRIORITY: Record<string, number> = {
    "University": 1,
    "College": 2,
    "Polytechnic": 3,
    "School": 4,
    "Madrasah": 5,
    "Kindergarten": 6,
    "Other": 7
  };

  institutions.sort((a, b) => {
    const pA = TYPE_PRIORITY[a.instituteType] || 99;
    const pB = TYPE_PRIORITY[b.instituteType] || 99;
    if (pA !== pB) return pA - pB;
    return a.instituteName.localeCompare(b.instituteName);
  });

  return NextResponse.json(institutions);
}

// POST /api/institutions
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.instituteName || typeof body.instituteName !== "string") {
    return NextResponse.json({ error: "Institute name is required." }, { status: 400 });
  }

  const data = buildInstitutionData(body);

  const created = await prisma.institution.create({ data });
  return NextResponse.json(created, { status: 201 });
}
