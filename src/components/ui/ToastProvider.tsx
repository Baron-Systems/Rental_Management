'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  description?: string;
}

interface ToastContextValue {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  loading: (title: string, description?: string) => string;
  update: (id: string, toast: Partial<Toast>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType; iconClass: string; border: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
    border: 'border-emerald-200',
    bg: 'bg-white',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600',
    border: 'border-red-200',
    bg: 'bg-white',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-white',
  },
  loading: {
    icon: Loader2,
    iconClass: 'text-blue-600 animate-spin',
    border: 'border-slate-200',
    bg: 'bg-white',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, variant, title, description }]);
    if (variant !== 'loading') {
      setTimeout(() => remove(id), 4500);
    }
    return id;
  }, [remove]);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description) => add('success', title, description),
      error: (title, description) => add('error', title, description),
      info: (title, description) => add('info', title, description),
      warning: (title, description) => add('warning', title, description),
      loading: (title, description) => add('loading', title, description),
      update: (id, toast) =>
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...toast } : t))),
      dismiss: remove,
    }),
    [add, remove]
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="left">
        {children}
        <ToastPrimitive.Viewport className="fixed top-4 left-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-4" />
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          const Icon = config.icon;
          return (
            <ToastPrimitive.Root
              key={toast.id}
              open
              onOpenChange={(open) => { if (!open) remove(toast.id); }}
              duration={toast.variant === 'loading' ? Infinity : 4000}
              className={cn(
                'relative flex items-start gap-3 rounded-xl border p-4 shadow-soft-lg animate-slide-up',
                config.bg,
                config.border
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} />
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold text-slate-900">
                    {toast.title}
                  </ToastPrimitive.Title>
                )}
                {toast.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close asChild>
                <button
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
