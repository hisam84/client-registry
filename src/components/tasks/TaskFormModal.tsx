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

  const normalizedInitialStatus: TaskStatus = initialTask?.status
    ? (initialTask.status === "Pending" ? "To Do" : (initialTask.status === "Cancelled" ? "Canceled" : initialTask.status))
    : "To Do";
  const [status, setStatus] = useState<TaskStatus>(normalizedInitialStatus);
  const normalizedInitialPriority: TaskPriority = initialTask?.priority === "Argent" ? "Urgent" : (initialTask?.priority || "Medium");
  const [priority, setPriority] = useState<TaskPriority>(normalizedInitialPriority);
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
        assignedById: initialTask?.assignedById || currentUser.id,
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

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("task-changed"));
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
      title={initialTask ? "Edit Task" : "Add Task"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Employee Assignment Dropdown - Single Clean Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assign Employee
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-medium"
          >
            <option value="">Select employee</option>
            {currentUser.id === "super-admin" && (
              <option value="super-admin">Super Admin (Self)</option>
            )}
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.designation || emp.role})
              </option>
            ))}
          </select>
        </div>

        {/* Institution Select - Single Clean Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Institution
          </label>
          {loadingInst ? (
            <div className="text-xs text-slate-400 py-2">Loading...</div>
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title*
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-medium"
          />
        </div>

        {/* Date and Time Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date & Time*
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-mono"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority === "Argent" ? "Urgent" : priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-medium"
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status === "Pending" ? "To Do" : (status === "Cancelled" ? "Canceled" : status)}
              onChange={(e) => {
                const s = e.target.value as TaskStatus;
                setStatus(s);
                if (s === "Completed") setProgress(100);
                else if ((s === "To Do" || s === "Pending") && progress === 100) setProgress(0);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-medium"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        </div>

        {/* Completion Progress % - only shown if editing or in progress */}
        {(Boolean(initialTask) || status === "In Progress" || status === "In Review") && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Progress</span>
              <span className="font-mono text-[#2196F3] font-bold">{progress}%</span>
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
                  else if (val > 0 && (status === "To Do" || status === "Pending")) setStatus("In Progress");
                }}
                className="flex-1 accent-[#2196F3] cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{progress}%</span>
            </div>
          </div>
        )}

        {/* Task Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Details (optional)"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
          />
        </div>

        {/* Completion / Outcome Remarks - only shown if editing or if Canceled / Cancelled / Completed */}
        {(Boolean(initialTask) || status === "Canceled" || status === "Cancelled" || status === "Completed") && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {status === "Canceled" || status === "Cancelled" ? "Cancellation Reason" : "Outcome / Remarks"}
            </label>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={2}
              placeholder="Reason / remarks"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#2196F3] hover:bg-[#1E88E5] text-white font-semibold shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            {saving ? "Saving..." : initialTask ? "Save Changes" : "Save Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
