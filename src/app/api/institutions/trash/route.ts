import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/institutions/trash
export async function GET() {
  try {
    // Auto-purge items older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await (prisma as any).institution.deleteMany({
      where: {
        deletedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    const trashed: any[] = await (prisma as any).institution.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    });

    const items = trashed.map((item: any) => {
      const deletedTime = item.deletedAt ? new Date(item.deletedAt).getTime() : Date.now();
      const expireTime = deletedTime + 30 * 24 * 60 * 60 * 1000;
      const daysRemaining = Math.max(0, Math.ceil((expireTime - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        ...item,
        daysRemaining,
      };
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/institutions/trash error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch trash items" }, { status: 500 });
  }
}

// DELETE /api/institutions/trash (Empty Trash)
export async function DELETE() {
  try {
    const result = await (prisma as any).institution.deleteMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
    });
    return NextResponse.json({ count: result.count, message: "Trash emptied successfully." });
  } catch (error: any) {
    console.error("DELETE /api/institutions/trash error:", error);
    return NextResponse.json({ error: error.message || "Failed to empty trash" }, { status: 500 });
  }
}
