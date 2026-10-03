"use client";
import { useEffect, useState } from "react";
import { CustomInstituteSelect } from "@/components/CustomInstituteSelect";
import { Employee, Institution, TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { Button, Input, Modal } from "@/components/ui";
import { useUserSession } from "@/lib/userSession";
import { formatToDhakaDateTimeInput, parseDhakaDateTimeInput } from "@/lib/dateUtils";

interface TaskFormModalProps {
  initialTask?: TaskItem | null;
  prefilledInstitutionId?: string;
  prefilledInstitutionName?: string;
  onClose: () => void;
  onSaved: () => void;
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
  
  // Format datetime-local string in Asia/Dhaka timezone (YYYY-MM-DDTHH:mm)
  const defaultDueDate = formatToDhakaDateTimeInput(initialTask?.dueDate);
  const [dueDate, setDueDate] = useState(defaultDueDate);

  const normalizedInitialStatus: TaskStatus = initialTask?.status
    ? (initialTask.status === "Pending" ? "To Do" : (initialTask.status === "Cancelled" ? "Canceled" : initialTask.status))
    : "To Do";
  const [status, setStatus] = useState<TaskStatus>(normalizedInitialStatus);
  const normalizedInitialPriority: TaskPriority = initialTask?.priority === "Argent" ? "Urgent" : (initialTask?.priority || "Medium");
  const [priority, setPriority] = useState<TaskPriority>(normalizedInitialPriority);
  const [completionNote, setCompletionNote] = useState(initialTask?.completionNote || "");
  const [progress, setProgress] = useState<number>(initialTask?.progress ?? (initialTask?.status === "Completed" ? 100 : 0));
  const [isMonthly, setIsMonthly] = useState<boolean>(Boolean(initialTask?.isMonthly));

  // Subtasks State
  const [subtasks, setSubtasks] = useState<string[]>(() => {
    if (initialTask?.subtasks && Array.isArray(initialTask.subtasks)) {
      return initialTask.subtasks.map((s) => s.title);
    }
    return [];
  });
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialTask?.institutionId || prefilledInstitutionId || ""
  );
  const [customInstName, setCustomInstName] = useState<string>(
    initialTask?.institutionName || prefilledInstitutionName || ""
  );

  // Multi-Employee Assignment State
  const initialAssigneeIds: string[] = (() => {
    if (initialTask?.assignees && Array.isArray(initialTask.assignees) && initialTask.assignees.length > 0) {
      return Array.from(new Set(initialTask.assignees.map((a) => a.employeeId).filter(Boolean)));
    }
    if (initialTask?.assignedToId) {
      return [initialTask.assignedToId];
    }
    if (currentUser.id !== "super-admin") {
      return [currentUser.id];
    }
    return [];
  })();
  const [assignedToIds, setAssignedToIds] = useState<string[]>(initialAssigneeIds);

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

  function handleToggleEmployee(empId: string) {
    setAssignedToIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  }

  function handleSelectAllEmployees() {
    const allIds = employees.map((e) => e.id);
    setAssignedToIds(allIds);
  }

  function handleClearAllEmployees() {
    setAssignedToIds([]);
  }

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
        dueDate: parseDhakaDateTimeInput(dueDate).toISOString(),
        status,
        priority,
        completionNote: completionNote.trim() || null,
        progress,
        institutionId: selectedInstId || null,
        institutionName: customInstName.trim() || null,
        assignedToIds,
        assignedToId: assignedToIds[0] || null,
        assignedById: initialTask?.assignedById || currentUser.id,
        subtasks: subtasks.filter((s) => s.trim().length > 0),
        isMonthly,
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

        {/* Multi-Employee Assignment Box */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Assign Employees ({assignedToIds.length} selected)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleClearAllEmployees}
                className="text-[11px] font-semibold text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Selected Employee Pills */}
          {assignedToIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {assignedToIds.map((empId) => {
                const emp = employees.find((e) => e.id === empId);
                return (
                  <span
                    key={empId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800/60 text-xs font-semibold text-purple-950 dark:text-purple-200 shadow-2xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: emp?.avatarColor || "#7C3AED" }}
                    />
                    <span>#{emp?.orderSerial || 0} {emp?.name || "Employee"}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleEmployee(empId)}
                      className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove employee"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              No employees assigned yet. Select below to assign one or more team members.
            </p>
          )}

          {/* Quick Add Employee Dropdown */}
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleToggleEmployee(e.target.value);
              }
            }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3] font-medium"
          >
            <option value="">+ Click to add / assign an employee...</option>
            {employees.map((emp) => {
              const isSelected = assignedToIds.includes(emp.id);
              return (
                <option key={emp.id} value={emp.id}>
                  {isSelected ? "✓ " : "+ "} #{emp.orderSerial} {emp.name} ({emp.designation || emp.role}) {isSelected ? "(Assigned)" : ""}
                </option>
              );
            })}
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

        {/* Monthly Recurring Task Toggle */}
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/30 p-3 transition-colors">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isMonthly}
              onChange={(e) => setIsMonthly(e.target.checked)}
              className="mt-0.5 rounded border-purple-300 dark:border-purple-700 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <span className="text-sm">🔁</span>
                  <span>Repeat Every Month (Monthly Task)</span>
                </span>
                <span className="px-1.5 py-0.2 bg-purple-200/70 dark:bg-purple-800/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold rounded-full">
                  Monthly
                </span>
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 leading-normal">
                This task repeats every month. System will show and dispatch a reminder notification <strong>1 day in advance</strong>.
              </p>
            </div>
          </label>
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

        {/* Subtasks Section */}
        {!(status === "Completed" && subtasks.length === 0) && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Subtasks Checklist</span>
                {subtasks.length > 0 && (
                  <span className="ml-1 text-[11px] font-mono px-2 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                    {subtasks.length}
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Optional checklist
              </span>
            </div>

            {status !== "Completed" && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newSubtaskInput.trim()) {
                        setSubtasks([...subtasks, newSubtaskInput.trim()]);
                        setNewSubtaskInput("");
                      }
                    }
                  }}
                  placeholder="Enter subtask title and press Enter..."
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubtaskInput.trim()) {
                      setSubtasks([...subtasks, newSubtaskInput.trim()]);
                      setNewSubtaskInput("");
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/25 transition-colors whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            )}

          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {subtasks.map((st, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 truncate">{st}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="Remove subtask"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
