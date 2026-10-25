/** Grey placeholder in the shape of a VehicleCard, shown while the inventory loads. */
export function SkeletonCard() {
  return (
    <div data-testid="skeleton-card" className="cyber-panel animate-pulse" aria-hidden="true">
      <div className="h-40 bg-cp-screen" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 bg-white/10" />
        <div className="h-7 w-2/3 bg-white/10" />
        <div className="h-6 w-1/2 bg-white/10" />
        <div className="h-6 w-2/5 bg-white/10" />
      </div>
    </div>
  );
}
