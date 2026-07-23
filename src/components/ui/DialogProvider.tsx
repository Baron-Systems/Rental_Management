'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface BaseDialogOptions {
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
}

interface DialogRequest {
  id: string;
  type: 'confirm' | 'alert' | 'prompt';
  options: BaseDialogOptions;
  resolve: (value: any) => void;
}

interface DialogContextValue {
  confirm: (options: BaseDialogOptions) => Promise<boolean>;
  alert: (options: BaseDialogOptions) => void;
  prompt: (options: BaseDialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const variantConfig: Record<
  DialogVariant,
  { icon: React.ElementType; iconBg: string; iconColor: string; button: string }
> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20',
  },
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const current = dialogs[0];
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setDialogs((prev) => prev.slice(1));
  }, []);

  const confirm = useCallback((options: BaseDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), type: 'confirm', options, resolve },
      ]);
    });
  }, []);

  const alert = useCallback((options: BaseDialogOptions) => {
    setDialogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), type: 'alert', options, resolve: () => {} },
    ]);
  }, []);

  const prompt = useCallback((options: BaseDialogOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), type: 'prompt', options, resolve },
      ]);
    });
  }, []);

  useEffect(() => {
    if (current?.type === 'prompt') {
      setPromptValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [current?.id, current?.type]);

  const handleAction = () => {
    if (!current) return;
    current.resolve(current.type === 'prompt' ? promptValue : true);
    close();
  };

  const handleCancel = () => {
    if (!current) return;
    current.resolve(current.type === 'confirm' ? false : null);
    close();
  };

  const variant = current?.options.variant || 'info';
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isPrompt = current?.type === 'prompt';

  const value = useMemo(() => ({ confirm, alert, prompt }), [confirm, alert, prompt]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-soft-lg animate-scale-in">
            <div className="flex items-start gap-4">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', config.iconBg)}>
                <Icon className={cn('h-5 w-5', config.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">{current.options.title}</h3>
                {current.options.description && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{current.options.description}</p>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isPrompt && (
              <div className="mt-5">
                {current.options.inputLabel && (
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {current.options.inputLabel}
                  </label>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={current.options.inputPlaceholder}
                  className="input-premium w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && promptValue.trim()) handleAction();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {current.type !== 'alert' && (
                <button
                  onClick={handleCancel}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {current.options.cancelLabel || 'إلغاء'}
                </button>
              )}
              <button
                onClick={handleAction}
                disabled={isPrompt && !promptValue.trim()}
                className={cn(
                  'btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed',
                  config.button
                )}
              >
                {isPrompt
                  ? current.options.confirmLabel || 'تأكيد'
                  : current.options.confirmLabel || (current.type === 'alert' ? 'حسناً' : 'تأكيد')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}
