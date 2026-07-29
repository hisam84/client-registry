"use client";

import { useEffect, useState } from "react";
import { Institution } from "@/lib/types";
import { inputClass, Modal } from "./ui";

interface TrashedInstitution extends Institution {
  daysRemaining: number;
}

export function TrashModal({
  onClose,
  onRestored,
}: {
  onClose: () => void;
  onRestored: () => void;
}) {
  const [items, setItems] = useState<TrashedInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadTrash() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institutions/trash");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load trash items");
      setItems(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.instituteName.toLowerCase().includes(q) ||
      (item.instituteNameBangla && item.instituteNameBangla.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q) ||
      item.instituteType.toLowerCase().includes(q)
    );
  });

  const allSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  }

  function toggleSelectOne(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  async function handleRestore(inst: TrashedInstitution) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/institutions/${inst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (!res.ok) throw new Error("Failed to restore institution");
      loadTrash();
      onRestored();
    } catch (err: any) {
      alert(err.message || "Failed to restore");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePermanentDelete(inst: TrashedInstitution) {
    if (!confirm(`Permanently delete "${inst.instituteName}"? This CANNOT be undone.`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/institutions/${inst.id}?permanent=true`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete institution");
      loadTrash();
      onRestored();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchRestore() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Restore ${selectedIds.length} selected institutions back to active ledger?`)) return;

    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/institutions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restore: true }),
        });
      }
      loadTrash();
      onRestored();
    } catch (err: any) {
      alert(err.message || "Failed batch restore");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} selected institutions? This CANNOT be undone.`)) return;

    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/institutions/${id}?permanent=true`, {
          method: "DELETE",
        });
      }
      loadTrash();
      onRestored();
    } catch (err: any) {
      alert(err.message || "Failed batch delete");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEmptyTrash() {
    if (!confirm("Are you sure you want to permanently delete ALL items in the Trash Bin? This CANNOT be undone.")) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/institutions/trash", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to empty trash");
      loadTrash();
      onRestored();
    } catch (err: any) {
      alert(err.message || "Failed to empty trash");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Modal title="Trash Bin (Restore Deleted Institutions)" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {/* Retention Info Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Deleted institutions are retained in the Trash Bin for <strong className="font-bold">30 days</strong> before permanent deletion.
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              Empty Trash ({items.length})
            </button>
          )}
        </div>

        {/* Toolbar: Search and Batch Actions */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search trash by name, category, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={handleBatchRestore}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors whitespace-nowrap"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading trash bin items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {search ? "No deleted institutions match your search." : "Trash bin is empty."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wide">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brass-500 focus:ring-brass-400"
                    />
                  </th>
                  <th className="px-4 py-3">Institute Name</th>
                  <th className="px-4 py-3">Category / Type</th>
                  <th className="px-4 py-3">Deleted Date</th>
                  <th className="px-4 py-3">Auto-Delete</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        isSelected ? "bg-brass-500/10 dark:bg-brass-500/15" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brass-500 focus:ring-brass-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.instituteName}</div>
                        {item.instituteNameBangla && (
                          <div className="text-slate-500 dark:text-slate-400 font-bengali text-xs mt-0.5">{item.instituteNameBangla}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{item.instituteType}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                        {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                          {item.daysRemaining} {item.daysRemaining === 1 ? "day left" : "days left"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <button
                            onClick={() => handleRestore(item)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-colors whitespace-nowrap"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 transition-colors whitespace-nowrap"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
