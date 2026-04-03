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
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>
            System Metric
          </p>
          <p className="text-[12px] mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
        </div>
        {icon && (
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255, 255, 255, 0.04)", color }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="text-[30px] font-bold mono tracking-[-0.05em] leading-none mt-1" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-[12px] mt-3 leading-relaxed" style={{ color: "var(--text-soft)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
