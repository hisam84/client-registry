"use client";
import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useUserSession } from "@/lib/userSession";
import { Button, Input } from "@/components/ui";

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useUserSession();

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarColor, setAvatarColor] = useState("#0b7677");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setDesignation(currentUser.designation || "");
      setPhone(currentUser.phone || "");
      setAvatarColor(currentUser.avatarColor || "#0b7677");
      setAvatarUrl(currentUser.avatarUrl || null);
    }
  }, [currentUser]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image file size should be less than 3MB" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setAvatarUrl(null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const updatedUser = {
      ...currentUser,
      name: name.trim(),
      designation: designation.trim() || null,
      phone: phone.trim() || null,
      avatarColor: avatarColor,
      avatarUrl: avatarUrl,
    };

    try {
      // If it's a persisted employee in database
      if (currentUser.id && currentUser.id !== "super-admin") {
        const res = await fetch(`/api/employees/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            designation: designation.trim() || null,
            phone: phone.trim() || null,
            avatarColor: avatarColor,
            avatarUrl: avatarUrl,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update profile");
        }
      }

      // Update session in localStorage and dispatch change event
      setCurrentUser(updatedUser);
      setMessage({ type: "success", text: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে! (Profile updated successfully)" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidebarLayout
      title="মাই প্রোফাইল (My Profile)"
      subtitle="নিজের প্রোফাইল এডিট ও প্রোফাইল পিকচার পরিবর্তন করুন"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* TOP USER CARD */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-brass-500/40 shadow-md"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-inner border-2 border-brass-500/40"
                style={{ backgroundColor: avatarColor || "#0b7677" }}
              >
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <label
              htmlFor="avatar-file-input"
              className="absolute -bottom-2 -right-2 p-2 bg-brass-500 hover:bg-brass-400 text-slate-950 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Upload Profile Picture"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* User Brief Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentUser.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  currentUser.role === "SUPER_ADMIN"
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {currentUser.role === "SUPER_ADMIN" ? "Super Admin" : "Employee"}
              </span>
            </div>
            <p className="text-xs text-brass-600 dark:text-brass-400 font-semibold truncate">
              {currentUser.designation || "No designation set"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
              {currentUser.email}
            </p>
          </div>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:underline shrink-0"
            >
              ছবি সরান (Remove Photo)
            </button>
          )}
        </div>

        {/* PROFILE EDIT FORM */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-brass-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>নিজের প্রোফাইল এডিট করুন (Edit Personal Info)</span>
          </h3>

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold mb-5 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="নাম (Full Name)*"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ইমেইল এড্রেস (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.email}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="পদবী (Designation)"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="যেমন: Software Engineer"
                />
              </div>

              <div>
                <Input
                  label="মোবাইল নম্বর (Phone)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01700000000"
                />
              </div>
            </div>

            {/* Profile Picture Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                প্রোফাইল পিকচার (Profile Picture Upload)
              </label>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-brass-500/30"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner"
                    style={{ backgroundColor: avatarColor || "#0b7677" }}
                  >
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brass-500 file:text-slate-950 hover:file:bg-brass-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP format supported (Max 3MB).
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Avatar Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                অবতার থিম কালার (Fallback Avatar Theme Color)
              </label>
              <div className="flex items-center gap-3">
                {["#0b7677", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#10b981"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      avatarColor === color ? "scale-125 ring-2 ring-brass-500 ring-offset-2" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow active:scale-95 transition-transform"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সংরক্ষণ করুন (Save Profile)"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
