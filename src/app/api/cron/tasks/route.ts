import { NextRequest, NextResponse } from "next/server";
import { checkAndSendTaskAlerts } from "@/lib/taskNotificationService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkAndSendTaskAlerts();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...result });
  } catch (error: any) {
    console.error("Cron task notification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process task notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
