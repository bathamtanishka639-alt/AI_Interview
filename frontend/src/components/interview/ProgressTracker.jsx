import { cn } from '../../utils/cn';

export default function ProgressTracker({ total, currentIndex }) {
  return (
    <div className="flex items-center gap-1.5" role="list" aria-label="Interview progress">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          role="listitem"
          className={cn(
            'h-1.5 flex-1 rounded-pill transition-colors',
            i < currentIndex ? 'bg-signal-500' : i === currentIndex ? 'bg-agent-500' : 'bg-border'
          )}
        />
      ))}
    </div>
  );
}
