"use client";
import React from "react";

interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  tasksToday: number;
  upcomingTasks: number;
  next7Days: { label: string; count: number; date: string }[];
  priorities: {
    High: number;
    Medium: number;
    Low: number;
  };
}

interface TaskChartsProps {
  metrics: DashboardMetrics;
}

export function TaskCharts({ metrics }: TaskChartsProps) {
  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    next7Days,
  } = metrics;

  // Donut chart calculations
  const totalForDonut = Math.max(totalTasks, 1);
  const pCompleted = (completedTasks / totalForDonut) * 100;
  const pPending = (pendingTasks / totalForDonut) * 100;
  const pInProgress = (inProgressTasks / totalForDonut) * 100;
  const pOverdue = (overdueTasks / totalForDonut) * 100;

  // SVG Donut slice calculation helpers
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const completedStroke = (pCompleted / 100) * circumference;
  const inProgressStroke = (pInProgress / 100) * circumference;
  const pendingStroke = (pPending / 100) * circumference;
  const overdueStroke = (pOverdue / 100) * circumference;

  let offset = 0;
  const strokeCompletedOffset = offset;
  offset += completedStroke;

  const strokeInProgressOffset = offset;
  offset += inProgressStroke;

  const strokePendingOffset = offset;
  offset += pendingStroke;

  const strokeOverdueOffset = offset;

  // Workload Bar Chart metrics
  const totalNext7Count = next7Days.reduce((acc, d) => acc + d.count, 0);
  const maxDayCount = Math.max(...next7Days.map((d) => d.count), 4);

  // Find peak day
  const peakDay = [...next7Days].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Status Distribution Donut Chart */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brass-500"></span>
              <span>Task Status Overview</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time task distribution
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-800 text-brass-700 dark:text-brass-400 border border-slate-200 dark:border-slate-700">
            Total: {totalTasks}
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-around gap-4 py-4">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Base background ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800/60"
                strokeWidth="12"
                fill="none"
              />
              {/* Completed Segment (Emerald) */}
              {completedStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${completedStroke} ${circumference}`}
                  strokeDashoffset={-strokeCompletedOffset}
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}
              {/* In Progress Segment (Sky) */}
              {inProgressStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#38bdf8"
                  strokeWidth="12"
                  strokeDasharray={`${inProgressStroke} ${circumference}`}
                  strokeDashoffset={-strokeInProgressOffset}
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}
              {/* Pending Segment (Amber) */}
              {pendingStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${pendingStroke} ${circumference}`}
                  strokeDashoffset={-strokePendingOffset}
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}
              {/* Overdue Segment (Red) */}
              {overdueStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray={`${overdueStroke} ${circumference}`}
                  strokeDashoffset={-strokeOverdueOffset}
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}
            </svg>

            {/* Inner Center Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {totalTasks}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Tasks
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-600 dark:text-slate-300">Completed:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono ml-auto">{completedTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
              <span className="text-slate-600 dark:text-slate-300">In Progress:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono ml-auto">{inProgressTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-600 dark:text-slate-300">Pending:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono ml-auto">{pendingTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span className="text-slate-600 dark:text-slate-300">Overdue:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono ml-auto">{overdueTasks}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Modern 7-Day Workload Chart */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md lg:col-span-2 flex flex-col justify-between">
        {/* Header with Title & Peak Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Upcoming 7 Days Workload (আগামী ৭ দিনের ওয়ার্কলোড)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Scheduled tasks across the next 7 calendar days
            </p>
          </div>

          <div className="flex items-center gap-2">
            {peakDay && peakDay.count > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <span>🔥 Peak:</span>
                <span className="font-bold">{peakDay.label.split(",")[0]} ({peakDay.count})</span>
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-brass-500/15 text-brass-700 dark:text-brass-300 border border-brass-500/30">
              7-Day Total: {totalNext7Count}
            </span>
          </div>
        </div>

        {/* Visual Modern Bar Chart Grid */}
        <div className="relative pt-6 pb-2">
          {/* Subtle Horizontal Guide Grid Lines */}
          <div className="absolute inset-x-0 top-8 bottom-10 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10">
            <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full"></div>
            <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full"></div>
            <div className="border-b border-dashed border-slate-400 dark:border-slate-500 w-full"></div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 sm:gap-4 items-end h-44 relative z-10">
            {next7Days.map((day, idx) => {
              const heightPercent = Math.min((day.count / maxDayCount) * 100, 100);
              const isToday = idx === 0;
              const hasTasks = day.count > 0;
              const dayParts = day.label.split(",");
              const dayName = isToday ? "Today" : dayParts[0]; // e.g. "Thu"
              const dayDateNum = dayParts[1]?.trim() || ""; // e.g. "Jul 30"

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Hover Tooltip Popup */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 z-30 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg shadow-xl border border-slate-700">
                    {day.label}: {day.count} {day.count === 1 ? "task" : "tasks"}
                  </div>

                  {/* Top Badge Count */}
                  <div className="mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                    {hasTasks ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shadow-xs border ${
                          isToday
                            ? "bg-brass-500 text-slate-950 border-amber-400 shadow-amber-500/30"
                            : "bg-sky-500 text-white border-sky-400 shadow-sky-500/20"
                        }`}
                      >
                        {day.count}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-600">
                        0
                      </span>
                    )}
                  </div>

                  {/* Sleek Rounded Glass Track */}
                  <div className="w-full bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl h-36 flex items-end p-1.5 border border-slate-200/60 dark:border-slate-800/60 shadow-inner overflow-hidden">
                    <div
                      style={{
                        height: hasTasks ? `${Math.max(heightPercent, 14)}%` : "8%",
                      }}
                      className={`w-full rounded-xl transition-all duration-700 ease-out ${
                        isToday && hasTasks
                          ? "bg-gradient-to-t from-brass-600 via-amber-500 to-amber-400 shadow-lg shadow-amber-500/30"
                          : isToday && !hasTasks
                          ? "bg-gradient-to-t from-brass-500/40 to-amber-400/40"
                          : hasTasks
                          ? "bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400 shadow-md shadow-sky-500/25 group-hover:from-sky-500 group-hover:to-cyan-300"
                          : "bg-slate-300/40 dark:bg-slate-700/40 group-hover:bg-slate-400/50"
                      }`}
                    />
                  </div>

                  {/* Bottom Day & Date Label */}
                  <div className="mt-2.5 text-center">
                    <span
                      className={`block text-[11px] font-bold truncate ${
                        isToday
                          ? "text-brass-600 dark:text-brass-400"
                          : hasTasks
                          ? "text-slate-800 dark:text-slate-200 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {dayName}
                    </span>
                    {dayDateNum && (
                      <span className="block text-[9px] font-medium text-slate-400 dark:text-slate-500 truncate">
                        {dayDateNum}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
