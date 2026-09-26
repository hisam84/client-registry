import { prisma } from "@/lib/prisma";

export interface SubscriptionExpirySettings {
  monthlyDays: number;     // e.g. 7 days for monthly
  halfYearlyDays: number;  // e.g. 15 days for half-yearly
  yearlyDays: number;      // e.g. 30 days for yearly
  defaultDays: number;     // e.g. 30 days fallback for custom/other
}

export const DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS: SubscriptionExpirySettings = {
  monthlyDays: 7,
  halfYearlyDays: 15,
  yearlyDays: 30,
  defaultDays: 30,
};

export const SETTINGS_KEY = "subscription_expiry_settings";

/**
 * Loads subscription expiry thresholds from persistent SiteSettings.
 */
export async function getSubscriptionExpirySettings(): Promise<SubscriptionExpirySettings> {
  try {
    const record = await (prisma as any).siteSettings.findUnique({
      where: { id: SETTINGS_KEY },
    });

    if (record?.adminEmail) {
      const parsed = JSON.parse(record.adminEmail);
      return {
        monthlyDays: typeof parsed.monthlyDays === "number" && parsed.monthlyDays >= 0 ? parsed.monthlyDays : DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.monthlyDays,
        halfYearlyDays: typeof parsed.halfYearlyDays === "number" && parsed.halfYearlyDays >= 0 ? parsed.halfYearlyDays : DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.halfYearlyDays,
        yearlyDays: typeof parsed.yearlyDays === "number" && parsed.yearlyDays >= 0 ? parsed.yearlyDays : DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.yearlyDays,
        defaultDays: typeof parsed.defaultDays === "number" && parsed.defaultDays >= 0 ? parsed.defaultDays : DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.defaultDays,
      };
    }
  } catch (err: any) {
    console.warn("Could not load subscription expiry settings:", err?.message);
  }

  return { ...DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS };
}

/**
 * Saves subscription expiry thresholds to SiteSettings.
 */
export async function saveSubscriptionExpirySettings(
  settings: Partial<SubscriptionExpirySettings>
): Promise<SubscriptionExpirySettings> {
  const current = await getSubscriptionExpirySettings();
  const updated: SubscriptionExpirySettings = {
    monthlyDays: typeof settings.monthlyDays === "number" && settings.monthlyDays >= 0 ? Math.round(settings.monthlyDays) : current.monthlyDays,
    halfYearlyDays: typeof settings.halfYearlyDays === "number" && settings.halfYearlyDays >= 0 ? Math.round(settings.halfYearlyDays) : current.halfYearlyDays,
    yearlyDays: typeof settings.yearlyDays === "number" && settings.yearlyDays >= 0 ? Math.round(settings.yearlyDays) : current.yearlyDays,
    defaultDays: typeof settings.defaultDays === "number" && settings.defaultDays >= 0 ? Math.round(settings.defaultDays) : current.defaultDays,
  };

  try {
    const payload = JSON.stringify(updated);
    await (prisma as any).siteSettings.upsert({
      where: { id: SETTINGS_KEY },
      create: {
        id: SETTINGS_KEY,
        password: "expiry_config",
        adminEmail: payload,
      },
      update: {
        adminEmail: payload,
      },
    });
  } catch (err: any) {
    console.error("Could not save subscription expiry settings:", err?.message);
    throw err;
  }

  return updated;
}

/**
 * Returns threshold in days based on billingCycle.
 */
export function getExpiryThresholdForCycle(
  billingCycle: string | undefined | null,
  settings: SubscriptionExpirySettings
): number {
  if (!billingCycle) return settings.defaultDays;
  const cycle = billingCycle.trim().toLowerCase();

  if (cycle === "monthly" || cycle === "month") {
    return settings.monthlyDays;
  }
  if (cycle === "half-yearly" || cycle === "halfyearly" || cycle === "half yearly" || cycle === "biannual") {
    return settings.halfYearlyDays;
  }
  if (cycle === "yearly" || cycle === "annual") {
    return settings.yearlyDays;
  }
  return settings.defaultDays;
}

/**
 * Computes effective status for a company subscription:
 * "Active" | "Expiring Soon" | "Expired" | "Deactivated" | "Cancelled"
 */
export function computeEffectiveSubscriptionStatus(
  sub: {
    status?: string | null;
    billingCycle?: string | null;
    expireDate?: string | Date | null;
  },
  settings: SubscriptionExpirySettings,
  now = new Date()
): string {
  const currentStatus = sub.status || "Active";
  if (currentStatus === "Deactivated" || currentStatus === "Cancelled") {
    return currentStatus;
  }

  if (!sub.expireDate) {
    return currentStatus;
  }

  const exp = new Date(sub.expireDate);
  if (isNaN(exp.getTime())) {
    return currentStatus;
  }

  // Calculate day difference
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Expired";
  }

  const threshold = getExpiryThresholdForCycle(sub.billingCycle, settings);
  if (diffDays <= threshold) {
    return "Expiring Soon";
  }

  return "Active";
}
