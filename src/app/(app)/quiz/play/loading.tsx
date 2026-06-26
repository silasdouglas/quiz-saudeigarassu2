export default function QuizPlayLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col px-4 py-6">
      <div className="mb-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted" />
      </div>
      <div className="flex-1 animate-pulse rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-24 rounded-full bg-muted" />
          <div className="h-5 w-12 rounded-full bg-muted" />
        </div>
        <div className="mb-3 h-1.5 w-full rounded-full bg-muted" />
        <div className="mt-4 space-y-1.5">
          <div className="h-5 w-full rounded-full bg-muted" />
          <div className="h-5 w-4/5 rounded-full bg-muted" />
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <div className="size-6 shrink-0 rounded-full bg-muted" />
              <div className="h-4 flex-1 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
