"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarLayout } from "@/components/SidebarLayout";

export default function ChangePasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("OTP sent to your email!");
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Password changed successfully! Redirecting...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout
      title="Change Password"
      subtitle="Request OTP and reset your account password"
    >
      <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800">
          <div>
            <h2 className="mt-2 text-center text-2xl font-bold text-[#0D47A1] dark:text-[#E3F2FD]">
              Reset Account Password
            </h2>
            <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
              {step === 1 ? "Enter your registered email to receive an OTP verification code" : "Enter the OTP sent to your email and your new password"}
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-100 dark:border-red-900/40">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-600 text-xs text-center font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/40">
              {success}
            </div>
          )}

          {step === 1 ? (
            <form className="mt-6 space-y-5" onSubmit={handleRequestOtp}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2.5 border border-[#90CAF9] dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3] sm:text-sm font-medium"
                  placeholder="Your Registered Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-[#2196F3] hover:bg-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2196F3] disabled:opacity-50 transition-all shadow-md shadow-blue-500/25 active:scale-95"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleChangePassword} autoComplete="off">
              <input type="text" style={{ display: "none" }} aria-hidden="true" />
              <input type="password" style={{ display: "none" }} aria-hidden="true" />

              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">OTP Code</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2.5 border border-[#90CAF9] dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3] sm:text-sm font-mono tracking-widest text-center text-lg font-bold"
                    placeholder="6-digit OTP Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <div className="relative flex items-center">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="appearance-none rounded-lg relative block w-full px-3 py-2.5 pr-10 border border-[#90CAF9] dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3] sm:text-sm"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs font-medium focus:outline-none px-1 py-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-[#2196F3] hover:bg-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2196F3] disabled:opacity-50 transition-all shadow-md shadow-blue-500/25 active:scale-95"
                >
                  {loading ? "Changing Password..." : "Change Password"}
                </button>
              </div>
              <div className="text-center text-sm">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#2196F3] hover:underline">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
