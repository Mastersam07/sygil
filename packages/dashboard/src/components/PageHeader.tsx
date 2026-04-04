interface PageHeaderProps {
  pageName: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function PageHeader({ pageName, subtitle, onRefresh }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-[15px] font-bold tracking-wide mb-1" style={{ color: "var(--text)" }}>claude-code-analytics · {pageName}</h1>
        {subtitle && (
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {onRefresh && (
        <button onClick={onRefresh} className="px-3 py-1.5 border border-white/10 rounded text-[12px] hover:bg-white/5 transition-colors text-muted">
          refresh charts
        </button>
      )}
    </div>
  );
}
