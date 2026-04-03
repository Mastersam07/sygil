import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { fmtTokens, fmtCost, fmtDate, fmtTime } from "../lib/format";
import { ArrowLeft, Terminal, FileText, User, Bot } from "lucide-react";
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
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
          ⚡ Context compacted
        </span>
      </div>
    );
  }

  if (msg.toolName) {
    return (
      <div className="ml-10 mb-3">
        <div className="rounded-lg p-3 border text-xs" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={12} style={{ color: "var(--accent-amber)" }} />
            <span className="mono font-medium" style={{ color: "var(--accent-amber)" }}>{msg.toolName}</span>
          </div>
          {msg.toolInput && (
            <pre className="mono text-xs mt-1 whitespace-pre-wrap break-all" style={{ color: "var(--text-muted)" }}>
              {msg.toolInput.length > 500 ? msg.toolInput.slice(0, 500) + "..." : msg.toolInput}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (msg.toolResult) {
    return (
      <div className="ml-10 mb-3">
        <div className="rounded-lg p-3 border text-xs" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-muted)" }}>Result</span>
          </div>
          <pre className="mono whitespace-pre-wrap break-all" style={{ color: "var(--text-secondary)" }}>
            {msg.toolResult.length > 500 ? msg.toolResult.slice(0, 500) + "..." : msg.toolResult}
          </pre>
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: isUser ? "var(--accent-cyan)" : "var(--accent-green)", opacity: 0.15 }}>
        {isUser ? <User size={14} style={{ color: "var(--accent-cyan)" }} /> : <Bot size={14} style={{ color: "var(--accent-green)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: isUser ? "var(--accent-cyan)" : "var(--accent-green)" }}>
            {isUser ? "You" : "Claude"}
          </span>
          {msg.timestamp && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtTime(msg.timestamp)}</span>}
          <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
            {fmtTokens(msg.tokens.input + msg.tokens.output)} tokens
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap wrap-break-word" style={{ color: "var(--text-primary)" }}>
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
    <div className="space-y-4">
      <Link to="/sessions" className="inline-flex items-center gap-1 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft size={14} /> Back to sessions
      </Link>

      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{m.title}</h2>
        <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{m.project}</span>
          {m.branch && <span className="px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)" }}>{m.branch}</span>}
          <span>{fmtDate(m.startedAt)}</span>
          <span>{m.model}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Messages</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--text-primary)" }}>{messages.length}</p>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Input</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(data.totalTokens.input)}</p>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Output</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-green)" }}>{fmtTokens(data.totalTokens.output)}</p>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Cost</p>
          <p className="text-lg font-bold mono" style={{ color: "var(--accent-green)" }}>{fmtCost(totalCost)}</p>
        </div>
      </div>

      {tokenTimeline.length > 2 && (
        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Token Timeline</h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={tokenTimeline}>
              <XAxis dataKey="messageIndex" tick={{ fill: "#555568", fontSize: 10 }} />
              <YAxis tick={{ fill: "#555568", fontSize: 10 }} tickFormatter={fmtTokens} />
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="cumulativeTokens" stroke={CHART_COLORS.cyan} fill={CHART_COLORS.cyan} fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Conversation</h3>
        <div className="space-y-1">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </div>
      </div>
    </div>
  );
}
