"use client";
import React, { useState } from "react";
import { TaskItem, TASK_PRIORITY_COLOR, TASK_STATUS_COLOR } from "@/lib/types";
import { useUserSession } from "@/lib/userSession";
import { StatusNoteModal } from "./StatusNoteModal";
import { RescheduleModal } from "./RescheduleModal";

interface UpcomingTasksListProps {
  tasks: TaskItem[];
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onToggleComplete: (task: TaskItem) => void;
  onRefresh?: () => void;
}

export function UpcomingTasksList({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  onRefresh,
}: UpcomingTasksListProps) {
  const { currentUser } = useUserSession();
  const [noteModalTask, setNoteModalTask] = useState<TaskItem | null>(null);
  const [rescheduleModalTask, setRescheduleModalTask] = useState<TaskItem | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  async function handleClaimTask(task: TaskItem) {
    if (currentUser.id === "super-admin") {
      alert("Please select a specific employee from the header account switcher to claim tasks for an employee.");
      return;
    }
    setClaimingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: currentUser.id,
        }),
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to claim task:", err);
    } finally {
      setClaimingTaskId(null);
    }
  }

  function getRelativeTimeBadge(dueDateStr: string, status: string) {
    if (status === "Completed") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          Completed
        </span>
      );
    }

    const due = new Date(dueDateStr);
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffTime = dueDayStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const timeStr = due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 whitespace-nowrap">
          Overdue by {absDays}d ({due.toLocaleDateString([], { month: "short", day: "numeric" })})
        </span>
      );
    }

    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
          Due Today ({timeStr})
        </span>
      );
    }

    if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 whitespace-nowrap">
          Tomorrow ({timeStr})
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        In {diffDays} days ({due.toLocaleDateString([], { month: "short", day: "numeric" })})
      </span>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500">
        <p className="text-sm">No tasks found matching your criteria.</p>
        <p className="text-xs text-slate-400 mt-1">Click "+ Add Task" to create your first schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isCompleted = task.status === "Completed";
        const instName = task.institution?.instituteName || task.institutionName || "General Task";
        const due = new Date(task.dueDate);
        const isOverdue = !isCompleted && due.getTime() < Date.now();

        const assignedEmp = task.assignedTo;
        const assignerEmp = task.assignedBy;
        const isUnassigned = !task.assignedToId;
        const isAssignedToMe = task.assignedToId === currentUser.id;

        return (
          <div
            key={task.id}
            className={`group rounded-xl border p-3.5 sm:p-4 transition-all duration-200 bg-white dark:bg-slate-900 ${
              isCompleted
                ? "border-slate-200 dark:border-slate-800 opacity-75"
                : isOverdue
                ? "border-red-300 dark:border-red-900/50 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-brass-500/40 shadow-sm"
            }`}
          >
            {/* Top Container: Checkbox + Title/Pill on left, Action buttons on right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
              
              {/* Left Content Area */}
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Complete checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(task)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-600 hover:border-brass-500"
                  }`}
                  title={isCompleted ? "Mark as pending" : "Mark as completed"}
                >
                  {isCompleted && (
                    <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  {/* Title & Institution Pill */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`text-sm font-semibold break-words ${
                        isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Institution Name Pill */}
                    <span className="inline-flex items-center text-[11px] font-medium text-brass-700 dark:text-brass-400 bg-brass-500/10 px-2 py-0.5 rounded-md break-all">
                      {instName}
                    </span>
                  </div>

                  {/* Task details text */}
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}

                  {/* Visual Progress Bar */}
                  {(() => {
                    const prog = task.progress ?? (isCompleted ? 100 : 0);
                    return (
                      <div className="mt-2 flex items-center gap-2 max-w-xs sm:max-w-md">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300/30 dark:border-slate-700/50">
                          <div
                            className={`h-full transition-all duration-300 ${
                              prog === 100
                                ? "bg-emerald-500"
                                : prog >= 50
                                ? "bg-brass-500"
                                : prog > 0
                                ? "bg-sky-500"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                          {prog}%
                        </span>
                      </div>
                    );
                  })()}

                  {/* Completion Reason Box */}
                  {task.completionNote && (
                    <div className="mt-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 p-2.5 text-xs border border-amber-500/20 text-amber-900 dark:text-amber-300">
                      <span className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Reason / Outcome Note:</span>
                      </span>
                      <p className="mt-0.5 whitespace-pre-wrap">{task.completionNote}</p>
                    </div>
                  )}

                  {/* Employee Assignment Badges & Meta Row */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Employee Assignee Badge */}
                    {isUnassigned ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Unassigned</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap flex items-center gap-1 ${
                          isAssignedToMe
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                            : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Assigned: #{assignedEmp?.orderSerial || 0} {assignedEmp?.name || "Employee"}</span>
                      </span>
                    )}

                    {/* Assigner Info if available */}
                    {assignerEmp && assignerEmp.id !== task.assignedToId && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        By: {assignerEmp.name}
                      </span>
                    )}

                    {getRelativeTimeBadge(task.dueDate, task.status)}

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap ${
                        TASK_PRIORITY_COLOR[task.priority] || "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap ${
                        TASK_STATUS_COLOR[task.status] || "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                {/* Claim / Self Assign Task Button */}
                {(isUnassigned || (!isAssignedToMe && currentUser.id !== "super-admin")) && (
                  <button
                    onClick={() => handleClaimTask(task)}
                    disabled={claimingTaskId === task.id}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brass-500/20 text-brass-700 dark:text-brass-300 border border-brass-500/40 hover:bg-brass-500/30 transition-colors whitespace-nowrap flex items-center gap-1"
                    title="Self-assign this task to your account"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>{claimingTaskId === task.id ? "Assigning..." : "Assign to Me"}</span>
                  </button>
                )}

                {/* Reschedule Button */}
                <button
                  onClick={() => setRescheduleModalTask(task)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1 ${
                    isOverdue
                      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/25"
                      : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 hover:bg-sky-500/20"
                  }`}
                  title="Reschedule task to a future date or time"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{isOverdue ? "Reschedule Overdue" : "Reschedule"}</span>
                </button>

                {/* Reason Note Button */}
                <button
                  onClick={() => setNoteModalTask(task)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                  title="Add or update completion/failure reason"
                >
                  {task.completionNote ? "Edit Reason" : "+ Note / Reason"}
                </button>

                {/* Edit & Delete */}
                <button
                  onClick={() => onEdit(task)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
                >
                  Delete
                </button>
              </div>

            </div>
          </div>
        );
      })}

      {/* Quick Status & Reason Modal */}
      {noteModalTask && (
        <StatusNoteModal
          task={noteModalTask}
          onClose={() => setNoteModalTask(null)}
          onSaved={() => {
            if (onRefresh) onRefresh();
            setNoteModalTask(null);
          }}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleModalTask && (
        <RescheduleModal
          task={rescheduleModalTask}
          onClose={() => setRescheduleModalTask(null)}
          onSaved={() => {
            if (onRefresh) onRefresh();
            setRescheduleModalTask(null);
          }}
        />
      )}
    </div>
  );
}
