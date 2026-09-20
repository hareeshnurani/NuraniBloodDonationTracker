export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy aria-label="Loading">
      <div className="h-10 w-2/3 max-w-sm rounded-[var(--radius-md)] bg-[var(--surface-secondary)]" />
      <div className="h-4 w-full max-w-md rounded bg-[var(--surface-secondary)]" />
      <div className="h-24 rounded-[var(--radius-lg)] bg-[var(--surface-secondary)]" />
      <div className="h-40 rounded-[var(--radius-lg)] bg-[var(--surface-secondary)]" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-[var(--radius-lg)] bg-[var(--surface-secondary)]" />
        <div className="h-28 rounded-[var(--radius-lg)] bg-[var(--surface-secondary)]" />
      </div>
    </div>
  );
}
