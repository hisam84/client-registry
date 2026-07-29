"use client";
import { useState } from "react";
import { Button, inputClass, Modal } from "./ui";

export function DeleteAllModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    if (!password || !email) {
      setError("Password and Admin Email are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!password || !otp) {
      setError("Password and OTP are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/institutions/delete-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      onDeleted();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Delete All Institutions" onClose={onClose}>
      <p className="mb-6 text-sm text-slate-400">
        This action will permanently delete all records. This cannot be undone. You must verify your identity to proceed.
      </p>

      {error && <div className="mb-4 rounded bg-red-950 p-3 text-sm text-red-400 border border-red-900">{error}</div>}

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Site Password</label>
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={step === "otp"}
          placeholder="Enter current site password"
        />
      </div>

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Admin Email</label>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step === "otp"}
          placeholder="Enter admin email address"
        />
      </div>

      {step === "otp" && (
        <div className="mb-6 flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-400">OTP (Sent to Admin Email)</label>
          <input
            type="text"
            className={inputClass}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
          />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {step === "password" ? (
          <Button variant="danger" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        ) : (
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Confirm Delete All"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
