import { AnimatePresence } from 'framer-motion';
import { useContext } from 'react';
import { ToastContext } from '../../context/ToastContext';
import Toast from './Toast';

export default function ToastViewport() {
  const { toasts, dismiss } = useContext(ToastContext);

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
