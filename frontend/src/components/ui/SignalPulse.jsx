// The signature motif: reused as spinner, typing indicator, and "live" dot.
import { cn } from '../../utils/cn';

const SIZES = {
  xs: { bar: 'w-0.5', heights: ['h-1.5', 'h-2', 'h-1'] },
  sm: { bar: 'w-0.5', heights: ['h-2', 'h-3', 'h-1.5'] },
  md: { bar: 'w-1', heights: ['h-3', 'h-5', 'h-2.5'] },
};

export default function SignalPulse({ size = 'sm', className }) {
  const { bar, heights } = SIZES[size] ?? SIZES.sm;
  return (
    <span className={cn('inline-flex items-end gap-0.5', className)} role="status" aria-label="Live">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(bar, heights[i], 'origin-bottom animate-pulse-bar rounded-full bg-signal-500')}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
