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
      <div className="card p-7 lg:p-8 space-y-5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-14 w-136 max-w-full" />
        <Skeleton className="h-5 w-2xl max-w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-11 w-11 rounded-2xl" />
            </div>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.95fr] gap-4">
        <div className="card p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-8 w-72 max-w-full" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-[20px]" />
        </div>
        <div className="card p-7 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-52 max-w-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="surface-muted p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <Skeleton className="h-4 w-32" />
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
