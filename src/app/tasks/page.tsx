"use client";
import { useEffect, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskCharts } from "@/components/tasks/TaskCharts";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { UpcomingTasksList } from "@/components/tasks/UpcomingTasksList";
import { TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { Button, Input } from "@/components/ui";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [upcomingOnly, setUpcomingOnly] = useState<boolean>(false);

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    cancelledTasks: 0,
    overdueTasks: 0,
    tasksToday: 0,
    upcomingTasks: 0,
    next7Days: [],
    priorities: { High: 0, Medium: 0, Low: 0 },
  });

  // Modal controls
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  async function loadDashboardMetrics() {
    try {
      const res = await fetch(`/api/tasks/dashboard?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data && !data.error) {
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load task dashboard metrics:", err);
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
      if (upcomingOnly) params.set("upcoming", "true");
      params.set("t", Date.now().toString());

      const res = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTasks, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter, priorityFilter, upcomingOnly]);

  function handleRefresh() {
    loadDashboardMetrics();
    loadTasks();
  }

  async function handleToggleComplete(task: TaskItem) {
    const newStatus: TaskStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      handleRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleDeleteTask(task: TaskItem) {
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      handleRefresh();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  return (
    <SidebarLayout
      title="Tasks Dashboard & Schedule"
      subtitle="Manage upcoming schedules, institution follow-ups, and daily task priorities"
      totalCountText={`${metrics.upcomingTasks} upcoming • ${metrics.tasksToday} due today`}
      onAddTaskClick={() => {
        setEditingTask(null);
        setShowTaskModal(true);
      }}
    >
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Upcoming Tasks</span>
            <span className="text-amber-500 font-bold">Upcoming</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {metrics.upcomingTasks}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Due Today</span>
            <span className="text-sky-500 font-bold">Today</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {metrics.tasksToday}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overdue Tasks</span>
            <span className="text-red-500 font-bold">Action Needed</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {metrics.overdueTasks}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Completed</span>
            <span className="text-emerald-500 font-bold">Done</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.completedTasks}
          </div>
        </div>
      </div>

      {/* Interactive Charts Dashboard */}
      <TaskCharts metrics={metrics} />

      {/* Task Filters & Control Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search tasks by title, details or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Quick Upcoming Filter Button */}
            <button
              onClick={() => setUpcomingOnly(!upcomingOnly)}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                upcomingOnly
                  ? "bg-brass-500/20 text-brass-700 dark:text-brass-400 border-brass-500/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Upcoming Only ({metrics.upcomingTasks})
            </button>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setUpcomingOnly(false);
                setStatusFilter(e.target.value);
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {(search || statusFilter !== "all" || priorityFilter !== "all" || upcomingOnly) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setUpcomingOnly(false);
                }}
                className="text-xs text-brass-600 dark:text-brass-400 underline hover:opacity-80"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task List Component */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading tasks...</div>
      ) : (
        <UpcomingTasksList
          tasks={tasks}
          onEdit={(task) => {
            setEditingTask(task);
            setShowTaskModal(true);
          }}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          onRefresh={handleRefresh}
        />
      )}

      {/* Task Creation & Edit Modal */}
      {showTaskModal && (
        <TaskFormModal
          initialTask={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSaved={handleRefresh}
        />
      )}
    </SidebarLayout>
  );
}
