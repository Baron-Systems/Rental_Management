'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, Search, Filter, Building2, Home, Phone, CreditCard, Receipt, ArrowUpDown,
} from 'lucide-react';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';

interface Tenant {
  id: string;
  fullName: string;
  nationalId: string | null;
  phone: string | null;
  contracts: { building: { name: string }; unit: { unitNumber: string } }[];
  totalDues: number;
  totalReceipts: number;
  balance: number;
}

export default function TenantsPage() {
  const router = useRouter();
  const { confirm } = useDialog();
  const toast = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'debt' | 'credit' | 'zero'>('all');

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    const res = await fetch('/api/tenants');
    const data = await res.json();
    setTenants(data.tenants || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'حذف المستأجر',
      description: 'سيتم حذف بيانات المستأجر. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    if (res.ok) loadTenants();
    else {
      const data = await res.json();
      toast.error(data.error || 'حدث خطأ أثناء حذف المستأجر');
    }
  }

  const filteredTenants = useMemo(() => {
    let filtered = tenants;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          (t.nationalId?.toLowerCase() || '').includes(q) ||
          (t.phone?.toLowerCase() || '').includes(q)
      );
    }
    if (balanceFilter !== 'all') {
      filtered = filtered.filter((t) => {
        if (balanceFilter === 'debt') return t.balance > 0;
        if (balanceFilter === 'credit') return t.balance < 0;
        if (balanceFilter === 'zero') return t.balance === 0;
        return true;
      });
    }
    return filtered;
  }, [tenants, search, balanceFilter]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">المستأجرون</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة المستأجرين ومراقبة أرصدتهم المالية</p>
        </div>
        <Link href="/tenants/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          إضافة مستأجر
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهوية أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium w-full pr-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as any)}
            className="select-premium text-sm"
          >
            <option value="all">كل الأرصدة</option>
            <option value="debt">عليهم رصيد</option>
            <option value="credit">لهم رصيد</option>
            <option value="zero">الرصيد صفر</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'إجمالي المستأجرين', value: tenants.length, icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
          { label: 'عليهم رصيد', value: tenants.filter((t) => t.balance > 0).length, icon: Receipt, color: 'bg-red-50 text-red-600' },
          { label: 'لهم رصيد', value: tenants.filter((t) => t.balance < 0).length, icon: Receipt, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'الرصيد صفر', value: tenants.filter((t) => t.balance === 0).length, icon: CreditCard, color: 'bg-slate-50 text-slate-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الهوية / الهاتف</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">العمارة / الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستحقات</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الدفعات</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الرصيد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      title="لا يوجد مستأجرون"
                      description="لم يتم العثور على مستأجرين مطابقين لبحثك."
                      actionLabel="إضافة مستأجر"
                      actionHref="/tenants/new"
                      className="border-0 shadow-none"
                    />
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="table-row-hover group cursor-pointer" onClick={() => router.push(`/tenants/${t.id}`)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {t.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-600 text-xs">{t.nationalId || '—'}</div>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                        <Phone className="h-3 w-3" />
                        {t.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Building2 className="h-3 w-3" />
                        {t.contracts[0]?.building?.name || '—'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Home className="h-3 w-3" />
                        {t.contracts[0]?.unit?.unitNumber || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(t.totalDues)}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(t.totalReceipts)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.balance > 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : t.balance < 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {formatCurrency(t.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/tenants/${t.id}/edit`}
                          className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 flex items-center justify-between">
          <span>إجمالي: {filteredTenants.length} مستأجر</span>
          {search && <span>نتائج البحث: &quot;{search}&quot;</span>}
        </div>
      </div>
    </div>
  );
}
