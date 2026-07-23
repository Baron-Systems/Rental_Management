import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseProps {
  className?: string;
  message?: string;
}

export function LoadingState({ message = 'جاري التحميل...', className }: BaseProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'تعذر تحميل البيانات', className, onRetry }: BaseProps & { onRetry?: () => void }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function EmptyStateMessage({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي سجلات في الوقت الحالي.',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
    </div>
  );
}
