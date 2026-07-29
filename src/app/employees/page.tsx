"use client";
import { useEffect, useState } from "react";
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
    if (emp) {
      setEditingEmployee(emp);
      setName(emp.name);
      setEmail(emp.email);
      setPassword(emp.password || "");
      setRole(emp.role);
      setOrderSerial(emp.orderSerial);
      setDesignation(emp.designation || "");
      setPhone(emp.phone || "");
      setAvatarColor(emp.avatarColor || "#0b7677");
    } else {
      setEditingEmployee(null);
      setName("");
      setEmail("");
      setPassword("124578");
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
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || "124578",
        role,
        orderSerial: Number(orderSerial) || 1,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
        avatarColor,
      };

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
            <span>👥 Employee Order Serial & Team Roster</span>
            <span className="text-xs font-mono bg-brass-500 text-slate-950 px-2 py-0.5 rounded font-bold">
              {employees.length} Members
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            ইমপ্লয়ীদের অর্ডার সিরিয়াল (Order Serial) অনুযায়ী ড্রপডাউন এবং ড্যাশবোর্ডে সাজানো থাকবে। এডমিন যেকোনো সময় সিরিয়াল পরিবর্তন করতে পারবেন।
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="px-4 py-2.5 bg-brass-500 hover:bg-brass-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Add Employee (ইমপ্লয়ী যোগ করুন)</span>
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
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        emp.role === "SUPER_ADMIN"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {emp.role === "SUPER_ADMIN" ? "🛡️ Super Admin" : "👤 Employee"}
                    </span>
                  </div>

                  {/* Employee Header Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0"
                      style={{ backgroundColor: emp.avatarColor || "#0b7677" }}
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </div>

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
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          📞 {emp.phone}
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
          title={editingEmployee ? "Edit Employee (ইমপ্লয়ী এডিট)" : "Add New Employee (নতুন ইমপ্লয়ী)"}
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
                  Order Serial (ক্রম নম্বর)*
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
                  label="Password (পাসওয়ার্ড)"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Default: 124578"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role (ভূমিকা)
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
                  label="Designation (পদবী)"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <Input
                  label="Mobile No (ফোন নম্বর)"
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
