import * as XLSX from "xlsx";
import { computeStatus, CustomFieldDef, Institution, STATUS_LABEL } from "./types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function exportInstitutionsToExcel(
  institutions: Institution[],
  customFieldDefs: CustomFieldDef[],
  filename: string
) {
  const rows = institutions.map((inst, index) => {
    const status = computeStatus(inst.expireDate);
    const rowObj: Record<string, any> = {
      "SL #": index + 1,
      "Institute Name": inst.instituteName || "",
      "Institute Name (Bangla)": inst.instituteNameBangla || "",
      "Domain / Website": inst.domain || "",
      "Category": inst.category || "",
      "Institute Type": inst.instituteType || "",
      "Issue Date": formatDate(inst.issueDate),
      "Expire Date": formatDate(inst.expireDate),
      "Actual Expire Date": formatDate(inst.actualExpireDate),
      "Status": STATUS_LABEL[status] || "",
      "Student": inst.student || "",
      "Condition": inst.condition || "",
      "Institute Head": inst.instituteHead || "",
      "Contact-1": inst.contact1 || "",
      "Contact-2": inst.contact2 || "",
      "In Charge Teacher": inst.inChargeTeacher || "",
      "Designation": inst.designation || "",
      "In Charge Teacher Contact": inst.inChargeTeacherContact || "",
      "Sub District": inst.subDistrict || "",
      "District": inst.district || "",
      "Address": inst.address || "",
      "BTCL Username": inst.btclUsername || "",
      "BTCL Password": inst.btclPassword || "",
      "BTCL Mobile No": inst.btclMobileNo || "",
      "BTCL E-mail": inst.btclEmail || "",
      "BTCL E-mail Password": inst.btclEmailPassword || "",
    };

    // Add custom fields
    if (customFieldDefs && customFieldDefs.length > 0) {
      customFieldDefs.forEach((field) => {
        const val = inst.customFields?.[field.key] || "";
        rowObj[field.label] = field.fieldType === "date" ? formatDate(val) : val;
      });
    }

    return rowObj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    ws["!cols"] = keys.map((key) => {
      let maxLen = key.length;
      rows.forEach((row) => {
        const val = String(row[key] || "");
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Institutions");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
