export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-72 bg-slate-100 rounded-full animate-pulse" />
      </div>

      <div className="space-y-4">
        {/* Metric strip — one divided surface, four cells, value and qualifier
            on a shared baseline. */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="flex items-baseline gap-2">
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Viewers chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-[280px] flex items-end gap-2">
            {['h-1/3', 'h-2/3', 'h-1/2', 'h-3/4', 'h-2/5', 'h-4/5', 'h-1/2', 'h-3/5'].map(
              (h, i) => (
                <div key={i} className={`flex-1 ${h} bg-slate-100 rounded-t-md animate-pulse`} />
              )
            )}
          </div>
        </div>

        {/* Interest charts. The pair no longer share a shape — job type reads
            as columns, tag as rows — so neither does the placeholder. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-52 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-[200px] flex items-end gap-3">
              {['h-4/5', 'h-3/5', 'h-2/5', 'h-1/4', 'h-1/5', 'h-[8%]'].map((h, i) => (
                <div key={i} className={`flex-1 ${h} bg-slate-100 rounded-t-md animate-pulse`} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-52 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {['w-5/6', 'w-3/5', 'w-1/2', 'w-2/5', 'w-1/4'].map((w, i) => (
                <div key={i} className={`h-5 ${w} bg-slate-100 rounded-md animate-pulse`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
