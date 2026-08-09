import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Spec tones with exact Liquid Signal colors
const TONES = {
  neutral: 'glass border-border/60 text-text-primary',
  info:    'glass border-[rgba(124,127,251,0.30)] text-text-primary',
  signal:  'bg-[rgba(20,224,180,0.10)] border-[rgba(20,224,180,0.30)] text-[#0BBFA0] dark:text-[#14E0B4]',
  coral:   'bg-[rgba(255,92,114,0.10)] border-[rgba(255,92,114,0.30)] text-[#FF5C72]',
  amber:   'bg-[rgba(255,176,32,0.10)] border-[rgba(255,176,32,0.30)] text-[#E09800] dark:text-[#FFB020]',
};

export default function Toast({ message, tone = 'neutral', onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -8, scale: 0.95  }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-4',
        'rounded-[14px] border px-4 py-3 text-sm shadow-raised',
        TONES[tone]
      )}
    >
      <span className="font-medium leading-snug">{message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="shrink-0 rounded-[8px] px-1.5 py-1 text-xs opacity-50 hover:opacity-100 hover:bg-border/30 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
      >
        ✕
      </button>
    </motion.div>
  );
}
