export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "var(--bg-card)" }} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      ))}
    </div>
  );
}
