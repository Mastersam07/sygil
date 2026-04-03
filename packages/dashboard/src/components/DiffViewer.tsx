interface DiffLine {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

interface Props {
  lines: DiffLine[];
  maxLines?: number;
}

export default function DiffViewer({ lines, maxLines = 200 }: Props) {
  const visible = lines.slice(0, maxLines);

  return (
    <div className="overflow-x-auto text-[12px] mono leading-6 rounded-b-[18px]" style={{ background: "rgba(5, 14, 24, 0.76)" }}>
      {visible.map((line, i) => {
        const bg =
          line.type === "add" ? "rgba(52, 211, 153, 0.08)"
          : line.type === "remove" ? "rgba(239, 68, 68, 0.08)"
          : "rgba(255, 255, 255, 0.01)";
        const marker =
          line.type === "add" ? "+"
          : line.type === "remove" ? "−"
          : " ";
        const markerColor =
          line.type === "add" ? "var(--accent-green)"
          : line.type === "remove" ? "var(--accent-red)"
          : "var(--text-muted)";
        const textColor =
          line.type === "context" ? "var(--text-muted)" : "var(--text-primary)";

        return (
          <div
            key={i}
            className="grid grid-cols-[64px_28px_minmax(0,1fr)]"
            style={{ background: bg, borderBottom: "1px solid rgba(132, 162, 202, 0.05)" }}
          >
            <span
              className="shrink-0 text-right pr-3 py-1.5 select-none border-r"
              style={{ color: "var(--text-muted)", borderColor: "rgba(132, 162, 202, 0.08)" }}
            >
              {line.lineNumber}
            </span>
            <span
              className="shrink-0 text-center py-1.5 select-none"
              style={{ color: markerColor }}
            >
              {marker}
            </span>
            <span className="flex-1 whitespace-pre wrap-break-word py-1.5 pr-4" style={{ color: textColor }}>
              {line.content}
            </span>
          </div>
        );
      })}
      {lines.length > maxLines && (
        <div className="py-2 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          ... {lines.length - maxLines} more lines
        </div>
      )}
    </div>
  );
}
