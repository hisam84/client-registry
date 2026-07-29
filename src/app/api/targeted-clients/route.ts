import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/targeted-clients?search=&priority=&district=&subDistrict=&status=
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const priority = params.get("priority");
    const district = params.get("district");
    const subDistrict = params.get("subDistrict");
    const status = params.get("status"); // "active" | "archived" | "all"

    const where: any = { AND: [] };
    const and = where.AND as any[];

    if (search) {
      and.push({
        OR: [
          { instituteName: { contains: search, mode: "insensitive" } },
          { instituteNameBangla: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { district: { contains: search, mode: "insensitive" } },
          { subDistrict: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (priority && priority !== "all") {
      and.push({ priority: priority });
    }

    if (district) {
      and.push({ district: { equals: district, mode: "insensitive" } });
    }

    if (subDistrict) {
      and.push({ subDistrict: { equals: subDistrict, mode: "insensitive" } });
    }

    if (status === "archived") {
      and.push({ isArchived: true });
    } else if (status === "active" || !status) {
      and.push({ isArchived: false });
    }
    // if status === "all", don't filter by isArchived

    const clients = await (prisma as any).targetedClient.findMany({
      where,
      orderBy: [
        { isArchived: "asc" },
        { createdAt: "desc" },
      ],
    });

    const PRIORITY_ORDER: Record<string, number> = {
      High: 1,
      Default: 2,
      Low: 3,
    };

    clients.sort((a: any, b: any) => {
      if (a.isArchived !== b.isArchived) {
        return a.isArchived ? 1 : -1;
      }
      const pA = PRIORITY_ORDER[a.priority] || 99;
      const pB = PRIORITY_ORDER[b.priority] || 99;
      if (pA !== pB) return pA - pB;
      return a.instituteName.localeCompare(b.instituteName);
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

    const created = await (prisma as any).targetedClient.create({
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

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/targeted-clients error:", error);
    return NextResponse.json({ error: error.message || "Failed to create targeted client" }, { status: 500 });
  }
}
