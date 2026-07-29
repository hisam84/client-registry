export const CATEGORY_OPTIONS = ["Website", "Software"] as const;

export const INSTITUTE_TYPE_OPTIONS = [
  "School",
  "College",
  "Madrasah",
  "University",
  "Polytechnic",
  "Kindergarten",
  "Other",
] as const;

export type StatusKey = "active" | "expiring_soon" | "expired" | "unknown";

export const STATUS_LABEL: Record<StatusKey, string> = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  unknown: "No Expiry Set",
};

export const STATUS_COLOR: Record<StatusKey, string> = {
  active: "bg-moss-500/15 text-moss-400 border-moss-500/30",
  expiring_soon: "bg-amberflag-500/15 text-amberflag-500 border-amberflag-500/30",
  expired: "bg-rust-500/15 text-rust-400 border-rust-500/30",
  unknown: "bg-slate-700/40 text-slate-400 border-slate-600/40",
};

export function computeStatus(expireDate: string | Date | null, thresholdDays = 30): StatusKey {
  if (!expireDate) return "unknown";
  const exp = new Date(expireDate);
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= thresholdDays) return "expiring_soon";
  return "active";
}

// Default fields shown as columns; everything else lives behind "Details".
export const DEFAULT_VISIBLE_FIELDS = [
  "instituteName",
  "domain",
  "issueDate",
  "expireDate",
  "status",
] as const;

export const FIELD_LABELS: Record<string, string> = {
  instituteName: "Institute Name",
  instituteNameBangla: "Institute Name (Bangla)",
  domain: "Domain",
  category: "Category",
  instituteType: "Institute Type",
  issueDate: "Issue Date",
  expireDate: "Expire Date",
  actualExpireDate: "Actual Expire Date",
  student: "Student",
  condition: "Condition",
  btclUsername: "BTCL Username",
  btclPassword: "BTCL Password",
  btclMobileNo: "BTCL Mobile No",
  btclEmail: "BTCL E-mail",
  btclEmailPassword: "BTCL E-mail Password",
  instituteHead: "Institute Head",
  contact1: "Contact-1",
  contact2: "Contact-2",
  inChargeTeacher: "In Charge Teacher",
  designation: "Designation",
  inChargeTeacherContact: "In Charge Teacher Contact",
  subDistrict: "Sub District",
  district: "District",
  address: "Address",
};

export const DETAIL_FIELD_ORDER = [
  "instituteNameBangla",
  "category",
  "instituteType",
  "actualExpireDate",
  "student",
  "condition",
  "instituteHead",
  "contact1",
  "contact2",
  "inChargeTeacher",
  "designation",
  "inChargeTeacherContact",
  "subDistrict",
  "district",
  "address",
  "btclUsername",
  "btclPassword",
  "btclMobileNo",
  "btclEmail",
  "btclEmailPassword",
];

export interface CustomFieldDef {
  id: string;
  key: string;
  label: string;
  fieldType: "text" | "number" | "date";
}

export interface Institution {
  id: string;
  instituteName: string;
  instituteNameBangla: string | null;
  domain: string | null;
  category: string;
  instituteType: string;
  issueDate: string | null;
  expireDate: string | null;
  actualExpireDate: string | null;
  student: string | null;
  condition: string | null;
  btclUsername: string | null;
  btclPassword: string | null;
  btclMobileNo: string | null;
  btclEmail: string | null;
  btclEmailPassword: string | null;
  instituteHead: string | null;
  contact1: string | null;
  contact2: string | null;
  inChargeTeacher: string | null;
  designation: string | null;
  inChargeTeacherContact: string | null;
  subDistrict: string | null;
  district: string | null;
  address: string | null;
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TargetedPriority = "High" | "Default" | "Low";

export const TARGETED_PRIORITY_OPTIONS: TargetedPriority[] = ["High", "Default", "Low"];

export const TARGETED_PRIORITY_COLOR: Record<TargetedPriority, string> = {
  High: "bg-rust-500/15 text-rust-400 border-rust-500/30",
  Default: "bg-brass-500/15 text-brass-400 border-brass-500/30",
  Low: "bg-slate-700/40 text-slate-400 border-slate-600/40",
};

export interface TargetedClient {
  id: string;
  instituteName: string;
  instituteNameBangla: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  district: string | null;
  subDistrict: string | null;
  address: string | null;
  priority: TargetedPriority;
  isArchived: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";
export type TaskPriority = "High" | "Medium" | "Low";

export const TASK_STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed", "Cancelled"];
export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  Pending: "bg-amberflag-500/15 text-amberflag-500 border-amberflag-500/30",
  "In Progress": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Completed: "bg-moss-500/15 text-moss-400 border-moss-500/30",
  Cancelled: "bg-slate-700/40 text-slate-400 border-slate-600/40",
};

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
  High: "bg-rust-500/15 text-rust-400 border-rust-500/30",
  Medium: "bg-brass-500/15 text-brass-400 border-brass-500/30",
  Low: "bg-slate-700/40 text-slate-400 border-slate-600/40",
};

export type EmployeeRole = "SUPER_ADMIN" | "EMPLOYEE";

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  role: EmployeeRole;
  orderSerial: number;
  designation?: string | null;
  phone?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  taskStats?: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  completionNote?: string | null;
  progress?: number;
  institutionId: string | null;
  institutionName: string | null;
  institution?: {
    id: string;
    instituteName: string;
  } | null;
  assignedToId?: string | null;
  assignedTo?: Employee | null;
  assignedById?: string | null;
  assignedBy?: Employee | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
