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
    <div className="overflow-x-auto text-[12px] mono leading-5">
      {visible.map((line, i) => {
        const bg =
          line.type === "add" ? "rgba(52, 211, 153, 0.08)"
          : line.type === "remove" ? "rgba(239, 68, 68, 0.08)"
          : "transparent";
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
            className="flex"
            style={{ background: bg }}
          >
            <span
              className="w-10 shrink-0 text-right pr-2 select-none"
              style={{ color: "var(--text-muted)" }}
            >
              {line.lineNumber}
            </span>
            <span
              className="w-4 shrink-0 text-center select-none"
              style={{ color: markerColor }}
            >
              {marker}
            </span>
            <span className="flex-1 whitespace-pre wrap-break-word" style={{ color: textColor }}>
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
