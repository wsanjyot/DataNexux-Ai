const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
);

export const KPISkeleton = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-32 mb-2" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <Skeleton className="h-5 w-48 mb-6" />
    <div className="flex items-end gap-2 px-4">
      {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50, 95, 40].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-800 animate-pulse rounded-t"
          style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
    <div className={`${height}`} />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="bg-gray-800 px-4 py-3 flex gap-4">
      {[120, 180, 100, 80, 140].map((w, i) => (
        <Skeleton key={i} className="h-4" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-3 border-t border-gray-800 flex gap-4">
        {[120, 180, 100, 80, 140].map((w, j) => (
          <Skeleton key={j} className="h-4" style={{ width: w }} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;