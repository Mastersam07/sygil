import { useState, useRef, type ChangeEvent } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle, Sparkles, Database } from "lucide-react";

interface ImportPreview {
  preview: boolean;
  totalInFile: number;
  alreadyExists: number;
  willImport: number;
  newSessionIds: string[];
}

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
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "sygil-export.csv" : "sygil-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExporting(null);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportPreview(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) {
        setImportError(result.error);
      } else {
        setImportPreview(result);
      }
    } catch {
      setImportError("Failed to parse file. Make sure it's a valid Sygil JSON export.");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Export & Import</p>
            <h2 className="page-hero-title mt-3">Move analytics snapshots out of Sygil cleanly, and preview inbound data before import.</h2>
            <p className="page-hero-copy">
              Export a JSON analytics snapshot or a CSV session sheet, and inspect imported JSON safely through a preview-only import path before any data is merged.
            </p>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Export Surfaces</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>
                2
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                JSON for richer analytics snapshots, CSV for spreadsheet-oriented session analysis.
              </p>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Import Mode</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>
                Preview
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                The current import flow only previews what would be new. It does not write imported data yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileJson size={20} style={{ color: "var(--accent-cyan)" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>JSON Export</h3>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Full analytics snapshot — sessions, tokens, tools, activity, git, history.
              </p>
            </div>
          </div>
          <button onClick={() => handleExport("json")} disabled={exporting === "json"} className="btn w-full justify-center py-3">
            <Download size={14} />
            {exporting === "json" ? "Exporting..." : "Download JSON"}
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet size={20} style={{ color: "var(--accent-green)" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>CSV Export</h3>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Session data in spreadsheet format — tokens, costs, models per session.
              </p>
            </div>
          </div>
          <button onClick={() => handleExport("csv")} disabled={exporting === "csv"} className="btn w-full justify-center py-3">
            <Download size={14} />
            {exporting === "csv" ? "Exporting..." : "Download CSV"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Upload size={20} style={{ color: "var(--accent-purple)" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Import Preview</h3>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Upload a previously exported JSON snapshot to preview what would be imported.
              </p>
            </div>
          </div>
          <span className="badge">
            <Sparkles size={11} />
            Safe preview
          </span>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
        <button onClick={() => fileRef.current?.click()} className="btn w-full justify-center md:w-auto py-3">
          <Upload size={14} />
          Select JSON file
        </button>

        {importError && (
          <div className="mt-4 p-4 rounded-[18px] text-[13px]" style={{ background: "rgba(239, 68, 68, 0.08)", color: "var(--accent-red)" }}>
            {importError}
          </div>
        )}

        {importPreview && (
          <div className="mt-4 surface-muted p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} style={{ color: "var(--accent-green)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Import Preview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>In file</p>
                <p className="mono font-medium" style={{ color: "var(--text-primary)" }}>{importPreview.totalInFile} sessions</p>
              </div>
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>Already exists</p>
                <p className="mono font-medium" style={{ color: "var(--text-secondary)" }}>{importPreview.alreadyExists}</p>
              </div>
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>New to import</p>
                <p className="mono font-medium" style={{ color: "var(--accent-green)" }}>{importPreview.willImport}</p>
              </div>
            </div>
            {importPreview.willImport === 0 && (
              <p className="text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>
                All sessions in this file already exist locally. Nothing to import.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label mb-0">Related Export Path</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Session markdown export remains available from each individual session detail view.
            </p>
          </div>
          <span className="badge" style={{ color: "var(--accent-cyan)" }}>
            <Database size={11} />
            Session-level export
          </span>
        </div>
      </div>
    </div>
  );
}
