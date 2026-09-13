"use client";
import { useState } from "react";
import {
  computeStatus,
  DETAIL_FIELD_ORDER,
  FIELD_LABELS,
  Institution,
  STATUS_COLOR,
  STATUS_LABEL,
} from "@/lib/types";
import { Badge, Button } from "./ui";
import { CustomFieldDef } from "@/lib/types";

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getDomainUrl(domain: string | null): string {
  if (!domain) return "";
  const trimmed = domain.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function InstitutionTable({
  institutions,
  customFieldDefs,
  onEdit,
  onDelete,
  onAddTask,
}: {
  institutions: Institution[];
  customFieldDefs: CustomFieldDef[];
  onEdit: (i: Institution) => void;
  onDelete: (i: Institution) => void;
  onAddTask?: (i: Institution) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (institutions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 py-16 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        <p className="font-display text-lg text-slate-800 dark:text-slate-300">No institutions match these filters</p>
        <p className="mt-1 text-sm">Try clearing a filter, or add a new institution to the registry.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            <th className="w-12 px-3 py-3 text-center">SL #</th>
            <th className="w-8 px-2 py-3"></th>
            <th className="px-3 py-3">Institute Name</th>
            <th className="hidden md:table-cell px-3 py-3">Website / Domain</th>
            <th className="hidden md:table-cell px-3 py-3">Issue Date</th>
            <th className="hidden md:table-cell px-3 py-3">Expire Date</th>
            <th className="hidden md:table-cell px-3 py-3">Status</th>
            <th className="hidden md:table-cell px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
          {institutions.map((inst, index) => {
            const status = computeStatus(inst.expireDate, inst.actualExpireDate);
            const isOpen = expanded === inst.id;
            const domainUrl = getDomainUrl(inst.domain);

            return (
              <tr key={inst.id} className="contents">
                <tr
                  className={`cursor-pointer border-b border-slate-200 dark:border-slate-800/70 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    isOpen ? "bg-slate-50 dark:bg-slate-900/60" : ""
                  }`}
                  onClick={() => setExpanded(isOpen ? null : inst.id)}
                >
                  <td className="px-3 py-3 text-center text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-2 py-3 text-slate-400 dark:text-slate-500">
                    <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{inst.instituteName}</div>
                        {inst.instituteNameBangla && (
                          <div className="bn text-xs text-slate-600 dark:text-slate-400">{inst.instituteNameBangla}</div>
                        )}
                        <div className="mt-0.5 text-xs text-slate-500">
                          {inst.instituteType} · {inst.category}
                        </div>
                      </div>
                      {/* Mobile indicator badge */}
                      <div className="md:hidden">
                        <Badge className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {inst.domain ? (
                      <a
                        href={domainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brass-600 dark:text-brass-400 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                        title={`Open ${inst.domain} in a new tab`}
                      >
                        <span>{inst.domain}</span>
                        <svg className="w-3 h-3 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 text-slate-700 dark:text-slate-300">{fmtDate(inst.issueDate)}</td>
                  <td className="hidden md:table-cell px-3 py-3 text-slate-700 dark:text-slate-300">{fmtDate(inst.expireDate)}</td>
                  <td className="hidden md:table-cell px-3 py-3">
                    <Badge className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
                  </td>
                  <td className="hidden md:table-cell px-3 py-3">
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {onAddTask && (
                        <button
                          type="button"
                          onClick={() => onAddTask(inst)}
                          className="p-1.5 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center"
                          title="Add Task"
                          aria-label="Add Task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(inst)}
                        className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        title="Edit Institution"
                        aria-label="Edit Institution"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(inst)}
                        className="p-1.5 text-xs rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                        title="Delete Institution"
                        aria-label="Delete Institution"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-slate-200 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-950/60">
                    <td colSpan={8} className="px-4 sm:px-6 py-5">
                      {/* Mobile Dropdown Overview Box */}
                      <div className="mb-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 md:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                            <Badge className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
                          </div>
                          <div className="flex gap-1.5">
                            {onAddTask && (
                              <button
                                type="button"
                                onClick={() => onAddTask(inst)}
                                className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center justify-center"
                                title="Add Task"
                                aria-label="Add Task"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEdit(inst)}
                              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors flex items-center justify-center"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(inst)}
                              className="p-1.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 uppercase tracking-wide font-medium">Issue Date</span>
                            <div className="text-slate-800 dark:text-slate-200 mt-0.5 text-sm">{fmtDate(inst.issueDate)}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase tracking-wide font-medium">Expire Date</span>
                            <div className="text-slate-800 dark:text-slate-200 mt-0.5 text-sm">{fmtDate(inst.expireDate)}</div>
                          </div>
                          {inst.domain && (
                            <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                              <span className="text-slate-500 uppercase tracking-wide font-medium">Website / Domain</span>
                              <div className="mt-0.5">
                                <a
                                  href={domainUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-brass-600 dark:text-brass-400 hover:underline font-mono text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{inst.domain}</span>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                        {DETAIL_FIELD_ORDER.map((key) => {
                          const value = (inst as any)[key];
                          if (!value) return null;
                          return (
                            <div key={key}>
                              <div className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                                {FIELD_LABELS[key]}
                              </div>
                              <div className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{fmtMaybeDate(key, value)}</div>
                            </div>
                          );
                        })}
                        {customFieldDefs.map((f) => {
                          const value = inst.customFields?.[f.key];
                          if (!value) return null;
                          return (
                            <div key={f.key}>
                              <div className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                                {f.label}
                              </div>
                              <div className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{value}</div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function fmtMaybeDate(key: string, value: string) {
  if (key.toLowerCase().includes("date")) return fmtDate(value);
  return value;
}
