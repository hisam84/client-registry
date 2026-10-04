import { NextResponse } from "next/server";
import { checkGoogleDriveConfig } from "@/lib/googleDrive";

export async function GET() {
  try {
    const status = checkGoogleDriveConfig();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      {
        isConfigured: false,
        message: error?.message || "Failed to check Google Drive configuration",
      },
      { status: 500 }
    );
  }
}
