"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { CustomFieldDef, Institution } from "@/lib/types";
import { FilterBar, Filters } from "@/components/FilterBar";
import { InstitutionTable } from "@/components/InstitutionTable";
import { InstitutionForm } from "@/components/InstitutionForm";
import { CustomFieldModal } from "@/components/CustomFieldModal";
import { BulkUpload } from "@/components/BulkUpload";
import { DeleteAllModal } from "@/components/DeleteAllModal";
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

export default function Home() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  // Task modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskInstId, setTaskInstId] = useState("");
  const [taskInstName, setTaskInstName] = useState("");

  const router = useRouter();

  async function loadCustomFields() {
    const res = await fetch("/api/custom-fields");
    setCustomFields(await res.json());
  }

  async function loadAll() {
    const res = await fetch("/api/institutions");
    const data = await res.json();
    setAllInstitutions(data);
  }

  async function loadFiltered() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.subDistrict) params.set("subDistrict", filters.subDistrict);
    if (filters.district) params.set("district", filters.district);
    if (filters.status) params.set("status", filters.status);
    const res = await fetch(`/api/institutions?${params.toString()}`);
    const data = await res.json();
    setInstitutions(data);
    setLoading(false);
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

  const total = allInstitutions.length;

  const pageActions = (
    <>
      <Button variant="outline" onClick={() => setShowTrashModal(true)}>
        Trash Bin
      </Button>
      <Button variant="danger" onClick={() => setShowDeleteAllModal(true)}>
        Delete All
      </Button>
      <Button variant="outline" onClick={() => setShowFieldModal(true)}>
        Custom Fields
      </Button>
      <Button variant="outline" onClick={() => setShowExportModal(true)}>
        Export Excel
      </Button>
      <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
        Bulk Upload
      </Button>
      <Button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        + Add Institution
      </Button>
    </>
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
          onAddTask={(inst) => {
            setTaskInstId(inst.id);
            setTaskInstName(inst.instituteName);
            setShowTaskModal(true);
          }}
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

      {showDeleteAllModal && (
        <DeleteAllModal
          onClose={() => setShowDeleteAllModal(false)}
          onDeleted={() => {
            setShowDeleteAllModal(false);
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
