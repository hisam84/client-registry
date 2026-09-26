"use client";

import { useEffect, useState } from "react";
import {
  SubscriptionExpirySettings,
  DEFAULT_SUBSCRIPTION_EXPIRY_SETTINGS,
} from "@/lib/subscriptionSettings";

interface SubscriptionSettingsModalProps {
  onClose: () => void;
  onSaved: (settings: SubscriptionExpirySettings) => void;
}

export function SubscriptionSettingsModal({
  onClose,
  onSaved,
}: SubscriptionSettingsModalProps) {
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
      setErrorMsg("সবগুলো সংখ্যা ০ বা তার বেশি হতে হবে।");
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

      setSuccessMsg("সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      onSaved(data.settings);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-lg">
              ⏱️
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Expiring Soon সেটিংস (Expiry Thresholds)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                কত দিন আগে সাবস্ক্রিপশনকে &apos;Expiring Soon&apos; হিসেবে দেখানো হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">লোড হচ্ছে...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                {successMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              💡 <b>নিয়মাবলী:</b> নির্ধারিত দিনের মধ্যে সাবস্ক্রিপশনের মেয়াদ শেষ হতে চললে কোম্পানির তালিকায় স্বয়ংক্রিয়ভাবে স্ট্যাটাস <b>&apos;Expiring Soon&apos;</b> হিসেবে চিহ্নিত ও ফিল্টার হবে।
            </div>

            <div className="space-y-3.5">
              {/* Monthly */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    মাসিক (Monthly Cycle)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    মেয়াদ শেষ হওয়ার কত দিন আগে ওয়ার্নিং দেখাবে
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    required
                    value={monthlyDays}
                    onChange={(e) => setMonthlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 text-center font-bold font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs font-medium text-slate-500">দিন</span>
                </div>
              </div>

              {/* Half-Yearly */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    হাফ ইয়ারলি (Half-Yearly Cycle)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    মেয়াদ শেষ হওয়ার কত দিন আগে ওয়ার্নিং দেখাবে
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    required
                    value={halfYearlyDays}
                    onChange={(e) => setHalfYearlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 text-center font-bold font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs font-medium text-slate-500">দিন</span>
                </div>
              </div>

              {/* Yearly */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    ইয়ারলি (Yearly Cycle)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    মেয়াদ শেষ হওয়ার কত দিন আগে ওয়ার্নিং দেখাবে
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    required
                    value={yearlyDays}
                    onChange={(e) => setYearlyDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 text-center font-bold font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs font-medium text-slate-500">দিন</span>
                </div>
              </div>

              {/* Default/Other */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    অন্যান্য / ডিফল্ট (Other / Fallback)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    কোনো নির্দিষ্ট সাইকেল না থাকলে প্রযোজ্য
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
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                ডিফল্ট রিসেট
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
