export default function AppLoading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto max-w-sm animate-pulse px-4 pt-8 pb-2 md:max-w-2xl">
        <div className="mb-1.5 h-4 w-32 rounded-full bg-muted" />
        <div className="mt-2 h-7 w-40 rounded-full bg-muted" />
        <div className="mt-2 h-4 w-64 rounded-full bg-muted" />
      </div>

      <div className="mx-auto max-w-sm animate-pulse px-4 pt-6 md:max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="h-4 w-24 rounded-full bg-muted" />
        </div>
        <div className="mb-3 flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-16 rounded-full bg-muted" />
          ))}
        </div>
        <div className="flex items-end justify-center gap-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-muted" />
              <div className="h-3 w-14 rounded-full bg-muted" />
              <div className={`w-20 rounded-t-xl bg-muted ${i === 1 ? "h-24" : i === 2 ? "h-16" : "h-12"}`} />
            </div>
          ))}
        </div>
        <div className="mt-1 rounded-b-2xl border bg-card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-t px-4 py-3">
              <div className="size-6 rounded-full bg-muted" />
              <div className="size-7 rounded-full bg-muted" />
              <div className="h-4 flex-1 rounded-full bg-muted" />
              <div className="h-4 w-12 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
