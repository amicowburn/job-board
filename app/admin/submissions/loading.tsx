export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-7 w-44 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex gap-3">
          <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        {/* Header row */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex gap-4">
          {['w-32', 'w-24', 'w-20', 'w-16', 'w-24', 'w-20'].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-200 rounded animate-pulse`} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-50 flex gap-4 items-center">
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-5 w-14 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-7 w-16 bg-green-100 rounded-lg animate-pulse" />
              <div className="h-7 w-14 bg-red-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
          <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
