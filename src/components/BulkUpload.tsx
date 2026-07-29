"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Modal } from "./ui";

const templateHeaders = [
  "instituteName", "instituteNameBangla", "domain", "category", "instituteType", 
  "issueDate", "expireDate", "actualExpireDate", "student", "condition", 
  "btclUsername", "btclPassword", "btclMobileNo", "btclEmail", "btclEmailPassword", 
  "instituteHead", "contact1", "contact2", "inChargeTeacher", "designation", 
  "inChargeTeacherContact", "subDistrict", "district", "address"
];

export function BulkUpload({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Create an empty worksheet with just the headers
    const ws = XLSX.utils.aoa_to_sheet([
      templateHeaders,
      // Add a dummy row to guide the user (optional)
      ["Example High School", "", "example.edu.bd", "Website", "School", "2023-01-15", "2024-01-15", "", "500", "Good", "", "", "", "", "", "Mr. Headmaster", "017XXXXXXXX", "", "", "", "", "Sadar", "Dhaka", "123 School Road"]
    ]);
    
    // Set column widths for better readability
    ws['!cols'] = templateHeaders.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    
    // Download the file
    XLSX.writeFile(wb, "Institution_Bulk_Upload_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert sheet to JSON using headers from the first row
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (data.length === 0) {
          throw new Error("The uploaded file is empty.");
        }

        // Format dates correctly before sending to the server
        const formattedData = data.map((row: any) => {
          const newRow = { ...row };
          // List of fields that might be Date objects from XLSX
          ["issueDate", "expireDate", "actualExpireDate"].forEach(dateField => {
            if (newRow[dateField] instanceof Date) {
              // Convert Date object to YYYY-MM-DD string format to avoid timezone shifts
              newRow[dateField] = newRow[dateField].toISOString().split('T')[0];
            } else if (typeof newRow[dateField] === "number") {
              // Sometimes Excel dates are numbers (serial dates)
              // XLSX.read with cellDates:true should handle this, but just in case
            }
          });
          return newRow;
        });

        // Send to API
        const res = await fetch("/api/institutions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || "Failed to upload institutions.");
        }

        setSuccessMsg(`Successfully imported ${resData.count} institutions!`);
        
        // Let the user see the success message before closing
        setTimeout(() => {
          onSaved();
        }, 1500);

      } catch (err: any) {
        setError(err.message || "An error occurred while parsing the file.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the file.");
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <Modal title="Bulk Upload Institutions" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="text-slate-300 text-sm">
          <p className="mb-2">Upload multiple institutions at once using an Excel (.xlsx) file.</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-400">
            <li>Download the template file.</li>
            <li>Fill in your institution data (do not change the column names in the first row).</li>
            <li>For dates, use the format <strong>YYYY-MM-DD</strong>.</li>
            <li>Upload the completed file below.</li>
          </ol>
        </div>

        {error && (
          <div className="rounded-md border border-rust-500/30 bg-rust-500/10 px-3 py-2 text-sm text-rust-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
            {successMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center border-t border-slate-800 pt-6 mt-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
            Download Template
          </Button>
          
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              ref={fileInputRef}
              disabled={loading}
            />
            <Button className="w-full sm:w-auto pointer-events-none" disabled={loading}>
              {loading ? "Uploading..." : "Select File & Upload"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
