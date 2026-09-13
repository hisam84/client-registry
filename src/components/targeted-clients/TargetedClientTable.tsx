"use client";
import { useState } from "react";
import { TargetedClient } from "@/lib/types";
import { Badge } from "@/components/ui";

interface Props {
  clients: TargetedClient[];
  onEdit: (client: TargetedClient) => void;
  onToggleArchive: (client: TargetedClient) => void;
  onDelete: (client: TargetedClient) => void;
  onConvertToMain?: (client: TargetedClient) => void;
  onAddTask?: (client: TargetedClient) => void;
}

export function TargetedClientTable({
  clients,
  onEdit,
  onToggleArchive,
  onDelete,
  onConvertToMain,
  onAddTask,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 shadow-sm">
        No targeted clients found. Click "+ Add Targeted Client" to create one.
      </div>
    );
  }

  function getPriorityBadge(priority: string) {
    if (priority === "High") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 whitespace-nowrap">
          High
        </span>
      );
    }
    if (priority === "Low") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 whitespace-nowrap">
          Low
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        {priority || "Default"}
      </span>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          <tr>
            <th className="px-4 py-3.5">Priority</th>
            <th className="px-4 py-3.5">Institute Name</th>
            <th className="px-4 py-3.5">Contact Person</th>
            <th className="px-4 py-3.5">Phone & Email</th>
            <th className="px-4 py-3.5">Location</th>
            <th className="px-4 py-3.5">Added By</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {clients.map((client) => {
            const isExpanded = expandedId === client.id;

            return (
              <tr
                key={client.id}
                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  client.isArchived ? "opacity-60 bg-slate-100/50 dark:bg-slate-950/40" : ""
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3.5">
                  {getPriorityBadge(client.priority)}
                </td>

                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{client.instituteName}</div>
                  {client.instituteNameBangla && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bengali mt-0.5">
                      {client.instituteNameBangla}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3.5 font-medium">
                  {client.contactPerson ? (
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{client.contactPerson}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  {client.phone ? (
                    <div className="font-mono text-xs text-slate-800 dark:text-slate-200 font-medium">{client.phone}</div>
                  ) : null}
                  {client.email ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.email}</div>
                  ) : null}
                  {!client.phone && !client.email && <span className="text-slate-400 dark:text-slate-600">—</span>}
                </td>

                <td className="px-4 py-3.5">
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {[client.subDistrict, client.district].filter(Boolean).join(", ") || "—"}
                  </div>
                  {client.address && (
                    <div className="text-[11px] text-slate-500 truncate max-w-xs" title={client.address}>
                      {client.address}
                    </div>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  {client.createdBy?.name ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      👤 {client.createdBy.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">Admin / System</span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  {client.isArchived ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
                      Archived
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      Active
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    {client.notes && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                        className="text-xs font-semibold text-brass-600 dark:text-brass-400 hover:underline px-1 py-1 whitespace-nowrap"
                      >
                        {isExpanded ? "Hide Note" : "View Note"}
                      </button>
                    )}

                    {onConvertToMain && !client.isArchived && (
                      <button
                        type="button"
                        onClick={() => onConvertToMain(client)}
                        className="p-1.5 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors flex items-center justify-center"
                        title="Promote to Main Institutions Ledger"
                        aria-label="Promote to Main Institutions Ledger"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                    )}

                    {onAddTask && (
                      <button
                        type="button"
                        onClick={() => onAddTask(client)}
                        className="p-1.5 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center"
                        title="Add Task for this client"
                        aria-label="Add Task"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleArchive(client)}
                      className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                      title={client.isArchived ? "Restore Client" : "Archive Client"}
                      aria-label={client.isArchived ? "Restore Client" : "Archive Client"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(client)}
                      className="p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                      title="Edit Client"
                      aria-label="Edit Client"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(client)}
                      className="p-1.5 text-xs rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                      title="Delete Client"
                      aria-label="Delete Client"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && client.notes && (
                    <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-left text-xs text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-brass-600 dark:text-brass-400 block mb-1">Notes / Remarks:</span>
                      <p className="whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
