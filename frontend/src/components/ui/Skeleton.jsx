import { cn } from '../../utils/cn';
// Spec: Skeleton — subtle pulse, not distracting
export default function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-card bg-border/35', className)}
      aria-hidden="true"
    />
  );
}
