"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  totalCountText?: string;
  onAddTaskClick?: () => void;
  headerActions?: ReactNode;
}

export function SidebarLayout({
  children,
  title,
  subtitle,
  totalCountText,
  onAddTaskClick,
  headerActions,
}: SidebarLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Load approaching task notifications
  async function loadNotifications() {
    try {
      const res = await fetch("/api/tasks?upcoming=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        const now = new Date();
        const urgent = data.filter((t: any) => {
          if (t.status === "Completed" || t.status === "Cancelled") return false;
          const due = new Date(t.dueDate);
          const diffMs = due.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          return diffHours <= 24;
        });
        setUrgentTasks(urgent);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleQuickComplete(taskId: string) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark completed:", err);
    }
  }

  const navItems = [
    {
      label: "Main Dashboard",
      href: "/dashboard",
      iconSvg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
        </svg>
      ),
    },
    {
      label: "Institutions Ledger",
      href: "/",
      iconSvg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V5" />
        </svg>
      ),
    },
    {
      label: "Targeted Clients",
      href: "/targeted-clients",
      iconSvg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: "Tasks & Schedule",
      href: "/tasks",
      iconSvg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Change Password",
      href: "/change-password",
      iconSvg: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
  ];

  const urgentCount = urgentTasks.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* MOBILE TOP BAR (md:hidden) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400">
              Imperial IT
            </span>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
              {title || "Client Registry"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              title="Task Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {urgentCount}
                </span>
              )}
            </button>
          </div>

          {onAddTaskClick && (
            <button
              onClick={onAddTaskClick}
              className="px-3 py-1.5 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm border border-brass-600/30 flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>+ Task</span>
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL RESPONSIVE NOTIFICATION POPOVER DRAWER (Mobile Fixed & Desktop Absolute) */}
      {showNotifPopover && (
        <div
          ref={notifRef}
          className="fixed left-3 right-3 sm:left-auto sm:right-6 top-14 sm:top-16 z-50 w-auto sm:w-80 max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Urgent Task Alerts</span>
              {urgentCount > 0 && (
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {urgentCount}
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowNotifPopover(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          {urgentCount === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No urgent tasks due within 24 hours.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {urgentTasks.map((t) => {
                const due = new Date(t.dueDate);
                const now = new Date();
                const diffMs = due.getTime() - now.getTime();
                const isOverdue = diffMs < 0;
                const instName = t.institution?.instituteName || t.institutionName || "General Task";

                return (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-brass-600 dark:text-brass-400 block truncate mt-0.5">
                        {instName}
                      </span>
                      <span
                        className={`text-[10px] font-medium block mt-1 ${
                          isOverdue
                            ? "text-red-500 font-bold"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isOverdue ? "Overdue" : "Due soon"}:{" "}
                        {due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickComplete(t.id)}
                      className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded hover:bg-emerald-500/20 transition-colors shrink-0"
                      title="Mark task completed"
                    >
                      Complete
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <Link
              href="/tasks"
              onClick={() => setShowNotifPopover(false)}
              className="text-[11px] font-semibold text-brass-600 dark:text-brass-400 hover:underline"
            >
              Go to Tasks & Schedule →
            </Link>
          </div>
        </div>
      )}

      {/* MOBILE DRAWER OVERLAY & BACKDROP WITH SLIDE ANIMATION */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-all duration-300 ${mobileMenuOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`relative flex w-full max-w-xs flex-col bg-white dark:bg-slate-900 p-5 shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800 justify-between transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400">
                  Imperial IT
                </span>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                  The complete IT solution
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {onAddTaskClick && (
              <div className="mb-5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onAddTaskClick();
                  }}
                  className="w-full py-2.5 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs rounded-lg shadow hover:shadow-md transition-all flex items-center justify-center gap-2 border border-brass-600/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Add Task</span>
                </button>
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-brass-500/15 text-brass-700 dark:text-brass-400 border border-brass-500/30 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="shrink-0">{item.iconSvg}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 flex items-center justify-between">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP FIXED MINIMAL SIDEBAR (md:flex) */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 p-4 justify-between backdrop-blur-md">
        <div>
          {/* Logo & Brand Header */}
          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400 block">
              Imperial IT
            </span>
            <h2 className="font-display text-lg text-slate-900 dark:text-slate-50 font-semibold leading-tight mt-0.5">
              Client Registry
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
              The complete IT solution
            </p>
          </div>

          {/* Action Button: + Add Task with High Contrast in Light & Dark Mode */}
          {onAddTaskClick && (
            <div className="mb-5">
              <button
                onClick={onAddTaskClick}
                className="w-full py-2.5 px-3 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-brass-600/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Add Task</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-brass-500/15 text-brass-700 dark:text-brass-400 border border-brass-500/30 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="shrink-0">{item.iconSvg}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Minimal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1">
          {/* Header section inside main content with Notification Bell top right */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              {title && (
                <h1 className="font-display text-2xl sm:text-3xl text-slate-900 dark:text-slate-50 font-bold">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
              {totalCountText && (
                <p className="mt-1 text-xs text-brass-600 dark:text-brass-400 font-medium">
                  {totalCountText}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
              {/* Notification Bell in Main Page Header */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-xs"
                  title="Task Deadline Alerts"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {urgentCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                      {urgentCount}
                    </span>
                  )}
                </button>
              </div>

              {headerActions}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
