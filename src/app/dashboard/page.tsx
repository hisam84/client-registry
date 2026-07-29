"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui";
import { useUserSession } from "@/lib/userSession";
import { ROLE_OPTIONS } from "@/lib/types";

interface DashboardData {
  institutions: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    actualExpired: number;
    noExpiry: number;
    categories: Record<string, number>;
    types: Record<string, number>;
    expiringSoonList: Array<{
      id: string;
      instituteName: string;
      category: string;
      instituteType: string;
      expireDate: string;
      district: string | null;
    }>;
  };
  targetedClients: {
    active: number;
    highPriority: number;
    archived: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    tasksToday: number;
    upcomingCount: number;
    upcomingList: Array<{
      id: string;
      title: string;
      description: string | null;
      dueDate: string;
      status: string;
      priority: string;
      institutionName: string | null;
      institution?: { id: string; instituteName: string } | null;
    }>;
  };
}

export default function DashboardPage() {
  const { currentUser } = useUserSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/overview");
      const result = await res.json();
      if (result && !result.error) {
        setData(result);
      }
    } catch (err) {
      console.error("Failed to load dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function handleToggleTaskComplete(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadOverview();
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  }

  const inst = data?.institutions;
  const targeted = data?.targetedClients;
  const tsk = data?.tasks;

  const totalInst = Math.max(inst?.total || 1, 1);
  const pActive = ((inst?.active || 0) / totalInst) * 100;
  const pExpiringSoon = ((inst?.expiringSoon || 0) / totalInst) * 100;
  const pExpired = ((inst?.expired || 0) / totalInst) * 100;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const activeStroke = (pActive / 100) * circumference;
  const expiringSoonStroke = (pExpiringSoon / 100) * circumference;
  const expiredStroke = (pExpired / 100) * circumference;

  let offset = 0;
  const strokeActiveOffset = offset;
  offset += activeStroke;

  const strokeExpiringOffset = offset;
  offset += expiringSoonStroke;

  const strokeExpiredOffset = offset;

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Link href="/">
        <Button variant="outline" className="text-xs">
          Institutions Ledger
        </Button>
      </Link>
      <Link href="/targeted-clients">
        <Button variant="outline" className="text-xs">
          Targeted Clients
        </Button>
      </Link>
      <Link href="/tasks">
        <Button variant="outline" className="text-xs">
          Tasks & Schedule
        </Button>
      </Link>
    </div>
  );

  return (
    <SidebarLayout
      title="Main Executive Dashboard"
      subtitle="Comprehensive overview of client registry, renewals, pipelines, and workloads"
      totalCountText={inst ? `${inst.total} total institutions • ${tsk?.upcomingCount || 0} upcoming tasks` : ""}
      onAddTaskClick={() => setShowTaskModal(true)}
      headerActions={headerActions}
    >
      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading system metrics & analytics...</div>
      ) : !data ? (
        <div className="py-20 text-center text-red-500">Failed to load dashboard metrics. Please refresh.</div>
      ) : (
        <div className="space-y-8">
          {/* WELCOME BANNER FOR ACTIVE USER */}
          <div className="rounded-2xl border border-brass-500/30 dark:border-brass-500/30 bg-gradient-to-r from-brass-500/10 via-amber-500/10 to-brass-500/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-6 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 z-10">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brass-500/40 dark:border-brass-400 shadow-md shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner border-2 border-brass-500/40 dark:border-brass-400 shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor || "#0b7677" }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-brass-700 dark:text-brass-400">
                    Welcome Back 👋
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brass-500/20 text-brass-800 dark:text-brass-300 border border-brass-500/30">
                    {ROLE_OPTIONS.find((r) => r.value === currentUser.role)?.label || currentUser.role}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Welcome, {currentUser.name}!
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
                  Welcome to the Imperial IT Client Management Dashboard. {currentUser.designation ? `(${currentUser.designation})` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 shrink-0">
              <Link href="/profile">
                <button className="px-4 py-2.5 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5 border border-brass-600/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </Link>
            </div>

            {/* Background Glow Accent */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brass-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* URGENT TASK DEADLINE ALERT BANNER */}
          {((tsk?.overdue || 0) > 0 || (tsk?.tasksToday || 0) > 0) && (
            <div className="rounded-xl border border-amber-500/40 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Task Deadline Alert
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {tsk?.overdue ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold mr-2">
                        {tsk.overdue} Overdue task(s) require attention!
                      </span>
                    ) : null}
                    {tsk?.tasksToday ? (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {tsk.tasksToday} Task(s) due today!
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <Link href="/tasks">
                <button className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow shrink-0">
                  View Tasks →
                </button>
              </Link>
            </div>
          )}

          {/* 1. TOP KPI STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Institutions */}
            <Link href="/" className="group block">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-brass-500/40 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-brass-500/10 text-brass-700 dark:text-brass-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total Institutions
                      </span>
                    </div>
                    <span className="text-[11px] text-brass-600 dark:text-brass-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                      View →
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight my-1">
                    {inst?.total || 0}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                    {inst?.active || 0} Active
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {((inst?.active || 0) / Math.max(inst?.total || 1, 1) * 100).toFixed(0)}% Active
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 2: Expiring Soon Alert */}
            <Link href="/?status=expiring_soon" className="group block">
              <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-5 shadow-sm hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Expiring Soon (30d)
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                      Action →
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight my-1">
                    {inst?.expiringSoon || 0}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 font-bold text-[10px]" title="Expired by Expire Date">
                    {inst?.expired || 0} Expired
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-bold text-[10px]" title="Expired by Actual Expire Date">
                    {inst?.actualExpired || 0} Actual
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 3: Targeted Clients Pipeline */}
            <Link href="/targeted-clients" className="group block">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-brass-500/40 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Targeted Clients
                      </span>
                    </div>
                    <span className="text-[11px] text-brass-600 dark:text-brass-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                      Pipeline →
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight my-1">
                    {targeted?.active || 0}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-rust-500/10 text-rust-700 dark:text-rust-400 border border-rust-500/20 font-bold text-[11px]">
                    {targeted?.highPriority || 0} High Priority
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 4: Scheduled Tasks */}
            <Link href="/tasks" className="group block">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-brass-500/40 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Scheduled Tasks
                      </span>
                    </div>
                    <span className="text-[11px] text-brass-600 dark:text-brass-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                      Tasks →
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight my-1">
                    {tsk?.upcomingCount || 0}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-bold text-[11px]">
                    {tsk?.tasksToday || 0} Due Today
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* 2. VISUAL CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Expiry Status Donut */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Expiry Status Breakdown
                </h3>
                <span className="text-xs text-slate-400">Institutions</span>
              </div>

              <div className="flex items-center justify-center gap-6 py-3">
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="14"
                      fill="none"
                    />
                    {activeStroke > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#10b981"
                        strokeWidth="14"
                        strokeDasharray={`${activeStroke} ${circumference}`}
                        strokeDashoffset={-strokeActiveOffset}
                        fill="none"
                      />
                    )}
                    {expiringSoonStroke > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#f59e0b"
                        strokeWidth="14"
                        strokeDasharray={`${expiringSoonStroke} ${circumference}`}
                        strokeDashoffset={-strokeExpiringOffset}
                        fill="none"
                      />
                    )}
                    {expiredStroke > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#ef4444"
                        strokeWidth="14"
                        strokeDasharray={`${expiredStroke} ${circumference}`}
                        strokeDashoffset={-strokeExpiredOffset}
                        fill="none"
                      />
                    )}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {inst?.total}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Active:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{inst?.active}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Expiring Soon:</span>
                    <strong className="text-amber-600 dark:text-amber-400">{inst?.expiringSoon}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Expired:</span>
                    <strong className="text-red-600 dark:text-red-400">{inst?.expired}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span className="text-slate-600 dark:text-slate-300">Actual Expired:</span>
                    <strong className="text-rose-600 dark:text-rose-400">{inst?.actualExpired}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-slate-600 dark:text-slate-300">No Expiry:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{inst?.noExpiry}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Category Ratio (Website vs Software) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Category Ratio
                </h3>
                <span className="text-xs text-slate-400">Website vs Software</span>
              </div>

              <div className="space-y-4 pt-2">
                {(() => {
                  const categories = inst?.categories || {};
                  const catSum = Object.values(categories).reduce((sum, count) => sum + count, 0) || 1;

                  return Object.entries(categories).map(([category, count]) => {
                    const percentage = Math.round((count / catSum) * 100);
                    const lowerCat = category.toLowerCase();
                    const isWebsite = lowerCat.includes("website");
                    const isSoftware = lowerCat.includes("software");

                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            {category}
                          </span>
                          <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%` }}
                            className={`h-full transition-all duration-500 rounded-full ${
                              isWebsite && !isSoftware
                                ? "bg-gradient-to-r from-purple-600 to-indigo-500"
                                : isSoftware && !isWebsite
                                ? "bg-gradient-to-r from-sky-500 to-blue-600"
                                : isWebsite && isSoftware
                                ? "bg-gradient-to-r from-brass-600 to-amber-500"
                                : "bg-gradient-to-r from-slate-400 to-slate-600"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Chart 3: Institution Type Breakdown */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Institution Types
                </h3>
                <span className="text-xs text-slate-400">Distribution</span>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {Object.entries(inst?.types || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                        {type}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min((count / (inst?.total || 1)) * 100, 100)}%` }}
                            className="bg-brass-500 h-full rounded-full"
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-6 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 3. LIVE ALERT FEEDS & ACTION LISTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feed 1: Expiring Soon Alert List */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>Expiring Soon Institutions</span>
                  <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Next 30 Days
                  </span>
                </h3>
                <Link
                  href="/?status=expiring_soon"
                  className="text-xs text-brass-600 dark:text-brass-400 hover:underline font-medium"
                >
                  View All ({inst?.expiringSoon}) →
                </Link>
              </div>

              {inst?.expiringSoonList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No institutions expiring within the next 30 days.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inst?.expiringSoonList.map((item) => {
                    const expDate = new Date(item.expireDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {item.instituteName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.category} • {item.instituteType} {item.district ? `(${item.district})` : ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 block">
                            {expDate}
                          </span>
                          <span className="text-[10px] text-slate-400">Expire Date</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feed 2: Scheduled Tasks & Follow-ups Feed */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>Scheduled Tasks & Follow-ups</span>
                  <span className="text-xs font-normal text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    Active Feed
                  </span>
                </h3>
                <Link
                  href="/tasks"
                  className="text-xs text-brass-600 dark:text-brass-400 hover:underline font-medium"
                >
                  Manage Tasks →
                </Link>
              </div>

              {tsk?.upcomingList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming tasks scheduled. Click "+ Add Task" to create one.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tsk?.upcomingList.map((task) => {
                    const due = new Date(task.dueDate);
                    const formattedDue = due.toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const instName = task.institution?.instituteName || task.institutionName || "General Task";

                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleTaskComplete(task.id, task.status)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-brass-500 text-brass-500"
                            title="Mark complete"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-brass-600 dark:text-brass-400 truncate mt-0.5">
                              {instName}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 block">
                            {formattedDue}
                          </span>
                          <span className="text-[10px] text-slate-400">{task.priority} Priority</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskFormModal
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            loadOverview();
          }}
        />
      )}
    </SidebarLayout>
  );
}
