import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-mesh px-6 text-center">
      {/* Spec: gradient accent badge instead of plain text ERR */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1   }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="px-4 py-1.5 rounded-pill text-white font-mono text-sm font-bold shadow-glow"
        style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
      >
        ERR · 404
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-3xl font-bold text-text-primary tracking-tight max-w-sm"
      >
        This page didn't make it through the interview.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xs text-sm text-text-secondary leading-relaxed"
      >
        The page you're looking for doesn't exist or has moved.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.20, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/dashboard">
          <Button variant="primary" size="md">Back to dashboard</Button>
        </Link>
      </motion.div>
    </div>
  );
}
