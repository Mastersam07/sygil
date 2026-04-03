export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--bg-hover)" }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="page-enter space-y-5">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-22" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-70" />
        <Skeleton className="h-70" />
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
