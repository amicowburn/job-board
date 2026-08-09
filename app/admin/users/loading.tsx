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
          <div className="h-9 w-64 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        {/* Header row */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex gap-4">
          {['w-40', 'w-24', 'w-20'].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-200 rounded animate-pulse`} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-50 flex gap-4 items-center">
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
