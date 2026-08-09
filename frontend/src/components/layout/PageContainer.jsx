import { motion } from 'framer-motion';

// Shared page entrance easing — feel intentional, not bouncy
const EASE = [0.16, 1, 0.3, 1];

export default function PageContainer({ title, subtitle, actions, children }) {
  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      {(title || actions) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            {title && (
              // Spec: page titles = Space Grotesk display, tight tracking
              <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 shrink-0">{actions}</div>
          )}
        </motion.div>
      )}

      {/* Spec: page body fades+slides up with slight delay for stagger effect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.4, delay: 0.06, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}
