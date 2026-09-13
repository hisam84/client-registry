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
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Task Summary Banner */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Task Details
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              Marking as Completed (100%)
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {task.title}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-2 pt-1">
            <span className="font-semibold text-brass-700 dark:text-brass-400">
              🏛️ {instName}
            </span>
            {task.assignedTo && (
              <span>• Assigned: #{task.assignedTo.orderSerial} {task.assignedTo.name}</span>
            )}
          </div>
        </div>

        {/* Completion Remarks / Outcome Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Outcome / Completion Remarks (Optional)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write outcome, completion remarks, or notes regarding this completed task..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
          />
        </div>

        {/* Email Notification Option */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-3.5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[#2196F3] focus:ring-[#2196F3] h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                📧 Send Task Completion Email Notification
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Automatically dispatches an official completion confirmation email via Brevo.
              </span>
            </div>
          </label>

          {sendEmailNotification && (
            <div className="pt-2 border-t border-blue-200/70 dark:border-blue-900/40 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Send Notification Email To:
              </label>
              <input
                type="email"
                required
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Sender will be: <strong className="font-mono text-slate-700 dark:text-slate-300">Imperial IT &lt;imperialitbd2011@gmail.com&gt;</strong>
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <span>Saving & Sending Email...</span>
            ) : (
              <span>✓ Complete Task{sendEmailNotification ? " & Send Email" : ""}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
