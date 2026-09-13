"use client";
import React, { useState } from "react";
import { TaskItem } from "@/lib/types";
import { Button, Modal } from "@/components/ui";

interface TaskCompletionModalProps {
  task: TaskItem;
  onClose: () => void;
  onCompleted: () => void;
}

export function TaskCompletionModal({
  task,
  onClose,
  onCompleted,
}: TaskCompletionModalProps) {
  const [note, setNote] = useState<string>(task.completionNote || "");
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(false);
  const defaultRecipient =
    task.assignedBy?.email || "imperialitbd2011@gmail.com";
  const [customRecipient, setCustomRecipient] = useState<string>(defaultRecipient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const instName = task.institution?.instituteName || task.institutionName || "General Task";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          progress: 100,
          completionNote: note.trim() || null,
          sendCompletionEmail: sendEmailNotification,
          notifyEmail: sendEmailNotification ? customRecipient.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete task");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("task-changed"));
      }

      onCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while completing task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Complete Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Minimal Task Details */}
        <div className="pb-1">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {task.title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-brass-700 dark:text-brass-400">
              🏛️ {instName}
            </span>
            {task.assignedTo && (
              <span>• #{task.assignedTo.orderSerial} {task.assignedTo.name}</span>
            )}
          </div>
        </div>

        {/* Remarks (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any remarks..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Optional Email Checkbox */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Send email notification (Optional)
            </span>
          </label>

          {sendEmailNotification && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60">
              <input
                type="email"
                required
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                placeholder="Recipient email address"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : sendEmailNotification
              ? "Complete & Send Email"
              : "Complete Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
