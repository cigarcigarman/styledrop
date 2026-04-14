export function ArtistCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-card)] overflow-hidden animate-pulse">
      <div className="grid grid-cols-2 gap-0.5 bg-[var(--border)]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-[var(--surface2)]" />
        ))}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-[var(--surface2)] rounded w-2/3" />
        <div className="h-3 bg-[var(--surface2)] rounded w-1/2" />
        <div className="h-8 bg-[var(--surface2)] rounded-[var(--radius-btn)]" />
      </div>
    </div>
  )
}
