import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

// Spring: feels intentional, not floaty
const SPRING = { type: 'spring', stiffness: 320, damping: 30 };

export default function Modal({ open, onClose, title, children }) {
  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay — backdrop-blur-md for depth */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — spec: modal = 28px radius, glass surface */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94, y: 14 }}
            transition={SPRING}
            className="relative z-10 w-full max-w-md glass rounded-[28px] p-6 shadow-raised"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary tracking-tight">
                {title}
              </h2>
              <button
                aria-label="Close dialog"
                onClick={onClose}
                className="rounded-btn p-1.5 text-text-secondary hover:bg-border/30 hover:text-text-primary transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
