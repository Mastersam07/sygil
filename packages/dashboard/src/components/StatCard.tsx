interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, sub, color = "var(--accent-cyan)", icon }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {icon && <span style={{ color: "var(--text-muted)" }}>{icon}</span>}
      </div>
      <p className="text-[22px] font-bold mono tracking-tight" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
