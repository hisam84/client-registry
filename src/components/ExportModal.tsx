"use client";

import { useState } from "react";
import { exportInstitutionsToExcel } from "@/lib/exportExcel";
import { CustomFieldDef, Institution } from "@/lib/types";
import { Button, Modal } from "./ui";

export function ExportModal({
  filteredInstitutions,
  allInstitutions,
  customFieldDefs,
  onClose,
}: {
  filteredInstitutions: Institution[];
  allInstitutions: Institution[];
  customFieldDefs: CustomFieldDef[];
  onClose: () => void;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = (type: "filtered" | "all") => {
    setExporting(true);
    try {
      const dataToExport = type === "filtered" ? filteredInstitutions : allInstitutions;
      const today = new Date().toISOString().split("T")[0];
      const filename =
        type === "filtered"
          ? `Client_Registry_Filtered_${today}`
          : `Client_Registry_All_${today}`;

      exportInstitutionsToExcel(dataToExport, customFieldDefs, filename);
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const isFilteredDifferent = filteredInstitutions.length !== allInstitutions.length;

  return (
    <Modal title="Export Data to Excel" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Choose which dataset you want to export as an Excel (.xlsx) spreadsheet:
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={exporting || filteredInstitutions.length === 0}
            onClick={() => handleExport("filtered")}
            className="group flex flex-col items-start gap-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 p-4 sm:p-5 text-left transition-all hover:bg-blue-100/70 dark:hover:bg-blue-500/20 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-display font-bold text-sm text-[#0D47A1] dark:text-[#64B5F6]">
              <svg className="w-5 h-5 text-[#2196F3] group-hover:scale-110 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Export Filtered Data</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export currently filtered dataset (<strong className="text-slate-900 dark:text-slate-100 font-semibold">{filteredInstitutions.length}</strong> institutions)
            </p>
            {isFilteredDifferent ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#0D47A1] dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                Filters Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Current Filter
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={exporting || allInstitutions.length === 0}
            onClick={() => handleExport("all")}
            className="group flex flex-col items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-4 sm:p-5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs dark:shadow-none"
          >
            <div className="flex items-center gap-2.5 font-display font-bold text-sm text-slate-900 dark:text-slate-100">
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zM9 4v16M15 4v16" />
              </svg>
              <span>Export All Data</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export entire database records (<strong className="text-slate-900 dark:text-slate-100 font-semibold">{allInstitutions.length}</strong> institutions)
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Full Database
            </span>
          </button>
        </div>

        <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose} className="px-4 py-2 text-xs font-semibold cursor-pointer">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
