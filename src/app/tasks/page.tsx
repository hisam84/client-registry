"use client";
import { useEffect, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskCharts } from "@/components/tasks/TaskCharts";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { UpcomingTasksList } from "@/components/tasks/UpcomingTasksList";
import { Employee, TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { Button, Input } from "@/components/ui";
import { useUserSession } from "@/lib/userSession";

type TaskCategoryTab = "all" | "self" | "assigned_by_others" | "assigned_to_others" | "unassigned";

export default function TasksPage() {
  const { currentUser } = useUserSession();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Employees for Super Admin Filter
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("all");

  // Category Tab
  const [activeTab, setActiveTab] = useState<TaskCategoryTab>("all");

  // Search & Filters
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
    unassignedTasks: 0,
    overdueTasks: 0,
    tasksToday: 0,
    upcomingTasks: 0,
    next7Days: [],
    priorities: { High: 0, Medium: 0, Low: 0 },
  });

  // Modal controls
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setEmployees(data);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    }
    loadEmployees();
  }, []);

  async function loadDashboardMetrics() {
    try {
      const params = new URLSearchParams();
      params.set("t", Date.now().toString());
      if (selectedEmployeeFilter !== "all") {
        params.set("employeeId", selectedEmployeeFilter);
      } else if (activeTab !== "all" && currentUser.id) {
        params.set("taskCategory", activeTab);
        params.set("currentUserId", currentUser.id);
      }

      const res = await fetch(`/api/tasks/dashboard?${params.toString()}`, { cache: "no-store" });
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

      if (selectedEmployeeFilter !== "all") {
        params.set("employeeId", selectedEmployeeFilter);
      } else if (activeTab !== "all" && currentUser.id) {
        params.set("taskCategory", activeTab);
        params.set("currentUserId", currentUser.id);
      }

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
  }, [selectedEmployeeFilter, activeTab, currentUser.id]);

  useEffect(() => {
    const t = setTimeout(loadTasks, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter, priorityFilter, upcomingOnly, selectedEmployeeFilter, activeTab, currentUser.id]);

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
      title="Tasks & Schedule Management"
      subtitle={`Account View: ${currentUser.name} (${currentUser.role}) • Total ${metrics.totalTasks} Tasks`}
      totalCountText={`${metrics.upcomingTasks} upcoming • ${metrics.tasksToday} due today`}
      onAddTaskClick={() => {
        setEditingTask(null);
        setShowTaskModal(true);
      }}
    >
      {/* Super Admin Employee Filter Bar */}
      <div className="mb-6 p-4 rounded-xl border border-brass-500/20 bg-gradient-to-r from-brass-500/5 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brass-700 dark:text-brass-400 flex items-center gap-1.5">
            <span>🛡️ Super Admin & Employee Task Filtering</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select an employee to view their specific task assignments, or view all.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">Filter by Employee:</span>
          <select
            value={selectedEmployeeFilter}
            onChange={(e) => {
              setSelectedEmployeeFilter(e.target.value);
              if (e.target.value !== "all") setActiveTab("all");
            }}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          >
            <option value="all">🌐 All Employees (সকল ইমপ্লয়ী)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                #{emp.orderSerial} • {emp.name} ({emp.designation || emp.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

      {/* Interactive Task Category Tabs */}
      {selectedEmployeeFilter === "all" && (
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-brass-500 text-slate-950 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>🌐</span>
            <span>সব টাস্ক (All Tasks)</span>
          </button>

          <button
            onClick={() => setActiveTab("self")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "self"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            }`}
          >
            <span>👤</span>
            <span>আমার নিজের টাস্ক (Self-Assigned)</span>
          </button>

          <button
            onClick={() => setActiveTab("assigned_by_others")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "assigned_by_others"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            }`}
          >
            <span>📩</span>
            <span>অন্যের দেওয়া টাস্ক (Assigned by Others)</span>
          </button>

          <button
            onClick={() => setActiveTab("assigned_to_others")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "assigned_to_others"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50 hover:bg-sky-50 dark:hover:bg-sky-950/40"
            }`}
          >
            <span>📤</span>
            <span>আমার অন্যকে দেওয়া টাস্ক</span>
          </button>

          <button
            onClick={() => setActiveTab("unassigned")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "unassigned"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            <span>❓</span>
            <span>আন-অ্যাসাইন্ড টাস্ক ({metrics.unassignedTasks})</span>
          </button>
        </div>
      )}

      {/* Charts Visualization */}
      <TaskCharts metrics={metrics} />

      {/* Task Filters & Search Control Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search tasks by title, details, institution, or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
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

            <select
              value={statusFilter}
              onChange={(e) => {
                setUpcomingOnly(false);
                setStatusFilter(e.target.value);
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {(search || statusFilter !== "all" || priorityFilter !== "all" || upcomingOnly || selectedEmployeeFilter !== "all" || activeTab !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setUpcomingOnly(false);
                  setSelectedEmployeeFilter("all");
                  setActiveTab("all");
                }}
                className="text-xs text-brass-600 dark:text-brass-400 underline hover:opacity-80 font-semibold"
              >
                Reset All Filters
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
