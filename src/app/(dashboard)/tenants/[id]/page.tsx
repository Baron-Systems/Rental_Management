'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Phone, FileText, Receipt, Wallet, AlertTriangle, User, Building2, Home, Calendar, ChevronLeft, Printer, Eye, Briefcase, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TenantData {
  tenant: {
    id: string;
    fullName: string;
    nationalId: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    workplace: string | null;
    guarantorName: string | null;
    guarantorPhone: string | null;
    contracts: {
      id: string;
      contractNumber: string;
      building: { name: string };
      unit: { unitNumber: string };
      startDate: string;
      endDate: string;
      rentAmount: number;
      status: string;
    }[];
  };
  balance: {
    totalDues: number;
    totalReceipts: number;
    balance: number;
  };
  statement: {
    lines: {
      id: string;
      date: string;
      type: string;
      typeName: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
      balance: number;
    }[];
    totalDues: number;
    totalReceipts: number;
    closingBalance: number;
  };
}

const contractStatusLabels: Record<string, string> = {
  draft: 'مسودة', active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', evicted: 'تم الإخلاء',
};
const contractStatusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  evicted: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function TenantDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${id}`)
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">جاري التحميل...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">المستأجر غير موجود</div>;

  const t = data.tenant;
  const balance = data.balance;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero - All tenant data */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/tenants" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> المستأجرين</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.fullName}</h1>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-500">
                {t.nationalId && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>رقم الهوية: {t.nationalId}</span>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                )}
                {t.workplace && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t.workplace}</span>
                  </div>
                )}
                {t.guarantorName && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>الكفيل: {t.guarantorName}</span>
                    {t.guarantorPhone && <span className="text-slate-400">({t.guarantorPhone})</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/tenants/${id}/edit`} className="btn-secondary">تعديل</Link>
            <Link href={`/tenants/${id}/print`} target="_blank" className="btn-secondary"><Printer className="h-4 w-4" /> طباعة</Link>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'إجمالي المستحقات', value: balance.totalDues, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'إجمالي الدفعات', value: balance.totalReceipts, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'الرصيد', value: balance.balance, icon: Wallet, color: balance.balance > 0 ? 'text-red-600' : balance.balance < 0 ? 'text-emerald-600' : 'text-slate-600', bg: balance.balance > 0 ? 'bg-red-50' : balance.balance < 0 ? 'bg-emerald-50' : 'bg-slate-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><div className={`flex h-6 w-6 items-center justify-center rounded-md ${s.bg} ${s.color}`}><s.icon className="h-3.5 w-3.5" /></div>{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Statement */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">كشف الحساب</h3>
          <span className="text-xs text-slate-500">{data.statement.lines.length} حركة</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المرجع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المبلغ المستحق</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المبلغ المدفوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.statement.lines.map((line, i) => (
                <tr key={`${line.id}-${i}`} className="table-row-hover">
                  <td className="px-4 py-3 text-xs text-slate-500">{line.reference}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(line.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{line.typeName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-red-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-emerald-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">{formatCurrency(line.balance)}</td>
                </tr>
              ))}
              {data.statement.lines.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-500">لا توجد حركات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contracts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">العقود</h3>
          <span className="text-xs text-slate-500">{t.contracts.length} عقد</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم العقد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">العمارة / الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.contracts.map((c) => (
                <tr key={c.id} className="table-row-hover group">
                  <td className="px-4 py-3"><Link href={`/contracts/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.contractNumber}</Link></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-600"><Building2 className="h-3 w-3" />{c.building.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Home className="h-3 w-3" />{c.unit.unitNumber}</div>
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Calendar className="h-3 w-3" />{new Date(c.startDate).toLocaleDateString('en-GB')} - {new Date(c.endDate).toLocaleDateString('en-GB')}</div></td>
                  <td className="px-4 py-3"><span className={`status-badge border ${contractStatusStyles[c.status] || contractStatusStyles.draft}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{contractStatusLabels[c.status] || c.status}</span></td>
                  <td className="px-4 py-3 text-center"><Link href={`/contracts/${c.id}/preview`} target="_blank" className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Eye className="h-4 w-4" /></Link></td>
                </tr>
              ))}
              {t.contracts.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">لا توجد عقود</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
