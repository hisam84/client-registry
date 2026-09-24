import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const company = await (prisma as any).company.findUnique({
      where: { id: params.id },
      include: {
        subscriptions: {
          where: { deletedAt: null },
          include: {
            software: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!company || company.deletedAt) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error: any) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch company details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
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
    } = body;

    const existing = await (prisma as any).company.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const updated = await (prisma as any).company.update({
      where: { id: params.id },
      data: {
        companyName: companyName !== undefined ? companyName.trim() : existing.companyName,
        companyNameBangla: companyNameBangla !== undefined ? (companyNameBangla ? companyNameBangla.trim() : null) : existing.companyNameBangla,
        contactPerson: contactPerson !== undefined ? (contactPerson ? contactPerson.trim() : null) : existing.contactPerson,
        designation: designation !== undefined ? (designation ? designation.trim() : null) : existing.designation,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
        email: email !== undefined ? (email ? email.trim() : null) : existing.email,
        address: address !== undefined ? (address ? address.trim() : null) : existing.address,
        district: district !== undefined ? (district ? district.trim() : null) : existing.district,
        subDistrict: subDistrict !== undefined ? (subDistrict ? subDistrict.trim() : null) : existing.subDistrict,
        website: website !== undefined ? (website ? website.trim() : null) : existing.website,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
      include: {
        subscriptions: {
          where: { deletedAt: null },
          include: {
            software: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/companies/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await (prisma as any).company.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await (prisma as any).company.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/companies/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete company" }, { status: 500 });
  }
}
