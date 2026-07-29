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
      <form onSubmit={addField} className="mb-5 flex flex-col gap-4">
        {error && <p className="text-sm text-rust-400">{error}</p>}
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
        <Button type="submit" disabled={saving || !label.trim()}>
          {saving ? "Adding…" : "Add Field"}
        </Button>
      </form>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Existing Fields</h3>
        {fields.length === 0 && <p className="text-sm text-slate-500">No custom fields yet.</p>}
        <ul className="flex flex-col gap-2">
          {fields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
            >
              <span>
                {f.label} <span className="text-slate-500">· {f.fieldType}</span>
              </span>
              <button onClick={() => removeField(f.id)} className="text-rust-400 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
