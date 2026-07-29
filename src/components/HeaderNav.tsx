"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Employee } from "@/lib/types";
import { SUPER_ADMIN_USER, useUserSession } from "@/lib/userSession";

interface HeaderNavProps {
  onAddTaskClick?: () => void;
  title?: string;
  subtitle?: string;
  totalCountText?: string;
}

export function HeaderNav({ onAddTaskClick, title, subtitle, totalCountText }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useUserSession();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setEmployees(data);
        }
      } catch (err) {
        console.error("Failed to load employees for switcher:", err);
      }
    }
    fetchEmployees();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isInstitutions = pathname === "/";
  const isTargeted = pathname.startsWith("/targeted-clients");
  const isTasks = pathname.startsWith("/tasks");
  const isEmployees = pathname.startsWith("/employees");

  return (
    <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 sm:flex-row sm:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400">
            Imperial IT
          </span>
          <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
            The complete IT solution
          </span>
        </div>
        {title && <h1 className="font-display text-3xl text-slate-900 dark:text-slate-50">{title}</h1>}
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        {totalCountText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{totalCountText}</p>}
      </div>

      <div className="flex flex-col gap-3 items-end">
        {/* Navigation Tabs & Header Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-sm items-center">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isInstitutions
                ? "bg-brass-500/15 text-brass-600 dark:text-brass-400 border border-brass-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V5" />
            </svg>
            <span>Institutions</span>
          </Link>
          <Link
            href="/targeted-clients"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isTargeted
                ? "bg-brass-500/15 text-brass-600 dark:text-brass-400 border border-brass-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Targeted Clients</span>
          </Link>
          <Link
            href="/tasks"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isTasks
                ? "bg-brass-500/15 text-brass-600 dark:text-brass-400 border border-brass-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Tasks & Dashboard</span>
          </Link>
          <Link
            href="/employees"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isEmployees
                ? "bg-brass-500/15 text-brass-600 dark:text-brass-400 border border-brass-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Employees & Admin</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/change-password"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Password
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Account Switcher & Add Task Button */}
        <div className="flex items-center gap-3">
          {/* Active User Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-slate-400 font-medium">Active Account:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const val = e.target.value;
                if (val === SUPER_ADMIN_USER.id) {
                  setCurrentUser(SUPER_ADMIN_USER);
                } else {
                  const emp = employees.find((x) => x.id === val);
                  if (emp) setCurrentUser(emp);
                }
              }}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={SUPER_ADMIN_USER.id} className="dark:bg-slate-900">
                Super Admin ({SUPER_ADMIN_USER.name})
              </option>

              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="dark:bg-slate-900">
                  #{emp.orderSerial} {emp.name} ({emp.designation || emp.role})
                </option>
              ))}
            </select>
          </div>

          {onAddTaskClick && (
            <button
              onClick={onAddTaskClick}
              className="px-4 py-2 bg-gradient-to-r from-brass-600 to-amber-600 hover:from-brass-500 hover:to-amber-500 text-white font-medium text-xs sm:text-sm rounded-lg shadow hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Task</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
