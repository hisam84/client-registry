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

                    {onConvertToMain && (
                      <button
                        onClick={() => onConvertToMain(client)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
                        title="Promote client to Main Institutions Ledger"
                      >
                        + Promote to Main
                      </button>
                    )}

                    {onAddTask && (
                      <button
                        onClick={() => onAddTask(client)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brass-500/15 text-brass-700 dark:text-brass-400 border border-brass-500/30 hover:bg-brass-500/25 transition-colors whitespace-nowrap"
                        title="Add task for this client"
                      >
                        + Task
                      </button>
                    )}

                    <button
                      onClick={() => onToggleArchive(client)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                      title={client.isArchived ? "Restore Client" : "Archive Client"}
                    >
                      {client.isArchived ? "Restore" : "Archive"}
                    </button>

                    <button
                      onClick={() => onEdit(client)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(client)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors whitespace-nowrap"
                    >
                      Delete
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
