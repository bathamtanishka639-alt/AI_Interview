import { createContext, useCallback, useState } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, tone: 'neutral', duration: 4000, ...toast }]);
    if (toast.duration !== 0) {
      setTimeout(() => dismiss(id), toast.duration ?? 4000);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}
