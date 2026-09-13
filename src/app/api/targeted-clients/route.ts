import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/targeted-clients?search=&priority=&district=&subDistrict=&status=
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const priority = params.get("priority");
    const district = params.get("district");
    const subDistrict = params.get("subDistrict");
    const status = params.get("status"); // "active" | "archived" | "all"

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { instituteName: { contains: search, mode: "insensitive" } },
        { instituteNameBangla: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { subDistrict: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (district) {
      where.district = { equals: district, mode: "insensitive" };
    }

    if (subDistrict) {
      where.subDistrict = { equals: subDistrict, mode: "insensitive" };
    }

    if (status === "archived") {
      where.isArchived = true;
    } else if (status === "active" || !status) {
      // Matches both false and null (ensures legacy/unmigrated records show)
      where.isArchived = { not: true };
    }
    // if status === "all", don't filter by isArchived

    let clients: any[] = [];
    try {
      clients = await (prisma as any).targetedClient.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { isArchived: "asc" },
          { createdAt: "desc" },
        ],
      });
    } catch (includeError: any) {
      console.warn("targetedClient.findMany with include failed, retrying without createdBy relation:", includeError?.message);
      clients = await (prisma as any).targetedClient.findMany({
        where,
        orderBy: [
          { isArchived: "asc" },
          { createdAt: "desc" },
        ],
      });
    }

    const PRIORITY_ORDER: Record<string, number> = {
      High: 1,
      Default: 2,
      Low: 3,
    };

    clients.sort((a: any, b: any) => {
      const isArchivedA = Boolean(a.isArchived);
      const isArchivedB = Boolean(b.isArchived);
      if (isArchivedA !== isArchivedB) {
        return isArchivedA ? 1 : -1;
      }
      const pA = PRIORITY_ORDER[a.priority] || 99;
      const pB = PRIORITY_ORDER[b.priority] || 99;
      if (pA !== pB) return pA - pB;
      return (a.instituteName || "").localeCompare(b.instituteName || "");
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("GET /api/targeted-clients error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch targeted clients" }, { status: 500 });
  }
}

// POST /api/targeted-clients
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.instituteName || typeof body.instituteName !== "string" || !body.instituteName.trim()) {
      return NextResponse.json({ error: "Institute name is required." }, { status: 400 });
    }

    const priority = ["High", "Default", "Low"].includes(body.priority) ? body.priority : "Default";

    let created: any;
    try {
      created = await (prisma as any).targetedClient.create({
        data: {
          instituteName: body.instituteName.trim(),
          instituteNameBangla: body.instituteNameBangla?.trim() || null,
          contactPerson: body.contactPerson?.trim() || null,
          phone: body.phone?.trim() || null,
          email: body.email?.trim() || null,
          district: body.district?.trim() || null,
          subDistrict: body.subDistrict?.trim() || null,
          address: body.address?.trim() || null,
          priority: priority,
          isArchived: Boolean(body.isArchived),
          notes: body.notes?.trim() || null,
          createdById: body.createdById || null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (createErr: any) {
      console.warn("targetedClient.create with createdById failed, retrying without createdById:", createErr?.message);
      created = await (prisma as any).targetedClient.create({
        data: {
          instituteName: body.instituteName.trim(),
          instituteNameBangla: body.instituteNameBangla?.trim() || null,
          contactPerson: body.contactPerson?.trim() || null,
          phone: body.phone?.trim() || null,
          email: body.email?.trim() || null,
          district: body.district?.trim() || null,
          subDistrict: body.subDistrict?.trim() || null,
          address: body.address?.trim() || null,
          priority: priority,
          isArchived: Boolean(body.isArchived),
          notes: body.notes?.trim() || null,
        },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/targeted-clients error:", error);
    return NextResponse.json({ error: error.message || "Failed to create targeted client" }, { status: 500 });
  }
}
