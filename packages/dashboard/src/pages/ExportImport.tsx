import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

export default function ExportImport() {
  const [exporting, setExporting] = useState<string | null>(null);

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
    } catch {
      /* ignore */
    }
    setExporting(null);
  };

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Export</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileJson size={20} style={{ color: "var(--accent-cyan)" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>JSON Export</h3>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Full analytics snapshot — sessions, tokens, tools, activity, git, history.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting === "json"}
            className="btn w-full justify-center"
          >
            <Download size={14} />
            {exporting === "json" ? "Exporting..." : "Download JSON"}
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet size={20} style={{ color: "var(--accent-green)" }} />
            <div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>CSV Export</h3>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Session data in spreadsheet format — tokens, costs, models per session.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting === "csv"}
            className="btn w-full justify-center"
          >
            <Download size={14} />
            {exporting === "csv" ? "Exporting..." : "Download CSV"}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Individual session markdown export is available from each session's detail page.
        </p>
      </div>
    </div>
  );
}
