"use client";
import { ReactNode, useEffect } from "react";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
  loading,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-[#2196F3] hover:bg-[#1E88E5] text-white font-semibold shadow-sm shadow-blue-500/20 active:scale-95",
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-[#E3F2FD] dark:hover:bg-slate-800 hover:text-[#0D47A1] dark:hover:text-white",
    danger: "bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20",
    outline: "border border-[#90CAF9] dark:border-slate-700 text-[#0D47A1] dark:text-[#E3F2FD] hover:bg-[#E3F2FD]/60 dark:hover:bg-slate-800 bg-white dark:bg-slate-900/50 shadow-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-[#90CAF9] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-[#0D47A1] dark:text-[#E3F2FD] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/30 focus:outline-none transition-colors";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${inputClass} ${className}`}
      />
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 py-10 backdrop-blur-sm">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-[#90CAF9] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-[#E3F2FD] dark:border-slate-800 px-5 py-4 bg-[#E3F2FD]/30 dark:bg-slate-900/50 rounded-t-xl">
          <h2 className="font-display text-lg font-bold text-[#0D47A1] dark:text-[#E3F2FD]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
