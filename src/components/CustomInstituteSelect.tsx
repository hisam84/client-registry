"use client";
import { useEffect, useRef, useState } from "react";
import { Institution } from "@/lib/types";

interface CustomInstituteSelectProps {
  institutions: Institution[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  customName: string;
  onCustomNameChange: (val: string) => void;
}

export function CustomInstituteSelect({
  institutions,
  selectedId,
  onSelect,
  customName,
  onCustomNameChange,
}: CustomInstituteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedInst = institutions.find((i) => i.id === selectedId);

  const filtered = institutions.filter((inst) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inst.instituteName.toLowerCase().includes(q) ||
      (inst.district && inst.district.toLowerCase().includes(q)) ||
      (inst.category && inst.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs sm:text-sm text-left transition-all hover:border-brass-500/50 focus:outline-none focus:ring-2 focus:ring-brass-500/30"
      >
        <div className="flex items-center gap-2 truncate">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0V5" />
          </svg>
          {selectedInst ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedInst.instituteName}
              </span>
              {selectedInst.district && (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-1.5 py-0.5 rounded shrink-0">
                  {selectedInst.district}
                </span>
              )}
            </div>
          ) : customName ? (
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              {customName} <span className="text-xs text-slate-400 font-normal">(Custom)</span>
            </span>
          ) : (
            <span className="text-slate-400 font-medium">Select an institution or type custom name...</span>
          )}
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl backdrop-blur-md flex flex-col gap-1.5">
          {/* Search Box inside dropdown */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, district, category..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brass-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtered Institutions List */}
          <div className="overflow-y-auto max-h-44 space-y-0.5 pr-1">
            {/* Custom Option */}
            <button
              type="button"
              onClick={() => {
                onSelect("", "");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                !selectedId
                  ? "bg-brass-500/10 text-brass-700 dark:text-brass-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>None / Use Custom Name</span>
              {!selectedId && <span>✓</span>}
            </button>

            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching institutions found
              </div>
            ) : (
              filtered.map((inst) => {
                const isSelected = inst.id === selectedId;

                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      onSelect(inst.id, inst.instituteName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-brass-500/15 text-brass-700 dark:text-brass-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">{inst.instituteName}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                        {inst.category} • {inst.instituteType} {inst.district ? `(${inst.district})` : ""}
                      </span>
                    </div>
                    {isSelected && <span className="text-brass-600 font-bold shrink-0">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Manual Input if Custom selected */}
      {!selectedId && (
        <div className="mt-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="Type custom organization or client name..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brass-500"
          />
        </div>
      )}
    </div>
  );
}
