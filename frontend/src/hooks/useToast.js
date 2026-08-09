import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  // convenience wrappers
  return {
    ...ctx,
    success: (message) => ctx.push({ tone: 'signal', message }),
    error: (message) => ctx.push({ tone: 'coral', message }),
    info: (message) => ctx.push({ tone: 'neutral', message }),
  };
}
