import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCompanyTables } from "@/lib/ensureCompanyTables";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCompanyTables();

    const body = await req.json();
    const {
      softwareId,
      billingCycle,
      price,
      status,
      startDate,
      expireDate,
      actualExpireDate,
      notes,
    } = body;

    if (!softwareId) {
      return NextResponse.json({ error: "Please select a software product" }, { status: 400 });
    }

    const company = await (prisma as any).company.findUnique({
      where: { id: params.id },
    });

    if (!company || company.deletedAt) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const software = await (prisma as any).software.findUnique({
      where: { id: softwareId },
    });

    if (!software || software.deletedAt) {
      return NextResponse.json({ error: "Selected software product not found" }, { status: 404 });
    }

    const subscription = await (prisma as any).companySubscription.create({
      data: {
        companyId: params.id,
        softwareId: softwareId,
        billingCycle: billingCycle || "Yearly",
        price: price ? parseFloat(price) : software.defaultPrice,
        status: status || "Active",
        startDate: startDate ? new Date(startDate) : new Date(),
        expireDate: expireDate ? new Date(expireDate) : null,
        actualExpireDate: actualExpireDate ? new Date(actualExpireDate) : null,
        notes: notes?.trim() || null,
      },
      include: {
        software: true,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/companies/[id]/subscriptions error:", error);
    return NextResponse.json({ error: error.message || "Failed to create subscription" }, { status: 500 });
  }
}
