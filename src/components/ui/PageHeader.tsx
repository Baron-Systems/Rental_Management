import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  backHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  backHref,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && (actionHref || onAction) && (
          actionHref ? (
            <Link href={actionHref} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}

interface DetailPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function DetailPageHeader({
  title,
  subtitle,
  badge,
  actions,
  backHref,
  className,
}: DetailPageHeaderProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-soft', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {backHref && (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
