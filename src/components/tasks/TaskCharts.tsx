"use client";

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
    cancelledTasks,
    next7Days,
    priorities,
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

  // Calculate strokes
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

  // Bar Chart max calculation
  const maxDayCount = Math.max(...next7Days.map((d) => d.count), 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Status Distribution Donut Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>Task Status Overview</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Total: {totalTasks}</span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Base background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="14"
                fill="none"
              />
              {/* Completed Segment (Green) */}
              {completedStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${completedStroke} ${circumference}`}
                  strokeDashoffset={-strokeCompletedOffset}
                  fill="none"
                  className="transition-all duration-500"
                />
              )}
              {/* In Progress Segment (Sky Blue) */}
              {inProgressStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#38bdf8"
                  strokeWidth="14"
                  strokeDasharray={`${inProgressStroke} ${circumference}`}
                  strokeDashoffset={-strokeInProgressOffset}
                  fill="none"
                  className="transition-all duration-500"
                />
              )}
              {/* Pending Segment (Amber/Yellow) */}
              {pendingStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeDasharray={`${pendingStroke} ${circumference}`}
                  strokeDashoffset={-strokePendingOffset}
                  fill="none"
                  className="transition-all duration-500"
                />
              )}
              {/* Overdue Segment (Red) */}
              {overdueStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#ef4444"
                  strokeWidth="14"
                  strokeDasharray={`${overdueStroke} ${circumference}`}
                  strokeDashoffset={-strokeOverdueOffset}
                  fill="none"
                  className="transition-all duration-500"
                />
              )}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {totalTasks}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tasks
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Completed:</span>
              <strong className="text-slate-900 dark:text-slate-100">{completedTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">In Progress:</span>
              <strong className="text-slate-900 dark:text-slate-100">{inProgressTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Pending:</span>
              <strong className="text-slate-900 dark:text-slate-100">{pendingTasks}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Overdue:</span>
              <strong className="text-slate-900 dark:text-slate-100">{overdueTasks}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Upcoming 7-Day Workload Bar Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Upcoming 7 Days Workload (আগামী ৭ দিনের টাস্ক)</span>
            </h3>
            <p className="text-xs text-slate-400">Scheduled task count by date</p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 pb-2">
          {next7Days.map((day, idx) => {
            const heightPercent = Math.min((day.count / maxDayCount) * 100, 100);
            const isToday = idx === 0;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-1 group-hover:scale-110 transition-transform">
                  {day.count}
                </span>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-32 flex items-end p-1">
                  <div
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    className={`w-full rounded-md transition-all duration-500 ${
                      isToday
                        ? "bg-gradient-to-t from-brass-600 to-amber-500 shadow-md"
                        : "bg-slate-400/30 dark:bg-slate-700 group-hover:bg-brass-500/80"
                    }`}
                  />
                </div>

                <div className="mt-2 text-center">
                  <span
                    className={`block text-[10px] font-medium truncate max-w-[55px] ${
                      isToday
                        ? "text-brass-600 dark:text-brass-400 font-bold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {isToday ? "Today" : day.label.split(",")[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
