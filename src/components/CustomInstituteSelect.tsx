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
      {/* Trigger Button - Single Clean Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-left transition-all hover:border-[#2196F3] focus:outline-none focus:ring-2 focus:ring-[#2196F3] cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedInst ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedInst.instituteName}
              </span>
              {selectedInst.district && (
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded shrink-0">
                  {selectedInst.district}
                </span>
              )}
            </div>
          ) : customName ? (
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {customName}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Select institution</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {(selectedId || customName) && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("", "");
                onCustomNameChange("");
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs rounded"
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl backdrop-blur-md flex flex-col gap-1.5">
          {/* Search Box inside dropdown */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institution..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
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
          <div className="overflow-y-auto max-h-48 space-y-0.5 pr-1">
            <button
              type="button"
              onClick={() => {
                onSelect("", "");
                onCustomNameChange("");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                !selectedId && !customName
                  ? "bg-blue-50 dark:bg-blue-500/15 text-[#0D47A1] dark:text-blue-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>None / General</span>
              {!selectedId && !customName && <span>✓</span>}
            </button>

            {search.trim() && !institutions.some((i) => i.instituteName.toLowerCase() === search.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onSelect("", search.trim());
                  onCustomNameChange(search.trim());
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors text-left bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
              >
                <span>+ Use &quot;{search.trim()}&quot; as custom institution</span>
              </button>
            )}

            {filtered.length === 0 && !search.trim() ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No institutions found
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
                      onCustomNameChange(inst.instituteName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-500/15 text-[#0D47A1] dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">{inst.instituteName}</span>
                      {inst.district && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block truncate">
                          {inst.category} • {inst.district}
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="text-[#2196F3] font-bold shrink-0">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
