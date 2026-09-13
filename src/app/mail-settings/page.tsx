"use client";

import { useEffect, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useUserSession } from "@/lib/userSession";
import { MailServiceSettings, DEFAULT_MAIL_SETTINGS } from "@/lib/mailTypes";

export default function MailSettingsPage() {
  const { isSuperAdmin, currentUser } = useUserSession();
  const [settings, setSettings] = useState<MailServiceSettings>(DEFAULT_MAIL_SETTINGS);
  const [providerInfo, setProviderInfo] = useState<{
    name: string;
    senderEmail: string;
    restApiConfigured: boolean;
    smtpRelayConfigured: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/mail-settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setProviderInfo(data.provider || null);
        if (data.provider?.senderEmail && !testEmail) {
          setTestEmail(data.provider.senderEmail);
        }
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to load mail settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(key: keyof MailServiceSettings) {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    await persistSettings(updated);
  }

  async function persistSettings(newSettings: MailServiceSettings) {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/mail-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/mail-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testEmail.trim() }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Test email sent successfully!" : "Failed to send test email"),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error while sending test email",
      });
    } finally {
      setSendingTest(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <SidebarLayout
        title="Mail Settings"
        subtitle="Super Admin Access Only"
      >
        <div className="p-8 text-center max-w-md mx-auto">
          <div className="p-6 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-base mb-1">Access Restricted</h3>
            <p className="text-xs">Only the Super Administrator can configure application mail services.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const services = [
    {
      key: "taskAssignment" as keyof MailServiceSettings,
      name: "Task Assignment Notification",
      badge: "Rule 1",
      description: "Automatically dispatches an email to an employee whenever a task is created or reassigned to them.",
      target: "Assigned Employee",
    },
    {
      key: "passwordReset" as keyof MailServiceSettings,
      name: "Password Reset OTP Verification",
      badge: "Rule 2",
      description: "Sends a secure 6-digit one-time verification code to an employee's registered email to reset their password.",
      target: "Employee's Registered Email",
    },
    {
      key: "taskOverdue" as keyof MailServiceSettings,
      name: "Task Overdue Alert",
      badge: "Rule 3",
      description: "Triggered strictly once per task when the deadline has passed. Dispatches an urgent alert to the assigned employee.",
      target: "Assigned Employee (Strictly Once)",
    },
    {
      key: "taskDueSoon" as keyof MailServiceSettings,
      name: "2-Hour Deadline Reminder",
      badge: "Rule 4",
      description: "Sends an alert strictly once to the assigned employee exactly 2 hours before the scheduled deadline.",
      target: "Assigned Employee (Strictly Once)",
    },
    {
      key: "taskCompletion" as keyof MailServiceSettings,
      name: "Task Completion Confirmation",
      badge: "Rule 5",
      description: "Enables an optional confirmation email to be sent exclusively to the task assigner when a task is completed.",
      target: "Task Assigner (Optional)",
    },
  ];

  return (
    <SidebarLayout
      title="Mail Service Settings"
      subtitle="Select which mail services to enable across your registry platform"
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Status Alerts */}
        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Mail service settings updated successfully! Changes take effect immediately.</span>
            </div>
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{saveError}</span>
          </div>
        )}

        {/* Master Mail Switch Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Master Email Switch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Turn all outbound system emails ON or OFF with a single global toggle.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle("masterEnabled")}
              disabled={saving}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                settings.masterEnabled ? "bg-[#2196F3]" : "bg-slate-300 dark:bg-slate-700"
              }`}
              title={settings.masterEnabled ? "Disable All Emails" : "Enable All Emails"}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  settings.masterEnabled ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active Provider Info Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] dark:text-[#90CAF9]">
                  Active Mail Delivery Provider
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Operational
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{providerInfo?.name || "Brevo (Sendinblue)"}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Verified Sender: <strong className="font-mono text-slate-800 dark:text-slate-200">{providerInfo?.senderEmail || "imperialitbd2011@gmail.com"}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                REST API v3: {providerInfo?.restApiConfigured ? "Ready" : "Standby"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                SMTP Relay: {providerInfo?.smtpRelayConfigured ? "Ready" : "Standby"}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Distinct Mail Service Toggles */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Service Toggles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable or disable individual notification channels based on your workflow requirements.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              5 Authorized Services
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {services.map((svc) => {
              const isEnabled = settings[svc.key] && settings.masterEnabled;

              return (
                <div key={svc.key} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {svc.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                        {svc.badge}
                      </span>
                      {isEnabled ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {svc.description}
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Target:</span>
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {svc.target}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(svc.key)}
                    disabled={saving || !settings.masterEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                      settings[svc.key] && settings.masterEnabled
                        ? "bg-[#2196F3]"
                        : "bg-slate-200 dark:bg-slate-700 opacity-60"
                    }`}
                    title={settings[svc.key] ? "Disable Service" : "Enable Service"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                        settings[svc.key] && settings.masterEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Email Delivery Section */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Send Test Email via Brevo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Verify that your Brevo API key and verified sender credentials are delivering emails accurately.
          </p>

          <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter recipient email address..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              type="submit"
              disabled={sendingTest}
              className="px-4 py-2 bg-[#2196F3] hover:bg-[#1E88E5] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              {sendingTest ? "Sending Test..." : "Send Test Email"}
            </button>
          </form>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}
            >
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
