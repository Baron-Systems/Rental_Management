import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const variants: Record<AlertVariant, { icon: React.ElementType; bg: string; text: string; border: string; iconColor: string }> = {
  error: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', iconColor: 'text-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', iconColor: 'text-amber-600' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', iconColor: 'text-emerald-600' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconColor: 'text-blue-600' },
};

export function Alert({ variant = 'error', title, children, className, onClose }: AlertProps) {
  const config = variants[variant];
  const Icon = config.icon;
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', config.bg, config.border, className)}>
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className={cn('text-sm font-semibold', config.text)}>{title}</h4>}
        <div className={cn('text-sm leading-relaxed', title ? 'mt-0.5 text-slate-600' : config.text)}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
