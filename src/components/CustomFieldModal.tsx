"use client";
import { useState } from "react";
import { Button, Field, inputClass, Modal } from "./ui";
import { CustomFieldDef } from "@/lib/types";

export function CustomFieldModal({
  fields,
  onClose,
  onChanged,
}: {
  fields: CustomFieldDef[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "number" | "date">("text");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, fieldType }),
      });
      if (!res.ok) throw new Error("Could not add field.");
      setLabel("");
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeField(id: string) {
    if (!confirm("Remove this custom field? Existing values will remain but stop being editable.")) return;
    await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <Modal title="Manage Custom Fields" onClose={onClose}>
      <form onSubmit={addField} className="mb-6 flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <Field label="Field Label">
          <input
            className={inputClass}
            placeholder="e.g. EIIN Number"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <Field label="Field Type">
          <select className={inputClass} value={fieldType} onChange={(e) => setFieldType(e.target.value as any)}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
        </Field>
        <button
          type="submit"
          disabled={saving || !label.trim()}
          className="w-full py-2.5 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 bg-[#2196F3] hover:bg-[#1E88E5] text-white shadow-sm shadow-blue-500/20 active:scale-95 disabled:bg-slate-100 dark:disabled:bg-slate-800/80 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border disabled:border-slate-200 dark:disabled:border-slate-700 disabled:shadow-none disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>{saving ? "Adding..." : "Add Field"}</span>
        </button>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Existing Fields
          </h3>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            {fields.length} {fields.length === 1 ? "field" : "fields"}
          </span>
        </div>

        {fields.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            No custom fields yet. Create one above.
          </div>
        ) : (
          <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {fields.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/90 px-3.5 py-2.5 text-sm transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {f.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D47A1] dark:text-[#90CAF9] bg-[#E3F2FD] dark:bg-[#2196F3]/20 border border-[#90CAF9] dark:border-[#2196F3]/30 px-2 py-0.5 rounded-md shrink-0">
                    {f.fieldType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeField(f.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
