interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export default function StatCard({ label, value, sub, color = "var(--accent-cyan)" }: Props) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold mono" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
