export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 12,
    padding: "6px 10px",
  },
  labelStyle: { color: "var(--text-muted)", fontSize: 11 },
};

export const AXIS_STYLE = {
  tick: { fill: "var(--text-muted)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};
