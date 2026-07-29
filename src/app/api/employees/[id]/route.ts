import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/employees/[id] - Update employee details or orderSerial
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, password, role, orderSerial, designation, phone, avatarColor } = body;

    const existing = await (prisma as any).employee.findUnique({
      where: { id }
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (password !== undefined) updateData.password = password.trim();
    if (role !== undefined) updateData.role = role;
    if (orderSerial !== undefined) updateData.orderSerial = Number(orderSerial);
    if (designation !== undefined) updateData.designation = designation ? designation.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (avatarColor !== undefined) updateData.avatarColor = avatarColor;

    const updated = await (prisma as any).employee.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Soft delete employee
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updated = await (prisma as any).employee.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
