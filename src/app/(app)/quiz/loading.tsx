export default function QuizLoading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse px-4 py-10">
      <div className="mb-6">
        <div className="h-8 w-48 rounded-full bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-full bg-muted" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 rounded-2xl border p-4">
            <div className="size-11 shrink-0 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-11 w-full rounded-lg bg-muted" />
    </div>
  );
}
