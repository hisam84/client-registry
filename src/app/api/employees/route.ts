import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/employees - List all active employees sorted by orderSerial
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";

    const employees = await (prisma as any).employee.findMany({
      where: { deletedAt: null },
      orderBy: [
        { orderSerial: "asc" },
        { name: "asc" }
      ],
      include: includeStats ? {
        assignedTasks: {
          where: { deletedAt: null },
          select: { status: true }
        }
      } : undefined
    });

    const result = employees.map((emp: any) => {
      let taskStats = undefined;
      if (includeStats && emp.assignedTasks) {
        const tasks = emp.assignedTasks;
        taskStats = {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === "Completed").length,
          pending: tasks.filter((t: any) => t.status === "Pending").length,
          inProgress: tasks.filter((t: any) => t.status === "In Progress").length,
        };
      }
      const { assignedTasks, password: _pw, ...empData } = emp;
      return {
        ...empData,
        taskStats
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, orderSerial, designation, phone, avatarColor, avatarUrl } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await (prisma as any).employee.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: "An employee with this email already exists" },
        { status: 400 }
      );
    }

    // Calculate max orderSerial if not provided
    let serial = Number(orderSerial);
    if (isNaN(serial) || serial <= 0) {
      const maxEmp = await (prisma as any).employee.findFirst({
        orderBy: { orderSerial: "desc" }
      });
      serial = (maxEmp?.orderSerial || 0) + 1;
    }

    const employee = await (prisma as any).employee.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password ? password.trim() : "124578",
        role: role || "EMPLOYEE",
        orderSerial: serial,
        designation: designation ? designation.trim() : null,
        phone: phone ? phone.trim() : null,
        avatarColor: avatarColor || "#0b7677",
        avatarUrl: avatarUrl || null,
      }
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
