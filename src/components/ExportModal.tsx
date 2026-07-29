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
        <p className="text-sm text-slate-300">
          Choose which dataset you want to export as an Excel (.xlsx) spreadsheet:
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={exporting || filteredInstitutions.length === 0}
            onClick={() => handleExport("filtered")}
            className="flex flex-col items-start gap-2 rounded-lg border border-brass-500/40 bg-brass-500/10 p-4 text-left transition-all hover:bg-brass-500/20 hover:border-brass-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 font-display font-medium text-brass-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Export Filtered Data
            </div>
            <p className="text-xs text-slate-400">
              Export currently filtered dataset (<strong>{filteredInstitutions.length}</strong> institutions)
            </p>
            {isFilteredDifferent && (
              <span className="inline-block rounded bg-brass-500/20 px-2 py-0.5 text-[10px] font-medium text-brass-300">
                Filters Active
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={exporting || allInstitutions.length === 0}
            onClick={() => handleExport("all")}
            className="flex flex-col items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-left transition-all hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 font-display font-medium text-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zM9 4v16M15 4v16" />
              </svg>
              Export All Data
            </div>
            <p className="text-xs text-slate-400">
              Export entire database records (<strong>{allInstitutions.length}</strong> institutions)
            </p>
          </button>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
