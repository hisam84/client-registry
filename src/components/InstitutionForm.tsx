"use client";
import React, { useState, ReactNode } from "react";
import { Button, Field, inputClass, Modal } from "./ui";
import { CATEGORY_OPTIONS, CustomFieldDef, INSTITUTE_TYPE_OPTIONS, Institution } from "@/lib/types";

function toDateInput(v: string | null) {
  if (!v) return "";
  return v.slice(0, 10);
}

const empty = {
  instituteName: "",
  instituteNameBangla: "",
  domain: "",
  category: "Website",
  instituteType: "School",
  issueDate: "",
  expireDate: "",
  actualExpireDate: "",
  student: "",
  condition: "",
  btclUsername: "",
  btclPassword: "",
  btclMobileNo: "",
  btclEmail: "",
  btclEmailPassword: "",
  instituteHead: "",
  contact1: "",
  contact2: "",
  inChargeTeacher: "",
  designation: "",
  inChargeTeacherContact: "",
  subDistrict: "",
  district: "",
  address: "",
};

export function InstitutionForm({
  initial,
  customFieldDefs,
  onClose,
  onSaved,
  onRequestAddField,
}: {
  initial?: Institution | null;
  customFieldDefs: CustomFieldDef[];
  onClose: () => void;
  onSaved: () => void;
  onRequestAddField: () => void;
}) {
  const [form, setForm] = useState<any>(
    initial
      ? {
          ...empty,
          ...initial,
          issueDate: toDateInput(initial.issueDate),
          expireDate: toDateInput(initial.expireDate),
          actualExpireDate: toDateInput(initial.actualExpireDate),
        }
      : empty
  );
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    initial?.customFields ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instituteName.trim()) {
      setError("Institute name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = { ...form, customFields: customValues };
    const isEditing = Boolean(initial && initial.id);
    const url = isEditing ? `/api/institutions/${initial!.id}` : "/api/institutions";
    const method = isEditing ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed.");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const isEditing = Boolean(initial && initial.id);

  return (
    <Modal title={isEditing ? "Edit Institution" : "Add New Institution"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p className="rounded-md border border-rust-500/30 bg-rust-500/10 px-3 py-2 text-sm text-rust-400">
            {error}
          </p>
        )}

        <Section title="Core Information">
          <Field label="Institute Name" full>
            <input
              className={inputClass}
              value={form.instituteName}
              onChange={(e) => set("instituteName", e.target.value)}
              required
            />
          </Field>
          <Field label="Institute Name (Bangla)" full>
            <input
              className={`${inputClass} bn`}
              value={form.instituteNameBangla ?? ""}
              onChange={(e) => set("instituteNameBangla", e.target.value)}
            />
          </Field>
          <Field label="Domain / Website Address">
            <input
              className={`${inputClass} font-mono`}
              placeholder="example.edu.bd"
              value={form.domain ?? ""}
              onChange={(e) => set("domain", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Institute Type">
            <select
              className={inputClass}
              value={form.instituteType}
              onChange={(e) => set("instituteType", e.target.value)}
            >
              {INSTITUTE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Dates">
          <Field label="Issue Date">
            <input type="date" className={inputClass} value={form.issueDate ?? ""} onChange={(e) => set("issueDate", e.target.value)} />
          </Field>
          <Field label="Expire Date">
            <input type="date" className={inputClass} value={form.expireDate ?? ""} onChange={(e) => set("expireDate", e.target.value)} />
          </Field>
          <Field label="Actual Expire Date">
            <input
              type="date"
              className={inputClass}
              value={form.actualExpireDate ?? ""}
              onChange={(e) => set("actualExpireDate", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Status & Notes">
          <Field label="Student">
            <input className={inputClass} value={form.student ?? ""} onChange={(e) => set("student", e.target.value)} />
          </Field>
          <Field label="Condition">
            <input className={inputClass} value={form.condition ?? ""} onChange={(e) => set("condition", e.target.value)} />
          </Field>
        </Section>

        <Section title="BTCL Credentials">
          <Field label="BTCL Username">
            <input className={inputClass} value={form.btclUsername ?? ""} onChange={(e) => set("btclUsername", e.target.value)} />
          </Field>
          <Field label="BTCL Password">
            <input className={inputClass} value={form.btclPassword ?? ""} onChange={(e) => set("btclPassword", e.target.value)} />
          </Field>
          <Field label="BTCL Mobile No">
            <input className={inputClass} value={form.btclMobileNo ?? ""} onChange={(e) => set("btclMobileNo", e.target.value)} />
          </Field>
          <Field label="BTCL E-mail">
            <input className={inputClass} value={form.btclEmail ?? ""} onChange={(e) => set("btclEmail", e.target.value)} />
          </Field>
          <Field label="BTCL E-mail Password">
            <input className={inputClass} value={form.btclEmailPassword ?? ""} onChange={(e) => set("btclEmailPassword", e.target.value)} />
          </Field>
        </Section>

        <Section title="Contacts">
          <Field label="Institute Head">
            <input className={inputClass} value={form.instituteHead ?? ""} onChange={(e) => set("instituteHead", e.target.value)} />
          </Field>
          <Field label="Contact-1">
            <input className={inputClass} value={form.contact1 ?? ""} onChange={(e) => set("contact1", e.target.value)} />
          </Field>
          <Field label="Contact-2">
            <input className={inputClass} value={form.contact2 ?? ""} onChange={(e) => set("contact2", e.target.value)} />
          </Field>
          <Field label="In Charge Teacher">
            <input className={inputClass} value={form.inChargeTeacher ?? ""} onChange={(e) => set("inChargeTeacher", e.target.value)} />
          </Field>
          <Field label="Designation">
            <input className={inputClass} value={form.designation ?? ""} onChange={(e) => set("designation", e.target.value)} />
          </Field>
          <Field label="In Charge Teacher Contact">
            <input
              className={inputClass}
              value={form.inChargeTeacherContact ?? ""}
              onChange={(e) => set("inChargeTeacherContact", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Sub District">
            <input className={inputClass} value={form.subDistrict ?? ""} onChange={(e) => set("subDistrict", e.target.value)} />
          </Field>
          <Field label="District">
            <input className={inputClass} value={form.district ?? ""} onChange={(e) => set("district", e.target.value)} />
          </Field>
          <Field label="Address" full>
            <textarea
              className={inputClass}
              rows={2}
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </Section>

        {customFieldDefs.length > 0 && (
          <Section title="Custom Fields">
            {customFieldDefs.map((f) => (
              <Field key={f.id} label={f.label}>
                <input
                  type={f.fieldType === "date" ? "date" : f.fieldType === "number" ? "number" : "text"}
                  className={inputClass}
                  value={customValues[f.key] ?? ""}
                  onChange={(e) => setCustomValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </Field>
            ))}
          </Section>
        )}

        <button
          type="button"
          onClick={onRequestAddField}
          className="self-start text-sm text-brass-400 hover:text-brass-300 hover:underline"
        >
          + Add a custom field
        </button>

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Institution"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 font-display text-sm text-brass-400">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
