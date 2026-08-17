import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, description?: string, duration?: number) => void;
  toast: {
    success: (message: string, description?: string, duration?: number) => void;
    info: (message: string, description?: string, duration?: number) => void;
    warning: (message: string, description?: string, duration?: number) => void;
    error: (message: string, description?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', description?: string, duration: number = 2800) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = { id, type, message, description, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, desc?: string, dur?: number) => showToast(msg, 'success', desc, dur),
    info: (msg: string, desc?: string, dur?: number) => showToast(msg, 'info', desc, dur),
    warning: (msg: string, desc?: string, dur?: number) => showToast(msg, 'warning', desc, dur),
    error: (msg: string, desc?: string, dur?: number) => showToast(msg, 'error', desc, dur),
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const getToastBg = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white/95 text-slate-900 shadow-lg ring-1 ring-emerald-500/10';
      case 'warning':
        return 'border-amber-200 bg-white/95 text-slate-900 shadow-lg ring-1 ring-amber-500/10';
      case 'error':
        return 'border-rose-200 bg-white/95 text-slate-900 shadow-lg ring-1 ring-rose-500/10';
      default:
        return 'border-blue-200 bg-white/95 text-slate-900 shadow-lg ring-1 ring-blue-500/10';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md flex items-start space-x-2.5 ${getToastBg(
                t.type
              )}`}
            >
              <div className="mt-0.5">{getToastIcon(t.type)}</div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-bold text-slate-900 leading-snug">{t.message}</p>
                {t.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy context if used outside provider
    return {
      showToast: () => {},
      toast: {
        success: () => {},
        info: () => {},
        warning: () => {},
        error: () => {},
      },
    };
  }
  return context;
};
