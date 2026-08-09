import { motion } from 'framer-motion';
import Button from './Button';

/**
 * EmptyState — one geometric line-art icon, human-voice copy, bg-mesh atmosphere.
 * Spec: one simple icon, not a big illustration. Atmospheric, not data-dense.
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-5 rounded-card-lg border border-dashed border-border bg-mesh px-6 py-16 text-center"
    >
      {Icon && (
        // Geometric icon container — gradient bg, no photograph
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[rgba(124,127,251,0.15)] to-[rgba(20,224,180,0.10)] border border-[rgba(124,127,251,0.22)] text-[#7C7FFB]">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      )}
      <div className="space-y-2 max-w-sm">
        <h3 className="font-display text-xl font-bold text-text-primary tracking-tight">
          {title}
        </h3>
        {description && (
          // Human voice — warm, direct, never corporate
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
