"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setStoredUser } from "@/lib/userSession";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username or Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user) {
          setStoredUser(data.user);
        }
        router.push("/tasks");
        router.refresh();
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800">
        <div className="text-center flex flex-col items-center">
          <img src="/pad.png" alt="Imperial IT Logo" className="w-16 h-16 object-contain mb-3 drop-shadow" />
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Imperial IT
          </h2>
          <p className="mt-1 text-center text-xs font-medium italic text-brass-400">
            The complete IT solution
          </p>
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-slate-400">
            Enter your username and password to log in
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Username or Email
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 dark:border-slate-700 placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brass-400 focus:border-brass-400 text-sm font-medium"
                placeholder="e.g. admin or employee email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Super Admin Username: <code className="text-brass-500 font-bold">admin</code>
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-slate-700 placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brass-400 focus:border-brass-400 text-sm"
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
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-rust-500/10 p-2.5 rounded-lg border border-red-200 dark:border-rust-500/30">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-slate-950 bg-brass-500 hover:bg-brass-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brass-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md"
            >
              {loading ? "Authenticating..." : "Log in"}
            </button>
          </div>

          <div className="text-center text-xs pt-2">
            <Link href="/change-password" className="font-semibold text-brass-400 hover:text-brass-300 transition-colors">
              Forgot / Change Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
