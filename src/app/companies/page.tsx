"use client";
import { useEffect, useMemo, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Company, CompanySubscription, Software } from "@/lib/types";
import { CompanyFilterBar, CompanyFilters } from "@/components/companies/CompanyFilterBar";
import { CompanyTable } from "@/components/companies/CompanyTable";
import { CompanyFormModal } from "@/components/companies/CompanyFormModal";
import { SubscriptionModal } from "@/components/companies/SubscriptionModal";
import { SoftwareManagementModal } from "@/components/companies/SoftwareManagementModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";

const initialFilters: CompanyFilters = {
  search: "",
  softwareId: "",
  status: "all",
  district: "",
};

export default function CompanyLedgerPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [filters, setFilters] = useState<CompanyFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subTargetCompany, setSubTargetCompany] = useState<Company | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<CompanySubscription | null>(null);

  const [showSoftwareCatalog, setShowSoftwareCatalog] = useState(false);

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);

  async function loadSoftwares() {
    try {
      const res = await fetch("/api/softwares");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSoftwares(data);
      }
    } catch (err) {
      console.error("Failed to load softwares:", err);
    }
  }

  async function loadAllCompanies() {
    try {
      const res = await fetch("/api/companies?status=all");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllCompanies(data);
      }
    } catch (err) {
      console.error("Failed to load all companies:", err);
    }
  }

  async function loadFilteredCompanies() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.softwareId) params.set("softwareId", filters.softwareId);
      if (filters.status) params.set("status", filters.status);
      if (filters.district) params.set("district", filters.district);

      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCompanies(data);
      } else {
        setErrorMsg(data.error || "Failed to load company records.");
        setCompanies([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load company records.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSoftwares();
    loadAllCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadFilteredCompanies, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function refreshData() {
    setShowCompanyModal(false);
    setEditingCompany(null);
    setShowSubscriptionModal(false);
    setSubTargetCompany(null);
    setEditingSubscription(null);
    loadSoftwares();
    loadAllCompanies();
    loadFilteredCompanies();
  }

  const districts = useMemo(
    () => Array.from(new Set(allCompanies.map((c) => c.district).filter(Boolean))).sort() as string[],
    [allCompanies]
  );

  // Compute metrics
  const totalCompaniesCount = allCompanies.length;
  let activeSubsCount = 0;
  let expiringSoonCount = 0;

  const now = new Date();
  allCompanies.forEach((c) => {
    (c.subscriptions || []).forEach((sub) => {
      if (sub.status === "Active") {
        activeSubsCount++;
        if (sub.expireDate) {
          const exp = new Date(sub.expireDate);
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 60) {
            expiringSoonCount++;
          }
        }
      }
    });
  });

  async function handleDeleteCompany(company: Company) {
    if (!confirm(`Are you sure you want to delete company "${company.companyName}"?`)) return;

    try {
      const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete company.");
      }
      refreshData();
    } catch (err: any) {
      alert(err.message || "Could not delete company.");
    }
  }

  async function handleDeleteSubscription(company: Company, sub: CompanySubscription) {
    const swName = sub.software?.name || "Software";
    if (!confirm(`Remove subscription for "${swName}" from ${company.companyName}?`)) return;

    try {
      const res = await fetch(`/api/companies/${company.id}/subscriptions/${sub.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete subscription.");
      }
      refreshData();
    } catch (err: any) {
      alert(err.message || "Could not delete subscription.");
    }
  }

  const headerActions = (
    <>
      <button
        onClick={() => setShowSoftwareCatalog(true)}
        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5"
      >
        <span>💻</span>
        <span>Softwares Catalog</span>
      </button>

      <button
        onClick={() => {
          setEditingCompany(null);
          setShowCompanyModal(true);
        }}
        className="px-4 py-2 bg-[#2196F3] hover:bg-[#1E88E5] text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/25 transition-all flex items-center gap-1.5 border border-blue-600/30"
      >
        <span>+ Add Company</span>
      </button>
    </>
  );

  return (
    <SidebarLayout
      title="Company Ledger"
      subtitle="Client company roster, software licenses, and subscription management"
      totalCountText={`Total Companies: ${totalCompaniesCount} • Active Subscriptions: ${activeSubsCount} • Expiring Soon: ${expiringSoonCount}`}
      onAddTaskClick={() => setShowTaskModal(true)}
      headerActions={headerActions}
    >
      <div className="mb-6">
        <CompanyFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(initialFilters)}
          softwares={softwares}
          districts={districts}
        />
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => loadFilteredCompanies()}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading company ledger…</div>
      ) : (
        <CompanyTable
          companies={companies}
          onEditCompany={(comp) => {
            setEditingCompany(comp);
            setShowCompanyModal(true);
          }}
          onDeleteCompany={handleDeleteCompany}
          onAddSubscription={(comp) => {
            setSubTargetCompany(comp);
            setEditingSubscription(null);
            setShowSubscriptionModal(true);
          }}
          onEditSubscription={(comp, sub) => {
            setSubTargetCompany(comp);
            setEditingSubscription(sub);
            setShowSubscriptionModal(true);
          }}
          onDeleteSubscription={handleDeleteSubscription}
        />
      )}

      {/* Modals */}
      {showCompanyModal && (
        <CompanyFormModal
          initial={editingCompany}
          onClose={() => {
            setShowCompanyModal(false);
            setEditingCompany(null);
          }}
          onSaved={refreshData}
        />
      )}

      {showSubscriptionModal && subTargetCompany && (
        <SubscriptionModal
          companyId={subTargetCompany.id}
          companyName={subTargetCompany.companyName}
          initial={editingSubscription}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSubTargetCompany(null);
            setEditingSubscription(null);
          }}
          onSaved={refreshData}
        />
      )}

      {showSoftwareCatalog && (
        <SoftwareManagementModal
          onClose={() => setShowSoftwareCatalog(false)}
          onChanged={() => {
            loadSoftwares();
            loadFilteredCompanies();
          }}
        />
      )}

      {showTaskModal && (
        <TaskFormModal
          onClose={() => setShowTaskModal(false)}
          onSaved={() => setShowTaskModal(false)}
        />
      )}
    </SidebarLayout>
  );
}
