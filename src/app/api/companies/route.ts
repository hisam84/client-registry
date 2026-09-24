import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCompanyTables } from "@/lib/ensureCompanyTables";

export async function GET(req: Request) {
  try {
    await ensureCompanyTables();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const district = searchParams.get("district")?.trim() || "";
    const softwareId = searchParams.get("softwareId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "all";

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { companyNameBangla: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ];
    }

    if (district) {
      where.district = { equals: district, mode: "insensitive" };
    }

    if (softwareId) {
      where.subscriptions = {
        some: {
          softwareId: softwareId,
          deletedAt: null,
        },
      };
    }

    const companies = await (prisma as any).company.findMany({
      where,
      include: {
        subscriptions: {
          where: { deletedAt: null },
          include: {
            software: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    let filtered = companies;

    if (status && status !== "all") {
      filtered = companies.filter((comp: any) => {
        const subs = comp.subscriptions || [];
        if (subs.length === 0) return status === "no_subscription";

        return subs.some((sub: any) => {
          if (!sub.expireDate) return status === "active";
          const exp = new Date(sub.expireDate);
          const diffMs = exp.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (status === "active") return diffDays > 60 && sub.status !== "Deactivated" && sub.status !== "Cancelled";
          if (status === "expiring_soon") return diffDays >= 0 && diffDays <= 60 && sub.status !== "Deactivated" && sub.status !== "Cancelled";
          if (status === "expired") return diffDays < 0 && sub.status !== "Deactivated" && sub.status !== "Cancelled";
          if (status === "deactivated") return sub.status === "Deactivated" || sub.status === "Cancelled";
          return true;
        });
      });
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error("GET /api/companies error:", error);
    // Return empty array on initial table creation gracefully
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await ensureCompanyTables();

    const body = await req.json();
    const {
      companyName,
      companyNameBangla,
      contactPerson,
      designation,
      phone,
      email,
      address,
      district,
      subDistrict,
      website,
      notes,
      subscriptions,
    } = body;

    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ error: "Company Name is required" }, { status: 400 });
    }

    const createdCompany = await (prisma as any).company.create({
      data: {
        companyName: companyName.trim(),
        companyNameBangla: companyNameBangla?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        designation: designation?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        district: district?.trim() || null,
        subDistrict: subDistrict?.trim() || null,
        website: website?.trim() || null,
        notes: notes?.trim() || null,
        subscriptions: subscriptions && Array.isArray(subscriptions) && subscriptions.length > 0
          ? {
              create: subscriptions.map((sub: any) => ({
                softwareId: sub.softwareId,
                billingCycle: sub.billingCycle || "Yearly",
                price: sub.price ? parseFloat(sub.price) : null,
                status: sub.status || "Active",
                startDate: sub.startDate ? new Date(sub.startDate) : null,
                expireDate: sub.expireDate ? new Date(sub.expireDate) : null,
                actualExpireDate: sub.actualExpireDate ? new Date(sub.actualExpireDate) : null,
                notes: sub.notes?.trim() || null,
              })),
            }
          : undefined,
      },
      include: {
        subscriptions: {
          include: {
            software: true,
          },
        },
      },
    });

    return NextResponse.json(createdCompany, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json({ error: error.message || "Failed to create company" }, { status: 500 });
  }
}
