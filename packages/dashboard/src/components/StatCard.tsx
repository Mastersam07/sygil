import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, sub, color = "var(--accent-cyan)", icon }: Props) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>
            System Metric
          </p>
          <p className="text-[12px] mt-2 font-medium leading-5" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
        </div>
        {icon && (
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255, 255, 255, 0.04)", color }}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className="text-[clamp(1.72rem,2.35vw,2.05rem)] font-bold mono tracking-[-0.035em] leading-[1.16] wrap-break-word"
        style={{ color }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[12px] mt-4 leading-6 wrap-break-word" style={{ color: "var(--text-soft)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
