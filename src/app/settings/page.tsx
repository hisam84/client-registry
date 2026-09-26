"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SidebarLayout } from "@/components/SidebarLayout";
import {
  SubscriptionExpirySettings,
  DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS,
} from "@/lib/subscriptionSettings";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [monthlyDays, setMonthlyDays] = useState<number>(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.monthlyDays);
  const [halfYearlyDays, setHalfYearlyDays] = useState<number>(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.halfYearlyDays);
  const [yearlyDays, setYearlyDays] = useState<number>(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.yearlyDays);
  const [defaultDays, setDefaultDays] = useState<number>(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.defaultDays);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch("/api/subscription-settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setMonthlyDays(data.settings.monthlyDays);
          setHalfYearlyDays(data.settings.halfYearlyDays);
          setYearlyDays(data.settings.yearlyDays);
          setDefaultDays(data.settings.defaultDays ?? DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.defaultDays);
        }
      } catch (err: any) {
        setErrorMsg("সেটিংস লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleResetDefaults() {
    setMonthlyDays(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.monthlyDays);
    setHalfYearlyDays(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.halfYearlyDays);
    setYearlyDays(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.yearlyDays);
    setDefaultDays(DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS.defaultDays);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (monthlyDays < 0 || halfYearlyDays < 0 || yearlyDays < 0 || defaultDays < 0) {
      setErrorMsg("সবগুলো দিন অবশ্যই ০ বা তার বেশি সংখ্যা হতে হবে।");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/subscription-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyDays: Number(monthlyDays),
          halfYearlyDays: Number(halfYearlyDays),
          yearlyDays: Number(yearlyDays),
          defaultDays: Number(defaultDays),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      setSuccessMsg("সাবস্ক্রিপশন মেয়াদ উত্তীর্ণের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidebarLayout
      title="System Settings"
      subtitle="Configure subscription expiry thresholds and platform preferences"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Expiry Settings Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xl">
                ⏱️
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  সাবস্ক্রিপশন মেয়াদ উত্তীর্ণের সেটিংস (Subscription Expiry Thresholds)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  মাসিক, হাফ ইয়ারলি এবং ইয়ারলি সাইকেলের ক্ষেত্রে মেয়াদ শেষ হওয়ার কত দিন আগে &apos;Expiring Soon&apos; ওয়ার্নিং দেখাবে তা নির্ধারণ করুন
                </p>
              </div>
            </div>
            <Link
              href="/companies"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Company Ledger</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">লোড হচ্ছে...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3.5 text-xs rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  {successMsg}
                </div>
              )}

              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>💡</span>
                  <span>কিভাবে কাজ করে:</span>
                </p>
                <p className="leading-relaxed">
                  কোম্পানির সাবস্ক্রিপশন বিলিং সাইকেল (Billing Cycle) অনুযায়ী এখানে সেট করা দিনের মধ্যে চলে আসলে সিস্টেমে স্বয়ংক্রিয়ভাবে <b>&apos;Expiring Soon&apos;</b> হিসেবে চিহ্নিত হবে, ফিল্টারে দেখাবে এবং কাউন্টার আপডেট হবে।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      মাসিক
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Monthly</span>
                  </div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    কত দিন আগে দেখাবে?
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ডিফল্ট মান: ৭ দিন
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      required
                      value={monthlyDays}
                      onChange={(e) => setMonthlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-center font-bold font-mono text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">দিন</span>
                  </div>
                </div>

                {/* Half-Yearly */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      হাফ ইয়ারলি
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Half-Yearly</span>
                  </div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    কত দিন আগে দেখাবে?
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ডিফল্ট মান: ১৫ দিন
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      required
                      value={halfYearlyDays}
                      onChange={(e) => setHalfYearlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-center font-bold font-mono text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">দিন</span>
                  </div>
                </div>

                {/* Yearly */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      ইয়ারলি
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Yearly</span>
                  </div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    কত দিন আগে দেখাবে?
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ডিফল্ট মান: ৩০ দিন
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      required
                      value={yearlyDays}
                      onChange={(e) => setYearlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-center font-bold font-mono text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">দিন</span>
                  </div>
                </div>
              </div>

              {/* Fallback / Other */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    অন্যান্য / ডিফল্ট সাইকেল থ্রেশহোল্ড (Fallback Threshold)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    যদি কোনো সাবস্ক্রিপশনের নির্দিষ্ট সাইকেল না থাকে তবে এই দিন গণ্য হবে
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={defaultDays}
                    onChange={(e) => setDefaultDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 text-center font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs font-medium text-slate-500">দিন</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  ডিফল্ট রিসেট করুন
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পরিবর্তন সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Link to Mail Settings */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-lg">
              ✉️
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ইমেইল ও নোটিফিকেশন সেটিংস (Mail Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                টাস্ক অ্যাসাইনমেন্ট, রিমাইন্ডার ও ওটিপি মেইল কনফিগারেশন
              </p>
            </div>
          </div>
          <Link
            href="/mail-settings"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Open Mail Settings &rarr;
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
