import { useState, useRef } from "react";
import PageHeader from "../components/PageHeader";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";

interface ImportPreview { preview: boolean; totalInFile: number; alreadyExists: number; willImport: number; }

export default function ExportImport() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = format === "csv" ? "sygil-export.csv" : "sygil-export.json"; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExporting(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportError(null); setImportPreview(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: text });
      const result = await res.json();
      if (result.error) setImportError(result.error); else setImportPreview(result);
    } catch { setImportError("Invalid file."); }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Export / Import" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2"><FileJson size={16} style={{ color: "var(--accent)" }} /><span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>JSON Export</span></div>
          <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>Full analytics snapshot.</p>
          <button onClick={() => handleExport("json")} disabled={exporting === "json"} className="btn w-full justify-center"><Download size={14} />{exporting === "json" ? "Exporting..." : "Download JSON"}</button>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2"><FileSpreadsheet size={16} style={{ color: "var(--accent-green)" }} /><span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>CSV Export</span></div>
          <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>Session data for spreadsheets.</p>
          <button onClick={() => handleExport("csv")} disabled={exporting === "csv"} className="btn w-full justify-center"><Download size={14} />{exporting === "csv" ? "Exporting..." : "Download CSV"}</button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2"><Upload size={16} style={{ color: "var(--accent-purple)" }} /><span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Import</span></div>
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>Upload a previously exported JSON to preview what would be imported.</p>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="btn"><Upload size={14} />Select JSON file</button>
        {importError && <p className="text-[12px] mt-2" style={{ color: "var(--accent-red)" }}>{importError}</p>}
        {importPreview && (
          <div className="mt-3 p-3 rounded" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text)" }}>Import Preview</p>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div><span style={{ color: "var(--text-muted)" }}>In file:</span> <span style={{ color: "var(--text)" }}>{importPreview.totalInFile}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Exists:</span> <span style={{ color: "var(--text)" }}>{importPreview.alreadyExists}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>New:</span> <span style={{ color: "var(--accent-green)" }}>{importPreview.willImport}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
