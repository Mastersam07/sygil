import { type ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  sub?: ReactNode | string;
  color?: string;
}

export default function StatCard({ label, value, sub, color }: Props) {
  return (
    <div className="card p-6 flex flex-col justify-center min-h-[120px]">
      <p className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-[28px] font-bold tracking-tight" style={{ color: color || "var(--text)" }}>{value}</p>
      {sub && <p className="text-[12px] mt-1 opacity-80" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}
