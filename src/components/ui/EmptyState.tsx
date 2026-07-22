import { FileX, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي سجلات في الوقت الحالي.',
  actionLabel,
  actionHref,
  icon: Icon = FileX,
  className,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-4">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TableEmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي سجلات في الوقت الحالي.',
  actionLabel,
  actionHref,
  onAction,
}: Omit<EmptyStateProps, 'className' | 'icon'>) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-4">
        <FileX className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
