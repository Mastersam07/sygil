interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export default function StatCard({ label, value, sub, color }: Props) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: color || "var(--text)" }}>{value}</p>
      {sub && <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}
