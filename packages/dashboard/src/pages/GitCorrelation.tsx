import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GitBranch, Sparkles, Coins, CalendarClock } from "lucide-react";

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

  const branches = [...data.branches].sort((a, b) => b.cost - a.cost);

  if (branches.length === 0) {
    return (
      <div className="page-enter space-y-5">
        <section className="card p-6 lg:p-8">
          <p className="eyebrow">Git Correlation</p>
          <h2 className="page-hero-title mt-3">Branch-level patterns will appear once sessions carry git metadata.</h2>
          <p className="page-hero-copy">
            This surface connects branch activity to sessions, token volume, and cost so repository work can be read in context.
          </p>
        </section>
        <EmptyState title="No branch data" message="Branch information comes from your session metadata." icon={<GitBranch size={28} />} />
      </div>
    );
  }

  const chartData = branches.slice(0, 10);
  const totalSessions = branches.reduce((sum, branch) => sum + branch.sessions, 0);
  const totalTokens = branches.reduce((sum, branch) => sum + branch.tokens, 0);
  const totalCost = branches.reduce((sum, branch) => sum + branch.cost, 0);
  const leadingBranch = branches[0];

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Git Correlation</p>
            <h2 className="page-hero-title mt-3">See which branches are attracting the most Claude activity, cost, and sustained attention.</h2>
            <p className="page-hero-copy">
              Use this view to connect branch context to session volume and understand whether effort is concentrated on a few active branches or spread across many workstreams.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <div className="card p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Branch Surface</p>
                <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>{branches.length}</p>
                <p className="text-[12px] mt-3" style={{ color: "var(--text-soft)" }}>Tracked branches with recorded Claude session metadata.</p>
              </div>
              <div className="card p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Total Cost</p>
                <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p>
                <p className="text-[12px] mt-3" style={{ color: "var(--text-soft)" }}>{fmtTokens(totalTokens)} tokens across all branches.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {leadingBranch && (
              <div className="surface-muted p-5">
                <p className="eyebrow">Leading Branch</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[28px] font-bold tracking-[-0.05em] truncate" style={{ color: "var(--text-primary)" }}>
                      {leadingBranch.name}
                    </p>
                    <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                      {fmtCost(leadingBranch.cost)} · {leadingBranch.sessions} sessions
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(110, 231, 183, 0.12)", color: "var(--accent-green)" }}
                  >
                    <Sparkles size={18} />
                  </div>
                </div>
                <div className="mt-5 badge mono">{fmtTokens(leadingBranch.tokens)} tokens</div>
              </div>
            )}

            <div className="surface-muted p-5">
              <p className="eyebrow">Session Coverage</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-blue)" }}>
                {totalSessions}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Total sessions carrying branch metadata across the repository landscape.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Sessions</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>{totalSessions}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Tokens</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(totalTokens)}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Cost</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Leading Branch</p>
          <p className="text-[20px] mt-4 font-bold tracking-[-0.04em] truncate" style={{ color: "var(--text-primary)" }}>{leadingBranch?.name || "—"}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p className="section-label mb-0">Cost per Branch</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              The ten branches with the highest Claude-attributed spend.
            </p>
          </div>
          <div className="badge">
            <Coins size={11} />
            Top 10 branches
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" {...AXIS_STYLE} tickFormatter={v => `$${v.toFixed(0)}`} />
            <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={180} tick={{ fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtCost(v)} />
            <Bar dataKey="cost" fill={CHART_COLORS.green} radius={[0, 8, 8, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_420px] gap-4 items-start">
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

        <div className="card p-5">
          <p className="section-label">Branch Readout</p>
          <div className="space-y-3">
            {branches.slice(0, 6).map(branch => (
              <div key={branch.name} className="surface-muted p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>{branch.name}</p>
                  <span className="text-[12px] mono" style={{ color: "var(--accent-green)" }}>{fmtCost(branch.cost)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
                  <div>
                    <p style={{ color: "var(--text-muted)" }}>Sessions</p>
                    <p className="mt-1" style={{ color: "var(--text-primary)" }}>{branch.sessions}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-muted)" }}>Tokens</p>
                    <p className="mt-1 mono" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(branch.tokens)}</p>
                  </div>
                </div>
                <div className="mt-3 badge">
                  <CalendarClock size={11} />
                  {branch.lastSeen?.slice(0, 10) || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
