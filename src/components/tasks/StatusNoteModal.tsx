"use client";
import React, { useState } from "react";
import { TaskItem, TaskStatus, TASK_STATUS_OPTIONS } from "@/lib/types";
import { Button, Modal } from "@/components/ui";

interface StatusNoteModalProps {
  task: TaskItem;
  targetStatus?: TaskStatus;
  onClose: () => void;
  onSaved: () => void;
}

export function StatusNoteModal({
  task,
  targetStatus,
  onClose,
  onSaved,
}: StatusNoteModalProps) {
  const [status, setStatus] = useState<TaskStatus>(targetStatus || task.status);
  const [note, setNote] = useState<string>(task.completionNote || "");
  const [progress, setProgress] = useState<number>(task.progress ?? (task.status === "Completed" ? 100 : 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          completionNote: note.trim() || null,
          progress,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task status");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Task Status & Progress Update" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title
          </label>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {task.title}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              const s = e.target.value as TaskStatus;
              setStatus(s);
              if (s === "Completed") setProgress(100);
              else if (s === "Pending" && progress === 100) setProgress(0);
            }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-medium"
          >
            {TASK_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Progress % */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Completion Progress (% সম্পন্ন)</span>
            <span className="font-mono text-brass-600 dark:text-brass-400 font-bold">{progress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (val === 100) setStatus("Completed");
                else if (val > 0 && status === "Pending") setStatus("In Progress");
              }}
              className="flex-1 accent-brass-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                setProgress(val);
                if (val === 100) setStatus("Completed");
                else if (val > 0 && status === "Pending") setStatus("In Progress");
              }}
              className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-center text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {[0, 25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProgress(p);
                  if (p === 100) setStatus("Completed");
                  else if (p > 0 && status === "Pending") setStatus("In Progress");
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  progress === p
                    ? "bg-brass-500 text-slate-950 font-bold border-brass-500"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason / Outcome Remarks (কমপ্লিট বা কমপ্লিট না হওয়ার কারণ)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write the reason why this task was completed, delayed, or cancelled..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Status & Reason"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
