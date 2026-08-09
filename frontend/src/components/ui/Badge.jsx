import { cn } from '../../utils/cn';

// Liquid Signal palette tones — exact token colors
const TONES = {
  neutral: 'bg-border/30 text-text-secondary border border-border/60',
  signal:  'bg-[rgba(20,224,180,0.10)] border border-[rgba(20,224,180,0.28)] text-[#0BBFA0] dark:text-[#14E0B4]',
  agent:   'bg-[rgba(124,127,251,0.10)] border border-[rgba(124,127,251,0.28)] text-[#6063E8] dark:text-[#9EA1FC]',
  amber:   'bg-[rgba(255,176,32,0.10)] border border-[rgba(255,176,32,0.28)] text-[#E09800] dark:text-[#FFB020]',
  coral:   'bg-[rgba(255,92,114,0.10)] border border-[rgba(255,92,114,0.28)] text-[#FF5C72]',
};

export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        // Spec: pill shape, semibold, tight tracking
        'inline-flex items-center rounded-pill px-2.5 py-0.5',
        'text-xs font-semibold tracking-wide',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
