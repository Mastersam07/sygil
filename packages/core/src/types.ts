export interface TokenUsage {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

export interface SessionMeta {
  id: string;
  title: string;
  project: string;
  projectPath: string;
  branch: string | null;
  startedAt: string;
  lastActiveAt: string;
  duration: number;
  messageCount: number;
  tokens: TokenUsage;
  cost: number;
  model: string;
  badges: string[];
}

export interface SessionMessage {
  role: "user" | "assistant" | "system";
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

export interface SessionDetail {
  metadata: SessionMeta;
  messages: SessionMessage[];
  totalTokens: TokenUsage;
  totalCost: number;
  tokenTimeline: { messageIndex: number; cumulativeTokens: number; cumulativeCost: number }[];
}

export interface ProjectStats {
  path: string;
  name: string;
  hash: string;
  sessionCount: number;
  tokens: TokenUsage;
  cost: number;
  branches: string[];
  lastActiveAt: string;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  sessions: number;
}

export interface ModelBreakdown {
  model: string;
  tokens: number;
  cost: number;
  percentage: number;
}

export interface OverviewData {
  totalTokens: TokenUsage;
  estimatedCost: number;
  costWithoutCache: number;
  cacheSavings: number;
  sessionCount: number;
  projectCount: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  avgTokensPerSession: number;
  mostActiveProject: string;
  dailyUsage: DailyUsage[];
  recentSessions: SessionMeta[];
}

export interface ActivityData {
  heatmap: { date: string; count: number; tokens: number }[];
  currentStreak: number;
  longestStreak: number;
  dayOfWeek: { day: number; avgSessions: number; avgTokens: number }[];
  hourOfDay: { hour: number; avgSessions: number; avgTokens: number }[];
}

export interface HistoryEntry {
  prompt: string;
  timestamp: string;
  projectPath: string;
  sessionId: string;
}

export interface ToolCount {
  tool: string;
  category: string;
  count: number;
  percentage: number;
}

export interface GitBranchStats {
  name: string;
  sessions: number;
  tokens: number;
  cost: number;
  firstSeen: string;
  lastSeen: string;
}

export interface TokenAnalytics {
  timeSeries: (DailyUsage & { input: number; output: number; cacheCreation: number; cacheRead: number })[];
  modelBreakdown: ModelBreakdown[];
  cacheEfficiency: { hitRatio: number; creationTokens: number; readTokens: number };
  peakHours: { hour: number; avgTokens: number }[];
  projection: { monthlyEstimate: number; dailyAverage: number };
}

export interface SygilConfig {
  pricing?: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }>;
  theme?: "dark" | "light";
  defaultDateRange?: number;
}
