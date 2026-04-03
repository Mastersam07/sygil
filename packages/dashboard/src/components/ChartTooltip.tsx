export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    padding: "8px 12px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
  },
  labelStyle: { color: "var(--text-muted)", fontSize: 11, marginBottom: 4 },
  cursor: { stroke: "var(--border-hover)" },
};

export const AXIS_STYLE = {
  tick: { fill: "var(--text-muted)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};
