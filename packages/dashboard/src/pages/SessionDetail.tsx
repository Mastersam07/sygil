import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, fmtDate, fmtTime } from "../lib/format";
import { ArrowLeft, User, Bot, Terminal, FileText } from "lucide-react";
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
      <div className="flex justify-center py-2">
        <span className="badge">⚡ Context compacted</span>
      </div>
    );
  }

  if (msg.toolName) {
    return (
      <div className="ml-10 mb-2">
        <div className="card p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={12} style={{ color: "var(--accent-amber)" }} />
            <span className="mono font-medium" style={{ color: "var(--accent-amber)" }}>{msg.toolName}</span>
          </div>
          {msg.toolInput && (
            <pre className="mono text-[11px] mt-1 wrap-break-word whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>
              {msg.toolInput.length > 500 ? msg.toolInput.slice(0, 500) + "..." : msg.toolInput}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (msg.toolResult) {
    return (
      <div className="ml-10 mb-2">
        <div className="card p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-muted)" }}>Result</span>
          </div>
          <pre className="mono text-[11px] whitespace-pre-wrap wrap-break-word" style={{ color: "var(--text-secondary)" }}>
            {msg.toolResult.length > 500 ? msg.toolResult.slice(0, 500) + "..." : msg.toolResult}
          </pre>
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className="flex gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: isUser ? "rgba(0, 200, 255, 0.08)" : "rgba(52, 211, 153, 0.08)" }}
      >
        {isUser
          ? <User size={13} style={{ color: "var(--accent-cyan)" }} />
          : <Bot size={13} style={{ color: "var(--accent-green)" }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium" style={{ color: isUser ? "var(--accent-cyan)" : "var(--accent-green)" }}>
            {isUser ? "You" : "Claude"}
          </span>
          {msg.timestamp && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtTime(msg.timestamp)}</span>}
          {(msg.tokens.input + msg.tokens.output) > 0 && (
            <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>
              {fmtTokens(msg.tokens.input + msg.tokens.output)} tok
            </span>
          )}
        </div>
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word" style={{ color: "var(--text-primary)" }}>
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
      <Link to="/sessions" className="inline-flex items-center gap-1.5 text-[13px] transition-colors" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft size={14} /> Sessions
      </Link>

      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</h2>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          <span className="badge">{m.project}</span>
          {m.branch && <span className="badge">{m.branch}</span>}
          <span className="badge">{fmtDate(m.startedAt)}</span>
          <span className="badge mono">{m.model}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Messages</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>{messages.length}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Input</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(data.totalTokens.input)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Output</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-green)" }}>{fmtTokens(data.totalTokens.output)}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Cost</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p>
        </div>
      </div>

      {tokenTimeline.length > 2 && (
        <div className="card p-5">
          <p className="section-label">Token Timeline</p>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={tokenTimeline}>
              <XAxis dataKey="messageIndex" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="cumulativeTokens" stroke={CHART_COLORS.cyan} fill={CHART_COLORS.cyan} fillOpacity={0.06} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-5">
        <p className="section-label">Conversation</p>
        <div className="space-y-0.5">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </div>
      </div>
    </div>
  );
}
