import { cn } from '@/lib/utils';

const statusVariants: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  evicted: 'bg-orange-50 text-orange-700 border-orange-200',
  rented: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  empty: 'bg-amber-50 text-amber-700 border-amber-200',
  reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  unavailable: 'bg-slate-100 text-slate-700 border-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  overpaid: 'bg-blue-50 text-blue-700 border-blue-200',
  cash: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cheque: 'bg-blue-50 text-blue-700 border-blue-200',
  'نظامي': 'bg-slate-100 text-slate-700 border-slate-200',
  'مخصص': 'bg-blue-50 text-blue-700 border-blue-200',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = statusVariants[status] || statusVariants.draft;

  return (
    <span
      className={cn(
        'status-badge border',
        variant,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label || status}
    </span>
  );
}

export const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  expired: 'منتهي',
  cancelled: 'ملغي',
  evicted: 'تم الإخلاء',
  rented: 'مؤجرة',
  empty: 'فارغة',
  reserved: 'محجوزة',
  unavailable: 'غير متاحة',
  approved: 'معتمد',
  pending: 'معلق',
  paid: 'مدفوع',
  unpaid: 'غير مدفوع',
  partial: 'جزئي',
  overpaid: 'زيادة',
  cash: 'نقداً',
  cheque: 'شيك',
};

export function StatusBadgeWithLabel({ status, className }: Omit<StatusBadgeProps, 'label'>) {
  return <StatusBadge status={status} label={statusLabels[status] || status} className={className} />;
}

export const unitStatusLabels: Record<string, string> = {
  empty: 'فارغة',
  rented: 'مؤجرة',
  reserved: 'محجوزة',
  unavailable: 'غير متاحة',
};

export const contractStatusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  expired: 'منتهي',
  cancelled: 'ملغي',
  evicted: 'تم الإخلاء',
};

export const dueStatusLabels: Record<string, string> = {
  approved: 'معتمد',
  cancelled: 'ملغي',
};

export const receiptStatusLabels: Record<string, string> = {
  approved: 'معتمد',
  cancelled: 'ملغي',
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'نقداً',
  cheque: 'شيك',
};

export const paymentFrequencyLabels: Record<string, string> = {
  monthly: 'شهري',
  bimonthly: 'كل شهرين',
  quarterly: 'ربع سنوي',
  semiannual: 'نصف سنوي',
  annual: 'سنوي',
  one_time: 'مرة واحدة',
};

export const unitTypeLabels: Record<string, string> = {
  apartment: 'شقة',
  shop: 'محل',
  office: 'مكتب',
  warehouse: 'مستودع',
  other: 'أخرى',
};

export function UnitTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span className={cn('text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100', className)}>
      {unitTypeLabels[type] || type}
    </span>
  );
}

export function PaymentMethodBadge({ method, className }: { method: string; className?: string }) {
  return <StatusBadge status={method} label={paymentMethodLabels[method] || method} className={className} />;
}

export function PaymentFrequencyBadge({ frequency, className }: { frequency: string; className?: string }) {
  return (
    <span className={cn('text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100', className)}>
      {paymentFrequencyLabels[frequency] || frequency}
    </span>
  );
}

export const unitTypeColors: Record<string, string> = {
  apartment: 'bg-sky-50 text-sky-700 border-sky-200',
  shop: 'bg-violet-50 text-violet-700 border-violet-200',
  office: 'bg-teal-50 text-teal-700 border-teal-200',
  warehouse: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function UnitTypeColoredBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span className={cn('status-badge border', unitTypeColors[type] || unitTypeColors.other, className)}>
      {unitTypeLabels[type] || type}
    </span>
  );
}
