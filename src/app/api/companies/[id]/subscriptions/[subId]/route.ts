import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string; subId: string } }) {
  try {
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

    const existing = await (prisma as any).companySubscription.findUnique({
      where: { id: params.subId },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updated = await (prisma as any).companySubscription.update({
      where: { id: params.subId },
      data: {
        softwareId: softwareId || existing.softwareId,
        billingCycle: billingCycle || existing.billingCycle,
        price: price !== undefined ? (price ? parseFloat(price) : null) : existing.price,
        status: status || existing.status,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        expireDate: expireDate !== undefined ? (expireDate ? new Date(expireDate) : null) : existing.expireDate,
        actualExpireDate: actualExpireDate !== undefined ? (actualExpireDate ? new Date(actualExpireDate) : null) : existing.actualExpireDate,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
      include: {
        software: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/companies/[id]/subscriptions/[subId] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; subId: string } }) {
  try {
    const existing = await (prisma as any).companySubscription.findUnique({
      where: { id: params.subId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    await (prisma as any).companySubscription.update({
      where: { id: params.subId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/companies/[id]/subscriptions/[subId] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete subscription" }, { status: 500 });
  }
}
