import { NextRequest, NextResponse } from "next/server";
import { uploadImagesToGoogleDrive, checkGoogleDriveConfig } from "@/lib/googleDrive";

export async function POST(req: NextRequest) {
  try {
    const configStatus = checkGoogleDriveConfig();
    if (!configStatus.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: configStatus.message,
          needConfig: true,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { folderName, files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "কোনো ইমেজ ফাইল পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const result = await uploadImagesToGoogleDrive({
      folderName: folderName || `Images - ${new Date().toLocaleDateString("en-CA")}`,
      files,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Google Drive Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Google Drive এ আপলোড করার সময় একটি সমস্যা দেখা দিয়েছে।",
      },
      { status: 500 }
    );
  }
}
