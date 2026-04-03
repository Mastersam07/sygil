import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, fmtDate, fmtTime } from "../lib/format";
import { ArrowLeft, User, Bot, Terminal, FileText, Download, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "../lib/colors";

interface Message {
  role: string;
  type: string;
  content: string;
  tokens: { input: number; output: number };
  cost: number;
  timestamp: string;
  toolName?: string;
  toolInput?: string;
  toolResult?: string;
  isCompaction?: boolean;
}

interface Detail {
  metadata: { id: string; title: string; project: string; branch: string | null; startedAt: string; model: string; badges: string[] };
  messages: Message[];
  totalTokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  totalCost: number;
  tokenTimeline: { messageIndex: number; cumulativeTokens: number; cumulativeCost: number }[];
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.isCompaction) {
    return (
      <div className="flex justify-center py-3">
        <span className="badge">
          <Sparkles size={11} />
          Context compacted
        </span>
      </div>
    );
  }

  if (msg.toolName) {
    return (
      <div className="surface-muted p-4 rounded-[18px] border-l-2" style={{ borderLeftColor: "var(--accent-amber)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={13} style={{ color: "var(--accent-amber)" }} />
          <span className="mono font-semibold text-[12px]" style={{ color: "var(--accent-amber)" }}>{msg.toolName}</span>
        </div>
        {msg.toolInput && (
          <pre className="mono text-[11px] whitespace-pre-wrap leading-6" style={{ color: "var(--text-muted)" }}>
            {msg.toolInput.length > 900 ? msg.toolInput.slice(0, 900) + "..." : msg.toolInput}
          </pre>
        )}
      </div>
    );
  }

  if (msg.toolResult) {
    return (
      <div className="surface-muted p-4 rounded-[18px] border-l-2" style={{ borderLeftColor: "var(--accent-blue)" }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={13} style={{ color: "var(--accent-blue)" }} />
          <span className="font-semibold text-[12px]" style={{ color: "var(--accent-blue)" }}>Tool Result</span>
        </div>
        <pre className="mono text-[11px] whitespace-pre-wrap leading-6" style={{ color: "var(--text-secondary)" }}>
          {msg.toolResult.length > 900 ? msg.toolResult.slice(0, 900) + "..." : msg.toolResult}
        </pre>
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className="flex gap-4">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: isUser ? "rgba(88, 214, 255, 0.12)" : "rgba(110, 231, 183, 0.12)" }}
      >
        {isUser
          ? <User size={15} style={{ color: "var(--accent-cyan)" }} />
          : <Bot size={15} style={{ color: "var(--accent-green)" }} />
        }
      </div>
      <div
        className="flex-1 rounded-[22px] border p-4 lg:p-5"
        style={{
          background: isUser ? "rgba(88, 214, 255, 0.05)" : "rgba(255, 255, 255, 0.025)",
          borderColor: isUser ? "rgba(88, 214, 255, 0.14)" : "rgba(132, 162, 202, 0.12)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold" style={{ color: isUser ? "var(--accent-cyan)" : "var(--accent-green)" }}>
            {isUser ? "You" : "Claude"}
          </span>
          {msg.timestamp && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtDate(msg.timestamp)} · {fmtTime(msg.timestamp)}</span>}
          {(msg.tokens.input + msg.tokens.output) > 0 && (
            <span className="badge mono">{fmtTokens(msg.tokens.input + msg.tokens.output)} tok</span>
          )}
          {msg.cost > 0 && (
            <span className="badge mono" style={{ color: "var(--accent-green)" }}>{fmtCost(msg.cost)}</span>
          )}
        </div>
        <div className="text-[14px] leading-7 whitespace-pre-wrap wrap-break-word" style={{ color: "var(--text-primary)" }}>
          {msg.content.length > 2600 ? msg.content.slice(0, 2600) + "\n\n[truncated]" : msg.content}
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
  const totalTokens = data.totalTokens.input + data.totalTokens.output + data.totalTokens.cacheCreation + data.totalTokens.cacheRead;

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/sessions" className="badge" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={12} /> Back to sessions
        </Link>
        <a href={`/api/export/session/${m.id}/markdown`} className="btn">
          <Download size={14} />
          Export markdown
        </a>
      </div>

      <section className="card p-6 lg:p-8">
        <p className="eyebrow">Session Analysis</p>
        <h2 className="page-hero-title mt-3">{m.title}</h2>
        <p className="page-hero-copy">
          Review conversation flow, message economics, and tool activity for this session in a single investigative view.
        </p>

        <div className="flex flex-wrap gap-2 mt-5">
          <span className="badge">{m.project}</span>
          {m.branch && <span className="badge">{m.branch}</span>}
          <span className="badge">{fmtDate(m.startedAt)}</span>
          <span className="badge mono">{m.model}</span>
          {m.badges.map(badge => <span key={badge} className="badge">{badge}</span>)}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
          <div className="surface-muted p-4">
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Messages</p>
            <p className="text-[24px] font-bold mono tracking-[-0.05em] mt-2" style={{ color: "var(--text-primary)" }}>{messages.length}</p>
          </div>
          <div className="surface-muted p-4">
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Input</p>
            <p className="text-[24px] font-bold mono tracking-[-0.05em] mt-2" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(data.totalTokens.input)}</p>
          </div>
          <div className="surface-muted p-4">
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Output</p>
            <p className="text-[24px] font-bold mono tracking-[-0.05em] mt-2" style={{ color: "var(--accent-green)" }}>{fmtTokens(data.totalTokens.output)}</p>
          </div>
          <div className="surface-muted p-4">
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Total Cost</p>
            <p className="text-[24px] font-bold mono tracking-[-0.05em] mt-2" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_380px] gap-4 items-start">
        <div className="card p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="section-label mb-0">Conversation</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Transcript, tool calls, and compaction events in execution order.
              </p>
            </div>
            <span className="badge mono">{fmtTokens(totalTokens)} total tok</span>
          </div>

          <div className="space-y-4">
            {messages.map((msg, index) => <MessageBubble key={index} msg={msg} />)}
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24">
          <div className="card p-5">
            <p className="section-label">Session Telemetry</p>
            {tokenTimeline.length > 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={tokenTimeline}>
                  <defs>
                    <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="messageIndex" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="cumulativeTokens" stroke={CHART_COLORS.cyan} fill="url(#sessionGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Not enough message points to render a timeline.</p>
            )}
          </div>

          <div className="card p-5">
            <p className="section-label">Quick Read</p>
            <div className="space-y-3 text-[13px]">
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>Project</p>
                <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>{m.project}</p>
              </div>
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>Model</p>
                <p className="mt-1 font-medium mono" style={{ color: "var(--text-primary)" }}>{m.model}</p>
              </div>
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>Started</p>
                <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>{fmtDate(m.startedAt)} · {fmtTime(m.startedAt)}</p>
              </div>
              <div className="surface-muted p-3">
                <p style={{ color: "var(--text-muted)" }}>Badges</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.badges.length > 0 ? m.badges.map(badge => <span key={badge} className="badge">{badge}</span>) : <span className="badge">standard</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
