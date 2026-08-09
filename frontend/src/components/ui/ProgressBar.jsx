// Spec: gradient fill for active progress states
export default function ProgressBar({ value, max = 100, label }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-text-secondary">{label}</span>
          {/* Spec: numeric data in JetBrains Mono */}
          <span className="font-mono text-text-primary font-semibold">{pct}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-pill bg-border/50"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Spec: gradient on active progress states */}
        <div
          className="h-full rounded-pill bg-gradient-to-r from-[#14E0B4] to-[#7C7FFB] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
