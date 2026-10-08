"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { CustomFieldDef, Institution, CallUpdate } from "@/lib/types";
import { FilterBar, Filters } from "@/components/FilterBar";
import { InstitutionTable } from "@/components/InstitutionTable";
import { InstitutionForm } from "@/components/InstitutionForm";
import { CustomFieldModal } from "@/components/CustomFieldModal";
import { BulkUpload } from "@/components/BulkUpload";
import { ExportModal } from "@/components/ExportModal";
import { TrashModal } from "@/components/TrashModal";
import { Button } from "@/components/ui";

const emptyFilters: Filters = {
  search: "",
  type: "",
  category: "",
  subDistrict: "",
  district: "",
  status: "",
};

function HeaderActionsMenu({
  onExport,
  onBulkUpload,
  onCustomFields,
  onTrashBin,
}: {
  onExport: () => void;
  onBulkUpload: () => void;
  onCustomFields: () => void;
  onTrashBin: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
          isOpen
            ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
        title="More Actions"
        aria-label="Actions"
      >
        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>Actions</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-0.5">
            <Link
              href="/targeted-clients"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Targeted Clients</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExport();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onBulkUpload();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Bulk Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCustomFields();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Custom Fields</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onTrashBin();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Trash Bin</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InstitutionsLedgerContent() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") || "";

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    status: urlStatus,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  // Sync with searchParams if status parameter changes in URL
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam !== null && statusParam !== filters.status) {
      setFilters((prev) => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);

  // Task modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskInstId, setTaskInstId] = useState("");
  const [taskInstName, setTaskInstName] = useState("");

  const router = useRouter();

  async function loadCustomFields() {
    try {
      const res = await fetch("/api/custom-fields");
      const data = await res.json();
      setCustomFields(Array.isArray(data) ? data : []);
    } catch {
      setCustomFields([]);
    }
  }

  async function loadAll() {
    try {
      const res = await fetch("/api/institutions");
      const data = await res.json();
      setAllInstitutions(Array.isArray(data) ? data : []);
    } catch {
      setAllInstitutions([]);
    }
  }

  async function loadFiltered() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);
      if (filters.subDistrict) params.set("subDistrict", filters.subDistrict);
      if (filters.district) params.set("district", filters.district);
      if (filters.status) params.set("status", filters.status);
      const res = await fetch(`/api/institutions?${params.toString()}`);
      const data = await res.json();
      setInstitutions(Array.isArray(data) ? data : []);
    } catch {
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    loadCustomFields();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadFiltered, filters.search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const districts = useMemo(
    () => Array.from(new Set(allInstitutions.map((i) => i.district).filter(Boolean))).sort() as string[],
    [allInstitutions]
  );
  const subDistricts = useMemo(
    () => Array.from(new Set(allInstitutions.map((i) => i.subDistrict).filter(Boolean))).sort() as string[],
    [allInstitutions]
  );

  function refreshAfterChange() {
    setShowForm(false);
    setEditing(null);
    loadAll();
    loadFiltered();
  }

  async function handleDelete(inst: Institution) {
    if (!confirm(`Move "${inst.instituteName}" to Trash Bin? It can be restored within 30 days.`)) return;
    await fetch(`/api/institutions/${inst.id}`, { method: "DELETE" });
    refreshAfterChange();
  }

  async function handleToggleDeactivate(inst: Institution) {
    const isCurrentlyDeactivated = Boolean(inst.customFields?.isDeactivated);
    const action = isCurrentlyDeactivated ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} "${inst.instituteName}"?`)) return;

    await fetch(`/api/institutions/${inst.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleDeactivate: true }),
    });
    refreshAfterChange();
  }

  function handleCallUpdateAdded(instId: string, updatedCalls: CallUpdate[]) {
    setInstitutions((prev) =>
      prev.map((inst) =>
        inst.id === instId
          ? {
              ...inst,
              callUpdates: updatedCalls,
              customFields: {
                ...(inst.customFields || {}),
                callUpdates: updatedCalls,
              },
            }
          : inst
      )
    );
    setAllInstitutions((prev) =>
      prev.map((inst) =>
        inst.id === instId
          ? {
              ...inst,
              callUpdates: updatedCalls,
              customFields: {
                ...(inst.customFields || {}),
                callUpdates: updatedCalls,
              },
            }
          : inst
      )
    );
  }

  const total = allInstitutions.length;

  const pageActions = (
    <div className="flex items-center gap-2">
      <HeaderActionsMenu
        onExport={() => setShowExportModal(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        onCustomFields={() => setShowFieldModal(true)}
        onTrashBin={() => setShowTrashModal(true)}
      />
      <Button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Institution</span>
      </Button>
    </div>
  );

  return (
    <SidebarLayout
      title="Institutions Ledger"
      subtitle="Complete database of all institution clients"
      totalCountText={`${total} ${total === 1 ? "institution" : "institutions"} on record`}
      onAddTaskClick={() => {
        setTaskInstId("");
        setTaskInstName("");
        setShowTaskModal(true);
      }}
      headerActions={pageActions}
    >
      <div className="mb-6">
        <FilterBar 
          filters={filters} 
          onChange={setFilters} 
          onReset={() => setFilters(emptyFilters)}
          districts={districts} 
          subDistricts={subDistricts} 
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading…</div>
      ) : (
        <InstitutionTable
          institutions={institutions}
          customFieldDefs={customFields}
          onEdit={(inst) => {
            setEditing(inst);
            setShowForm(true);
          }}
          onDelete={handleDelete}
          onToggleDeactivate={handleToggleDeactivate}
          onAddTask={(inst) => {
            setTaskInstId(inst.id);
            setTaskInstName(inst.instituteName);
            setShowTaskModal(true);
          }}
          onCallUpdateAdded={handleCallUpdateAdded}
        />
      )}

      {showForm && (
        <InstitutionForm
          initial={editing}
          customFieldDefs={customFields}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={refreshAfterChange}
          onRequestAddField={() => setShowFieldModal(true)}
        />
      )}

      {showTaskModal && (
        <TaskFormModal
          prefilledInstitutionId={taskInstId}
          prefilledInstitutionName={taskInstName}
          onClose={() => {
            setShowTaskModal(false);
            setTaskInstId("");
            setTaskInstName("");
          }}
          onSaved={() => {
            setShowTaskModal(false);
          }}
        />
      )}

      {showFieldModal && (
        <CustomFieldModal
          fields={customFields}
          onClose={() => setShowFieldModal(false)}
          onChanged={loadCustomFields}
        />
      )}

      {showExportModal && (
        <ExportModal
          filteredInstitutions={institutions}
          allInstitutions={allInstitutions}
          customFieldDefs={customFields}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSaved={() => {
            setShowBulkUpload(false);
            loadAll();
            loadFiltered();
          }}
        />
      )}

      {showTrashModal && (
        <TrashModal
          onClose={() => setShowTrashModal(false)}
          onRestored={() => {
            loadAll();
            loadFiltered();
          }}
        />
      )}
    </SidebarLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Institutions Ledger...</div>}>
      <InstitutionsLedgerContent />
    </Suspense>
  );
}
