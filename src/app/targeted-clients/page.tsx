"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "@/components/SidebarLayout";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { CustomFieldDef, Institution, TargetedClient } from "@/lib/types";
import { TargetedFilterBar, TargetedFilters } from "@/components/targeted-clients/TargetedFilterBar";
import { TargetedClientTable } from "@/components/targeted-clients/TargetedClientTable";
import { TargetedClientForm } from "@/components/targeted-clients/TargetedClientForm";
import { TargetedBulkUpload } from "@/components/targeted-clients/TargetedBulkUpload";
import { InstitutionForm } from "@/components/InstitutionForm";
import { CustomFieldModal } from "@/components/CustomFieldModal";
import { Button } from "@/components/ui";

const emptyFilters: TargetedFilters = {
  search: "",
  priority: "",
  district: "",
  subDistrict: "",
  status: "active",
};

export default function TargetedClientsPage() {
  const [clients, setClients] = useState<TargetedClient[]>([]);
  const [allClients, setAllClients] = useState<TargetedClient[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [filters, setFilters] = useState<TargetedFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editing, setEditing] = useState<TargetedClient | null>(null);
  const [convertingClient, setConvertingClient] = useState<TargetedClient | null>(null);

  // Task modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskInstName, setTaskInstName] = useState("");

  const router = useRouter();

  async function loadCustomFields() {
    try {
      const res = await fetch("/api/custom-fields");
      const data = await res.json();
      setCustomFields(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load custom fields:", err);
    }
  }

  async function loadAll() {
    const res = await fetch("/api/targeted-clients?status=all");
    const data = await res.json();
    setAllClients(Array.isArray(data) ? data : []);
  }

  async function loadFiltered() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.district) params.set("district", filters.district);
    if (filters.subDistrict) params.set("subDistrict", filters.subDistrict);
    if (filters.status) params.set("status", filters.status);

    const res = await fetch(`/api/targeted-clients?${params.toString()}`);
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
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
    () => Array.from(new Set(allClients.map((i) => i.district).filter(Boolean))).sort() as string[],
    [allClients]
  );

  const subDistricts = useMemo(
    () => Array.from(new Set(allClients.map((i) => i.subDistrict).filter(Boolean))).sort() as string[],
    [allClients]
  );

  function refreshData() {
    setShowForm(false);
    setEditing(null);
    setConvertingClient(null);
    loadAll();
    loadFiltered();
  }

  async function handleToggleArchive(client: TargetedClient) {
    const action = client.isArchived ? "restore" : "archive";
    if (!confirm(`Are you sure you want to ${action} "${client.instituteName}"?`)) return;

    await fetch(`/api/targeted-clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !client.isArchived }),
    });
    refreshData();
  }

  async function handleDelete(client: TargetedClient) {
    if (!confirm(`Delete "${client.instituteName}" permanently from targeted list?`)) return;

    await fetch(`/api/targeted-clients/${client.id}`, { method: "DELETE" });
    refreshData();
  }

  async function handleConvertedSaved() {
    if (convertingClient) {
      // Archive the targeted client now that it is transferred to Main Institutions Ledger
      await fetch(`/api/targeted-clients/${convertingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      alert(`"${convertingClient.instituteName}" has been successfully added to Main Institutions Ledger and archived from targeted list.`);
    }
    refreshData();
  }

  const totalActive = allClients.filter((c) => !c.isArchived).length;
  const totalHigh = allClients.filter((c) => !c.isArchived && c.priority === "High").length;
  const totalArchived = allClients.filter((c) => c.isArchived).length;

  const prefilledInstitution: Institution | null = convertingClient
    ? {
        id: "", // empty id triggers POST /api/institutions
        instituteName: convertingClient.instituteName,
        instituteNameBangla: convertingClient.instituteNameBangla ?? "",
        domain: "",
        category: "Website",
        instituteType: "School",
        issueDate: null,
        expireDate: null,
        actualExpireDate: null,
        student: "",
        condition: "",
        btclUsername: "",
        btclPassword: "",
        btclMobileNo: "",
        btclEmail: convertingClient.email ?? "",
        btclEmailPassword: "",
        instituteHead: convertingClient.contactPerson ?? "",
        contact1: convertingClient.phone ?? "",
        contact2: "",
        inChargeTeacher: "",
        designation: "",
        inChargeTeacherContact: "",
        subDistrict: convertingClient.subDistrict ?? "",
        district: convertingClient.district ?? "",
        address: convertingClient.address ?? "",
        customFields: {},
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
      }
    : null;

  const pageActions = (
    <>
      <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
        Bulk Upload
      </Button>
      <Button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        + Add Targeted Client
      </Button>
    </>
  );

  return (
    <SidebarLayout
      title="Targeted Clients"
      subtitle="Potential client pipeline and priority tracking"
      totalCountText={`Active: ${totalActive} • High Priority: ${totalHigh} • Archived: ${totalArchived}`}
      onAddTaskClick={() => {
        setTaskInstName("");
        setShowTaskModal(true);
      }}
      headerActions={pageActions}
    >
      <div className="mb-6">
        <TargetedFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(emptyFilters)}
          districts={districts}
          subDistricts={subDistricts}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading targeted clients…</div>
      ) : (
        <TargetedClientTable
          clients={clients}
          onEdit={(client) => {
            setEditing(client);
            setShowForm(true);
          }}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
          onConvertToMain={(client) => {
            setConvertingClient(client);
          }}
          onAddTask={(client) => {
            setTaskInstName(client.instituteName);
            setShowTaskModal(true);
          }}
        />
      )}

      {showTaskModal && (
        <TaskFormModal
          prefilledInstitutionName={taskInstName}
          onClose={() => {
            setShowTaskModal(false);
            setTaskInstName("");
          }}
          onSaved={() => {
            setShowTaskModal(false);
          }}
        />
      )}

      {showForm && (
        <TargetedClientForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={refreshData}
        />
      )}

      {convertingClient && prefilledInstitution && (
        <InstitutionForm
          initial={prefilledInstitution}
          customFieldDefs={customFields}
          onClose={() => setConvertingClient(null)}
          onSaved={handleConvertedSaved}
          onRequestAddField={() => setShowFieldModal(true)}
        />
      )}

      {showFieldModal && (
        <CustomFieldModal
          fields={customFields}
          onClose={() => setShowFieldModal(false)}
          onChanged={loadCustomFields}
        />
      )}

      {showBulkUpload && (
        <TargetedBulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSaved={() => {
            setShowBulkUpload(false);
            refreshData();
          }}
        />
      )}
    </SidebarLayout>
  );
}
