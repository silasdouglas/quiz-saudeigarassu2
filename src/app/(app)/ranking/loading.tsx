export default function RankingLoading() {
  return (
    <div className="mx-auto max-w-xl animate-pulse px-4 py-8">
      <div className="mb-6 h-5 w-28 rounded-full bg-muted" />
      <div className="mb-6 flex items-center gap-2">
        <div className="size-5 rounded-full bg-muted" />
        <div className="h-6 w-36 rounded-full bg-muted" />
      </div>
      <div className="mb-5 flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-muted" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
            <div className="w-7 h-5 rounded-full bg-muted" />
            <div className="size-9 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-4 w-32 rounded-full bg-muted" />
              <div className="h-3 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-12 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
