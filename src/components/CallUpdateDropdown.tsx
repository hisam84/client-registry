"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Institution, CallUpdate, Employee } from "@/lib/types";
import { formatDhakaDate } from "@/lib/dateUtils";
import { useUserSession } from "@/lib/userSession";

interface Props {
  inst: Institution;
  onCallUpdateAdded?: (instId: string, updatedList: CallUpdate[]) => void;
}

function formatCallTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return formatDhakaDate(d, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function CallUpdateDropdown({ inst, onCallUpdateAdded }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { currentUser } = useUserSession();

  // Call form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number; placeAbove: boolean }>({
    top: 0,
    right: 0,
    placeAbove: false,
  });

  // Extract call updates
  const cf = (inst.customFields as any) || {};
  const rawCalls: CallUpdate[] = Array.isArray(inst.callUpdates)
    ? inst.callUpdates
    : Array.isArray(cf.callUpdates)
    ? cf.callUpdates
    : [];

  // Sort latest first and take recent 5
  const sortedCalls = [...rawCalls].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const recent5Calls = sortedCalls.slice(0, 5);

  // Load employees when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchEmployees() {
      setLoadingEmployees(true);
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setEmployees(data);
            // Default selected employee to current logged in user or first
            if (!selectedEmployeeName) {
              const matched = data.find(
                (e: Employee) => e.id === currentUser?.id || e.email === currentUser?.email
              );
              if (matched) {
                setSelectedEmployeeId(matched.id);
                setSelectedEmployeeName(matched.name);
              } else if (data.length > 0) {
                setSelectedEmployeeId(data[0].id);
                setSelectedEmployeeName(data[0].name);
              } else if (currentUser?.name) {
                setSelectedEmployeeId(currentUser.id || "");
                setSelectedEmployeeName(currentUser.name);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        if (isMounted) setLoadingEmployees(false);
      }
    }

    fetchEmployees();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalHeight = 440;
      const placeAbove = rect.bottom + modalHeight > window.innerHeight;

      setCoords({
        top: placeAbove ? Math.max(10, rect.top - modalHeight) : rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right),
        placeAbove,
      });

      // Default to "add" tab if no calls exist yet, else "list"
      if (rawCalls.length === 0) {
        setActiveTab("add");
      } else {
        setActiveTab("list");
      }
      setError("");
      setSuccessMsg("");
    }
    setIsOpen(!isOpen);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    const emp = employees.find((x) => x.id === empId);
    if (emp) {
      setSelectedEmployeeName(emp.name);
    } else {
      setSelectedEmployeeName(empId);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedEmployeeName.trim()) {
      setError("Please select an employee.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter the call subject/topic.");
      return;
    }
    if (!details.trim()) {
      setError("Please enter call description/notes.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/institutions/${inst.id}/call-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId || null,
          employeeName: selectedEmployeeName.trim(),
          subject: subject.trim(),
          details: details.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save call update");
      }

      const data = await res.json();
      const updatedList: CallUpdate[] = data.callUpdates || [
        data.callUpdate,
        ...rawCalls,
      ];

      if (onCallUpdateAdded) {
        onCallUpdateAdded(inst.id, updatedList);
      }

      // Reset form fields
      setSubject("");
      setDetails("");
      setSuccessMsg("Call update logged successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab("list");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to save call update.");
    } finally {
      setSaving(false);
    }
  };

  const callCount = rawCalls.length;

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs border cursor-pointer ${
          callCount > 0
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50"
            : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        } ${isOpen ? "ring-2 ring-amber-500/30 border-amber-500/60" : ""}`}
        title="View & Log Call Updates"
        aria-label="Call Updates"
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 ${callCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        <span className="whitespace-nowrap">Call Update</span>
        {callCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-tight">
            {callCount}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9990] bg-black/30 backdrop-blur-[1px] md:bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Container */}
            <div
              style={{
                position: "fixed",
                top: coords.placeAbove ? undefined : `${coords.top}px`,
                bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
                right: `${coords.right}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              className="fixed md:absolute z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-auto md:left-auto md:translate-x-0 md:translate-y-0 w-[92vw] max-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="p-3.5 bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {inst.instituteName}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-6">
                    Call Updates & Communication Log
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("list");
                    setError("");
                  }}
                  className={`py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "list"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span>Recent Calls</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {callCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("add");
                    setError("");
                  }}
                  className={`py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "add"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ New Call</span>
                </button>
              </div>

              {/* Tab 1: Recent 5 Calls List */}
              {activeTab === "list" && (
                <div className="p-3 max-h-[350px] overflow-y-auto space-y-2.5">
                  {recent5Calls.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No call updates yet</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Record conversations and follow-ups with this client.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("add")}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Call Update</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Recent 5 Updates
                        </span>
                        {callCount > 5 && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Showing latest 5 of {callCount}
                          </span>
                        )}
                      </div>

                      {recent5Calls.map((call, idx) => (
                        <div
                          key={call.id || idx}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 space-y-1.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          {/* Call Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                                {call.subject}
                              </h5>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                              {formatCallTime(call.createdAt)}
                            </span>
                          </div>

                          {/* Employee Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] font-medium">
                              <svg className="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{call.employeeName || "Employee"}</span>
                            </span>
                          </div>

                          {/* Call Details / Description */}
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed pt-0.5">
                            {call.details}
                          </p>
                        </div>
                      ))}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab("add")}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Log Another Call</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Add New Call Form */}
              {activeTab === "add" && (
                <form onSubmit={handleSave} className="p-3.5 space-y-3">
                  {error && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Employee Select */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Spoke with Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedEmployeeId || selectedEmployeeName}
                      onChange={handleEmployeeChange}
                      required
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      {loadingEmployees ? (
                        <option value="">Loading employees...</option>
                      ) : employees.length > 0 ? (
                        employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                          </option>
                        ))
                      ) : (
                        <option value={currentUser?.name || "Super Admin"}>
                          {currentUser?.name || "Super Admin"}
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Call Subject / Topic */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Call Subject / Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Domain renewal, Payment reminder, Feature query"
                      required
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Call Details / Description */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Call Description / Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Enter details of what was discussed, client response, commitments or next steps..."
                      required
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab("list")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Call Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
