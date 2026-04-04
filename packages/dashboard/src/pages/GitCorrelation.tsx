import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GitBranch } from "lucide-react";

interface BranchStats { name: string; sessions: number; tokens: number; cost: number; firstSeen: string; lastSeen: string; }

export default function GitCorrelation() {
  const { data, isLoading } = useApi<{ branches: BranchStats[] }>("/analytics/git");
  if (isLoading || !data) return <PageSkeleton />;
  if (data.branches.length === 0) return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Git" />
      <EmptyState title="No branch data" message="Branch info comes from session metadata." icon={<GitBranch size={24} />} />
    </div>
  );

  return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Git" />
      <div className="card p-6">
        <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Cost per Branch (Top 10)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.branches.slice(0, 10)} layout="vertical">
            <XAxis type="number" {...AXIS_STYLE} tickFormatter={v => `$${v.toFixed(0)}`} />
            <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={160} tick={{ fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtCost(v)} />
            <Bar dataKey="cost" fill={CHART_COLORS.green} radius={[0, 3, 3, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Branch</th><th className="text-right">Sessions</th><th className="text-right">Tokens</th><th className="text-right">Cost</th><th className="text-right">First Seen</th><th className="text-right">Last Seen</th></tr></thead>
          <tbody>
            {data.branches.map(b => (
              <tr key={b.name}>
                <td><div className="flex items-center gap-1.5"><GitBranch size={11} style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text)" }}>{b.name}</span></div></td>
                <td className="text-right" style={{ color: "var(--text-secondary)" }}>{b.sessions}</td>
                <td className="text-right" style={{ color: "var(--accent-blue)" }}>{fmtTokens(b.tokens)}</td>
                <td className="text-right" style={{ color: "var(--accent-green)" }}>{fmtCost(b.cost)}</td>
                <td className="text-right" style={{ color: "var(--text-muted)" }}>{b.firstSeen?.slice(0, 10)}</td>
                <td className="text-right" style={{ color: "var(--text-muted)" }}>{b.lastSeen?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
