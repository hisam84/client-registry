"use client";
import React, { useState } from "react";
import { TaskItem, TASK_PRIORITY_COLOR, TASK_STATUS_COLOR } from "@/lib/types";
import { StatusNoteModal } from "./StatusNoteModal";

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
  const [noteModalTask, setNoteModalTask] = useState<TaskItem | null>(null);

  function getRelativeTimeBadge(dueDateStr: string, status: string) {
    if (status === "Completed") {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
          Overdue by {absDays}d ({due.toLocaleDateString([], { month: "short", day: "numeric" })})
        </span>
      );
    }

    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          Due Today ({timeStr})
        </span>
      );
    }

    if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          Tomorrow ({timeStr})
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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

        return (
          <div
            key={task.id}
            className={`group rounded-xl border p-4 transition-all duration-200 bg-white dark:bg-slate-900 ${
              isCompleted
                ? "border-slate-200 dark:border-slate-800 opacity-75"
                : "border-slate-200 dark:border-slate-800 hover:border-brass-500/40 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Institution Name Pill */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brass-700 dark:text-brass-400 bg-brass-500/10 px-2 py-0.5 rounded-md">
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
                      <div className="mt-2 flex items-center gap-2 max-w-md">
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
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 min-w-[32px] text-right">
                          {prog}%
                        </span>
                      </div>
                    );
                  })()}

                  {/* Completion / Non-completion Outcome Reason Box */}
                  {task.completionNote && (
                    <div className="mt-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 p-2.5 text-xs border border-amber-500/20 text-amber-900 dark:text-amber-300">
                      <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        📝 Reason / Outcome Note:
                      </span>
                      <p className="mt-0.5 whitespace-pre-wrap">{task.completionNote}</p>
                    </div>
                  )}

                  {/* Meta Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {getRelativeTimeBadge(task.dueDate, task.status)}

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        TASK_PRIORITY_COLOR[task.priority] || "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        TASK_STATUS_COLOR[task.status] || "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {task.status}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brass-500/15 text-brass-700 dark:text-brass-300 border border-brass-500/30">
                      {task.progress ?? (isCompleted ? 100 : 0)}% Progress
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setNoteModalTask(task)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                  title="Add or update completion/failure reason"
                >
                  {task.completionNote ? "Edit Reason" : "+ Note / Reason"}
                </button>
                <button
                  onClick={() => onEdit(task)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}

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
    </div>
  );
}
