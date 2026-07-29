"use client";
import { useEffect, useState } from "react";
import { CustomInstituteSelect } from "@/components/CustomInstituteSelect";
import { Employee, Institution, TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { Button, Input, Modal } from "@/components/ui";
import { useUserSession } from "@/lib/userSession";

interface TaskFormModalProps {
  initialTask?: TaskItem | null;
  prefilledInstitutionId?: string;
  prefilledInstitutionName?: string;
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

export function TaskFormModal({
  initialTask,
  prefilledInstitutionId,
  prefilledInstitutionName,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const { currentUser } = useUserSession();
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  
  // Format datetime-local string in browser's local timezone (YYYY-MM-DDTHH:mm)
  const defaultDueDate = formatToLocalDateTimeInput(initialTask?.dueDate);

  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || "Pending");
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || "Medium");
  const [completionNote, setCompletionNote] = useState(initialTask?.completionNote || "");
  const [progress, setProgress] = useState<number>(initialTask?.progress ?? (initialTask?.status === "Completed" ? 100 : 0));

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialTask?.institutionId || prefilledInstitutionId || ""
  );
  const [customInstName, setCustomInstName] = useState<string>(
    initialTask?.institutionName || prefilledInstitutionName || ""
  );

  // Employee Assignment State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignedToId, setAssignedToId] = useState<string>(
    initialTask?.assignedToId !== undefined
      ? initialTask.assignedToId || ""
      : currentUser.id !== "super-admin" ? currentUser.id : ""
  );

  const [loadingInst, setLoadingInst] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [instRes, empRes] = await Promise.all([
          fetch("/api/institutions"),
          fetch("/api/employees"),
        ]);
        const instData = await instRes.json();
        const empData = await empRes.json();

        if (Array.isArray(instData)) setInstitutions(instData);
        if (Array.isArray(empData)) setEmployees(empData);
      } catch (err) {
        console.error("Failed to load initial data for TaskFormModal:", err);
      } finally {
        setLoadingInst(false);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!dueDate) {
      setError("Date and time are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: new Date(dueDate).toISOString(),
        status,
        priority,
        completionNote: completionNote.trim() || null,
        progress,
        institutionId: selectedInstId || null,
        institutionName: customInstName.trim() || null,
        assignedToId: assignedToId || null,
        assignedById: initialTask?.assignedById || (currentUser.id !== "super-admin" ? currentUser.id : null),
      };

      const url = initialTask ? `/api/tasks/${initialTask.id}` : "/api/tasks";
      const method = initialTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save task");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initialTask ? "Edit Task (টাস্ক এডিট)" : "Add Task (নতুন টাস্ক ক্রিয়েট)"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Employee Assignment Dropdown */}
        <div className="bg-brass-500/5 dark:bg-brass-500/10 p-3 rounded-xl border border-brass-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>👤 Assign Employee (ইমপ্লয়ী এসাইন করুন)</span>
            </label>
            <button
              type="button"
              onClick={() => setAssignedToId(currentUser.id !== "super-admin" ? currentUser.id : "")}
              className="text-[11px] font-semibold text-brass-600 dark:text-brass-400 hover:underline"
            >
              + Assign to Myself (নিজের নামে)
            </button>
          </div>

          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          >
            <option value="">❓ Unassigned (কারো নামে এসাইন নয়)</option>

            {currentUser.id === "super-admin" && (
              <option value="super-admin">🛡️ Super Admin (Self)</option>
            )}

            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                #{emp.orderSerial} • {emp.name} ({emp.designation || emp.role})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            * ইমপ্লয়ী এসাইন না করলেও টাস্কটি ক্রিয়েট করা যাবে।
          </p>
        </div>

        {/* Institution Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Institution / Organization (প্রতিষ্ঠান)
          </label>
          {loadingInst ? (
            <div className="text-xs text-slate-400">Loading institutions list...</div>
          ) : (
            <CustomInstituteSelect
              institutions={institutions}
              selectedId={selectedInstId}
              onSelect={(id, name) => {
                setSelectedInstId(id);
                if (name) setCustomInstName(name);
              }}
              customName={customInstName}
              onCustomNameChange={setCustomInstName}
            />
          )}
        </div>

        {/* Task Title */}
        <div>
          <Input
            label="Task Title (টাস্কের শিরোনাম)*"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Domain Renewal Followup"
            required
          />
        </div>

        {/* Date and Time Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Scheduled Date & Time (তারিখ ও সময়)*
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-mono"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority (গুরুত্ব)
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-medium"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status (স্ট্যাটাস)
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Completion Progress % */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Progress (% সম্পন্ন)</span>
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
          {/* Quick preset percentage buttons */}
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

        {/* Task Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Details & Instructions (টাস্কের বিবরণ)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Write details, instructions, or action notes..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>

        {/* Completion / Status Note or Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Outcome / Completion Reason & Remarks (কমপ্লিট / আনকমপ্লিট নোট)
          </label>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            rows={2}
            placeholder="e.g., Client requested delay until next week, domain renewed successfully, or budget issue..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold">
            {saving ? "Saving..." : initialTask ? "Save Changes" : "Save Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
