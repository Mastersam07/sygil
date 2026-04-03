export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[18px] ${className}`}
      style={{ background: "linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))" }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="page-enter space-y-6">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-12 w-[28rem] max-w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.95fr] gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Skeleton className="h-4 w-32" />
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
