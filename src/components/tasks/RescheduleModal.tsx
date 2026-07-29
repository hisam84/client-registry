"use client";
import React, { useState } from "react";
import { TaskItem } from "@/lib/types";
import { Button, Modal } from "@/components/ui";

interface RescheduleModalProps {
  task: TaskItem;
  onClose: () => void;
  onSaved: () => void;
}

function formatToLocalDateTimeInput(dateStr?: string | Date | null): string {
  const d = dateStr ? new Date(dateStr) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function RescheduleModal({ task, onClose, onSaved }: RescheduleModalProps) {
  const [dueDate, setDueDate] = useState<string>(
    formatToLocalDateTimeInput(task.dueDate)
  );
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addDays(days: number) {
    const current = dueDate ? new Date(dueDate) : new Date();
    const target = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
    setDueDate(formatToLocalDateTimeInput(target));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dueDate) {
      setError("Please select a valid date and time.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Append reschedule reason to existing completionNote if provided
      let updatedNote = task.completionNote || "";
      if (reason.trim()) {
        const timeBadge = new Date().toLocaleDateString([], { month: "short", day: "numeric" });
        const entry = `[Rescheduled on ${timeBadge}]: ${reason.trim()}`;
        updatedNote = updatedNote ? `${updatedNote}\n${entry}` : entry;
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(dueDate).toISOString(),
          completionNote: updatedNote || null,
          status: task.status === "Completed" ? "Pending" : task.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reschedule task");
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
    <Modal title="Reschedule Task (তারিখ/সময় পরিবর্তন)" onClose={onClose}>
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

        {/* Date & Time Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            New Scheduled Date & Time (নতুন তারিখ ও সময়)*
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-mono"
          />

          {/* Quick Reschedule Shortcut Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-500 mr-1">Quick Add:</span>
            <button
              type="button"
              onClick={() => addDays(1)}
              className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brass-500/20 hover:text-brass-700 dark:hover:text-brass-300 transition-colors"
            >
              +1 Day (আগামীকাল)
            </button>
            <button
              type="button"
              onClick={() => addDays(2)}
              className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brass-500/20 hover:text-brass-700 dark:hover:text-brass-300 transition-colors"
            >
              +2 Days
            </button>
            <button
              type="button"
              onClick={() => addDays(3)}
              className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brass-500/20 hover:text-brass-700 dark:hover:text-brass-300 transition-colors"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => addDays(7)}
              className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brass-500/20 hover:text-brass-700 dark:hover:text-brass-300 transition-colors"
            >
              +1 Week (পরবর্তী সপ্তাহ)
            </button>
          </div>
        </div>

        {/* Reschedule Reason / Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason for Rescheduling (পুনর্নির্ধারণ বা রেফার করার কারণ - ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Client requested call back next week, official holiday, postponed..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-bengali"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-brass-500 text-slate-950 font-bold">
            {saving ? "Rescheduling..." : "Save New Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
