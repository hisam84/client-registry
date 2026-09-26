"use client";
import { Software } from "@/lib/types";

export interface CompanyFilters {
  search: string;
  softwareId: string;
  status: string;
  district: string;
}

interface CompanyFilterBarProps {
  filters: CompanyFilters;
  onChange: (filters: CompanyFilters) => void;
  onReset: () => void;
  softwares: Software[];
  districts: string[];
  expirySettings?: {
    monthlyDays: number;
    halfYearlyDays: number;
    yearlyDays: number;
  } | null;
}

export function CompanyFilterBar({
  filters,
  onChange,
  onReset,
  softwares,
  districts,
  expirySettings,
}: CompanyFilterBarProps) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Search Companies
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, Phone, Contact, District..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Software Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Software Used
          </label>
          <select
            value={filters.softwareId}
            onChange={(e) => onChange({ ...filters, softwareId: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Softwares</option>
            {softwares.map((sw) => (
              <option key={sw.id} value={sw.id}>
                {sw.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subscription Status Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Subscription Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">
              Expiring Soon{expirySettings ? ` (M: ≤${expirySettings.monthlyDays}d, H: ≤${expirySettings.halfYearlyDays}d, Y: ≤${expirySettings.yearlyDays}d)` : " (Expiring Soon)"}
            </option>
            <option value="expired">Expired</option>
            <option value="deactivated">Deactivated / Cancelled</option>
            <option value="no_subscription">No Subscription</option>
          </select>
        </div>

        {/* District Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            District
          </label>
          <select
            value={filters.district}
            onChange={(e) => onChange({ ...filters, district: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(filters.search || filters.softwareId || filters.status !== "all" || filters.district) && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
