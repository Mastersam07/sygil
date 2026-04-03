import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, fmtDate, fmtTime } from "../lib/format";
import { ArrowLeft, User, Bot, Terminal, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "../lib/colors";

interface Message { role: string; type: string; content: string; tokens: { input: number; output: number }; cost: number; timestamp: string; toolName?: string; toolInput?: string; toolResult?: string; isCompaction?: boolean; }
interface Detail { metadata: { id: string; title: string; project: string; branch: string | null; startedAt: string; model: string; badges: string[] }; messages: Message[]; totalTokens: { input: number; output: number; cacheCreation: number; cacheRead: number }; totalCost: number; tokenTimeline: { messageIndex: number; cumulativeTokens: number; cumulativeCost: number }[]; }

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.isCompaction) return <div className="text-center py-2"><span className="badge">⚡ context compacted</span></div>;

  if (msg.toolName) return (
    <div className="ml-8 mb-2 card p-3 text-xs border-l-2" style={{ borderLeftColor: "var(--accent-amber)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Terminal size={12} style={{ color: "var(--accent-amber)" }} />
        <span className="font-bold" style={{ color: "var(--accent-amber)" }}>{msg.toolName}</span>
      </div>
      {msg.toolInput && <pre className="text-[11px] whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{msg.toolInput.length > 500 ? msg.toolInput.slice(0, 500) + "..." : msg.toolInput}</pre>}
    </div>
  );

  if (msg.toolResult) return (
    <div className="ml-8 mb-2 card p-3 text-xs">
      <div className="flex items-center gap-2 mb-1"><FileText size={12} style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text-muted)" }}>result</span></div>
      <pre className="text-[11px] whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{msg.toolResult.length > 500 ? msg.toolResult.slice(0, 500) + "..." : msg.toolResult}</pre>
    </div>
  );

  const isUser = msg.role === "user";
  return (
    <div className="flex gap-3 mb-3">
      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--bg-hover)" }}>
        {isUser ? <User size={12} style={{ color: "var(--accent-blue)" }} /> : <Bot size={12} style={{ color: "var(--accent-green)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 text-[11px]">
          <span className="font-bold" style={{ color: isUser ? "var(--accent-blue)" : "var(--accent-green)" }}>{isUser ? "you" : "claude"}</span>
          {msg.timestamp && <span style={{ color: "var(--text-muted)" }}>{fmtTime(msg.timestamp)}</span>}
          {(msg.tokens.input + msg.tokens.output) > 0 && <span style={{ color: "var(--text-muted)" }}>{fmtTokens(msg.tokens.input + msg.tokens.output)} tok</span>}
        </div>
        <div className="text-[13px] whitespace-pre-wrap wrap-break-word" style={{ color: "var(--text)" }}>
          {msg.content.length > 2000 ? msg.content.slice(0, 2000) + "\n\n[truncated]" : msg.content}
        </div>
      </div>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useApi<Detail>(id ? `/sessions/${id}` : null);
  if (isLoading || !data) return <PageSkeleton />;
  const { metadata: m, messages, totalCost, tokenTimeline } = data;

  return (
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/sessions" className="text-[13px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}><ArrowLeft size={14} /> sessions</Link>
        <a href={`/api/export/session/${m.id}/markdown`} className="btn text-[11px]">export md</a>
      </div>

      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{m.title}</h2>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="badge">{m.project}</span>
          {m.branch && <span className="badge">{m.branch}</span>}
          <span className="badge">{fmtDate(m.startedAt)}</span>
          <span className="badge">{m.model}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3"><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>messages</p><p className="text-lg font-bold">{messages.length}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>input</p><p className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>{fmtTokens(data.totalTokens.input)}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>output</p><p className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>{fmtTokens(data.totalTokens.output)}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>cost</p><p className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p></div>
      </div>

      {tokenTimeline.length > 2 && (
        <div className="card p-4">
          <p className="section-label">token timeline</p>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={tokenTimeline}>
              <XAxis dataKey="messageIndex" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="cumulativeTokens" stroke={CHART_COLORS.cyan} fill={CHART_COLORS.cyan} fillOpacity={0.08} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-4">
        <p className="section-label">conversation</p>
        <div className="space-y-0.5">{messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}</div>
      </div>
    </div>
  );
}
