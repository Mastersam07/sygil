import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GitBranch } from "lucide-react";

interface BranchStats {
  name: string;
  sessions: number;
  tokens: number;
  cost: number;
  firstSeen: string;
  lastSeen: string;
}

export default function GitCorrelation() {
  const { data, isLoading } = useApi<{ branches: BranchStats[] }>("/analytics/git");
  if (isLoading || !data) return <PageSkeleton />;

  const branches = data.branches;

  if (branches.length === 0) {
    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Git Correlation</h2>
        <EmptyState title="No branch data" message="Branch information comes from your session metadata." icon={<GitBranch size={28} />} />
      </div>
    );
  }

  const chartData = branches.slice(0, 10);

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Git Correlation</h2>
        <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>{branches.length} branches</span>
      </div>

      <div className="card p-5">
        <p className="section-label">Cost per Branch (Top 10)</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...AXIS_STYLE} tickFormatter={v => `$${v.toFixed(0)}`} />
            <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={180} tick={{ fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtCost(v)} />
            <Bar dataKey="cost" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Branch</th>
              <th className="text-right">Sessions</th>
              <th className="text-right">Tokens</th>
              <th className="text-right">Cost</th>
              <th className="text-right">First Seen</th>
              <th className="text-right">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.name}>
                <td>
                  <div className="flex items-center gap-2">
                    <GitBranch size={12} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{b.name}</span>
                  </div>
                </td>
                <td className="text-right mono text-xs" style={{ color: "var(--text-secondary)" }}>{b.sessions}</td>
                <td className="text-right mono text-xs" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(b.tokens)}</td>
                <td className="text-right mono text-xs" style={{ color: "var(--accent-green)" }}>{fmtCost(b.cost)}</td>
                <td className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{b.firstSeen?.slice(0, 10)}</td>
                <td className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{b.lastSeen?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
