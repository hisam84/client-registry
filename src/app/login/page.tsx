"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Refresh the router to re-evaluate the middleware and redirect to home
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Incorrect password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Imperial IT
          </h2>
          <p className="mt-1 text-center text-xs font-medium italic text-brass-400">
            The complete IT solution
          </p>
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-slate-400">
            Please enter the site password to continue
          </p>
        </div>

        {/* Hidden inputs to prevent aggressive browser autofill in older browsers */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <input type="text" style={{ display: "none" }} aria-hidden="true" />
          <input type="password" style={{ display: "none" }} aria-hidden="true" />

          <div>
            <label htmlFor="site-password" className="sr-only">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="site-password"
                name="site-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className="appearance-none rounded-md relative block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-slate-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-brass-400 focus:border-brass-400 sm:text-sm"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs font-medium focus:outline-none px-1 py-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈 Hide" : "👁️ Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-rust-500/10 p-2 rounded border border-red-100 dark:border-rust-500/30">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-slate-950 bg-brass-500 hover:bg-brass-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brass-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? "Verifying..." : "Log in"}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link href="/change-password" className="font-medium text-brass-400 hover:text-brass-300">
              Forgot / Change Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
