"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Employee, EmployeeRole } from "@/lib/types";
import { Button, Input, Modal } from "@/components/ui";
import { useUserSession } from "@/lib/userSession";

export default function EmployeesPage() {
  const { currentUser } = useUserSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployeeRole>("EMPLOYEE");
  const [orderSerial, setOrderSerial] = useState<number>(1);
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarColor, setAvatarColor] = useState("#0b7677");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees?includeStats=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleOpenModal(emp?: Employee | null) {
    setError("");
    setPassword("");
    if (emp) {
      setEditingEmployee(emp);
      setName(emp.name);
      setEmail(emp.email);
      setRole(emp.role);
      setOrderSerial(emp.orderSerial);
      setDesignation(emp.designation || "");
      setPhone(emp.phone || "");
      setAvatarColor(emp.avatarColor || "#0b7677");
    } else {
      setEditingEmployee(null);
      setName("");
      setEmail("");
      setRole("EMPLOYEE");
      const nextSerial = employees.length > 0 ? Math.max(...employees.map((e) => e.orderSerial || 0)) + 1 : 1;
      setOrderSerial(nextSerial);
      setDesignation("");
      setPhone("");
      setAvatarColor("#0b7677");
    }
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and Email are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        orderSerial: Number(orderSerial) || 1,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
        avatarColor,
      };

      if (password.trim()) {
        payload.password = password.trim();
      } else if (!editingEmployee) {
        payload.password = "124578";
      }

      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save employee");
      }

      setShowModal(false);
      loadEmployees();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Are you sure you want to delete employee "${emp.name}"?`)) return;
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
      if (res.ok) {
        loadEmployees();
      }
    } catch (err) {
      console.error("Failed to delete employee:", err);
    }
  }

  async function handleSerialChange(emp: Employee, newSerial: number) {
    if (isNaN(newSerial) || newSerial <= 0) return;
    try {
      await fetch(`/api/employees/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderSerial: newSerial }),
      });
      loadEmployees();
    } catch (err) {
      console.error("Failed to update order serial:", err);
    }
  }

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.id === "super-admin";

  if (!isSuperAdmin) {
    return (
      <SidebarLayout
        title="Employee & Team Management"
        subtitle="Access Restricted"
      >
        <div className="max-w-xl mx-auto my-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Access Restricted (Super Admin Only)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            General users are not authorized to manage other employees. You can only view and edit your own personal profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/profile">
              <Button className="bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold">
                Go to My Profile →
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      title="Employee & Team Management"
      subtitle="Manage team members, order serials, designations, and task assignments"
      totalCountText={`${employees.length} Active Employees`}
    >
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Employee Order Serial & Team Roster</span>
            <span className="text-xs font-mono bg-brass-500 text-slate-950 px-2 py-0.5 rounded font-bold">
              {employees.length} Members
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Employees will be ordered by their Order Serial number across dropdowns and dashboards. Admin can update order serials anytime.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="px-4 py-2.5 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* Employee List Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading employee list...</div>
      ) : employees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No employees registered yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "+ Add Employee" above to create your first team member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => {
            const stats = emp.taskStats || { total: 0, completed: 0, pending: 0, inProgress: 0 };
            return (
              <div
                key={emp.id}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-brass-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Order Serial Badge & Role */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Order Serial:</span>
                      <input
                        type="number"
                        min="1"
                        defaultValue={emp.orderSerial}
                        onBlur={(e) => handleSerialChange(emp, Number(e.target.value))}
                        className="w-12 text-center text-xs font-mono font-bold py-0.5 rounded border border-brass-500/40 bg-brass-500/10 text-brass-700 dark:text-brass-300 focus:outline-none"
                        title="Click to change order serial number"
                      />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        emp.role === "SUPER_ADMIN"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>{emp.role === "SUPER_ADMIN" ? "Super Admin" : "Employee"}</span>
                    </span>
                  </div>

                  {/* Employee Header Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-12 h-12 rounded-xl object-cover border border-brass-500/30 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0"
                        style={{ backgroundColor: emp.avatarColor || "#0b7677" }}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {emp.name}
                      </h3>
                      {emp.designation && (
                        <p className="text-xs text-brass-600 dark:text-brass-400 font-semibold truncate mt-0.5">
                          {emp.designation}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                        {emp.email}
                      </p>
                      {emp.phone && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{emp.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Employee Task Statistics */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-4">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>Task Statistics</span>
                      <span className="font-mono text-brass-600 dark:text-brass-400">{stats.total} Total</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                        <div>{stats.pending}</div>
                        <div className="font-normal opacity-80 text-[9px]">Pending</div>
                      </div>

                      <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold">
                        <div>{stats.inProgress}</div>
                        <div className="font-normal opacity-80 text-[9px]">In Progress</div>
                      </div>

                      <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                        <div>{stats.completed}</div>
                        <div className="font-normal opacity-80 text-[9px]">Done</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenModal(emp)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Edit Info
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editingEmployee ? "Edit Employee" : "Add New Employee"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Employee Name*"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahim Ahmed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order Serial*
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderSerial}
                  onChange={(e) => setOrderSerial(Number(e.target.value))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <Input
                label="Email Address*"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahim@imperialit.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label={editingEmployee ? "Reset / New Password" : "Password"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingEmployee ? "Leave blank to keep current password" : "Default: 124578"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500 font-medium"
                >
                  <option value="EMPLOYEE">General Employee</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <Input
                  label="Mobile No"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Avatar Theme Color
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

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold">
                {saving ? "Saving..." : editingEmployee ? "Save Changes" : "Create Employee"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </SidebarLayout>
  );
}
