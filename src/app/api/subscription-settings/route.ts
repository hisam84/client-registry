import { NextResponse } from "next/server";
import {
  getSubscriptionExpirySettings,
  saveSubscriptionExpirySettings,
  DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS,
} from "@/lib/subscriptionSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSubscriptionExpirySettings();
    return NextResponse.json({
      success: true,
      settings,
      defaults: DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS,
    });
  } catch (error: any) {
    console.error("GET /api/subscription-settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load subscription settings",
        settings: DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { monthlyDays, halfYearlyDays, yearlyDays, defaultDays } = body;

    const parsedMonthly = Number(monthlyDays);
    const parsedHalfYearly = Number(halfYearlyDays);
    const parsedYearly = Number(yearlyDays);
    const parsedDefault = defaultDays !== undefined ? Number(defaultDays) : undefined;

    if (
      isNaN(parsedMonthly) ||
      parsedMonthly < 0 ||
      isNaN(parsedHalfYearly) ||
      parsedHalfYearly < 0 ||
      isNaN(parsedYearly) ||
      parsedYearly < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "সবগুলো দিন অবশ্যই ধনাত্মক সংখ্যা (০ বা তার বেশি) হতে হবে।",
        },
        { status: 400 }
      );
    }

    const updated = await saveSubscriptionExpirySettings({
      monthlyDays: parsedMonthly,
      halfYearlyDays: parsedHalfYearly,
      yearlyDays: parsedYearly,
      ...(parsedDefault !== undefined && !isNaN(parsedDefault) ? { defaultDays: parsedDefault } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription expiry settings updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/subscription-settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update subscription settings",
      },
      { status: 500 }
    );
  }
}
