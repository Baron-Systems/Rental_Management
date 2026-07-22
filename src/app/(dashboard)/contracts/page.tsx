'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Eye, CheckCircle, Trash2, RefreshCw, LogOut, Search, Filter, Building2, Home, User, Calendar, Banknote, ImageIcon, XCircle } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { ContractAttachmentsModal } from '@/components/contract/ContractAttachmentsModal';
import { PastContractDuesDialog } from '@/components/contract/PastContractDuesDialog';

interface Contract {
  id: string;
  contractNumber: string;
  tenant: { fullName: string };
  building: { name: string };
  unit: { unitNumber: string };
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: string;
  status: string;
  renewedContract: { id: string; contractNumber: string } | null;
  _count: { dues: number };
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  expired: 'منتهي',
  cancelled: 'ملغي',
  evicted: 'تم الإخلاء',
};

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  evicted: 'bg-orange-50 text-orange-700 border-orange-200',
};

const frequencyLabels: Record<string, string> = {
  monthly: 'شهري',
  bimonthly: 'كل شهرين',
  quarterly: 'ربع سنوي',
  semiannual: 'نصف سنوي',
  annual: 'سنوي',
  one_time: 'مرة واحدة',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalContractId, setModalContractId] = useState<string | null>(null);
  const [showDuesDialog, setShowDuesDialog] = useState(false);
  const [pendingContractId, setPendingContractId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frequencyMap, setFrequencyMap] = useState<Record<string, string>>({
    monthly: 'شهري', bimonthly: 'كل شهرين', quarterly: 'ربع سنوي',
    semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'مرة واحدة',
  });

  useEffect(() => {
    loadContracts();
    loadFrequencies();
  }, []);

  async function loadFrequencies() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const raw = data.settings?.find((s: any) => s.settingKey === 'payment_frequencies')?.settingValue;
      const arr = Array.isArray(raw) ? raw : (raw?.value ? raw.value : null);
      if (arr && Array.isArray(arr)) {
        const map: Record<string, string> = { monthly: 'شهري', bimonthly: 'كل شهرين', quarterly: 'ربع سنوي', semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'مرة واحدة' };
        for (const f of arr) { if (f.value && f.label) map[f.value] = f.label; }
        setFrequencyMap(map);
      }
    } catch { /* ignore */ }
  }

  function isApprovedHistorical(contract: Contract) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(contract.startDate) < today && new Date(contract.endDate) < today && contract.status !== 'draft';
  }

  async function loadContracts() {
    const res = await fetch('/api/contracts');
    const data = await res.json();
    setContracts(data.contracts || []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(contract.endDate);
    const isPastContract = endDate < today;

    if (isPastContract) {
      setPendingContractId(id);
      setShowDuesDialog(true);
      return;
    }

    if (!confirm('هل أنت متأكد من اعتماد العقد؟')) return;
    const res = await fetch(`/api/contracts/${id}/approve`, { method: 'POST' });
    if (res.ok) loadContracts();
    else { const data = await res.json(); alert(data.error || 'حدث خطأ'); }
  }

  async function handleApproveWithDuesChoice(generateDues: boolean) {
    if (!pendingContractId) return;
    setIsProcessing(true);
    const res = await fetch(`/api/contracts/${pendingContractId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generateDues }),
    });
    setIsProcessing(false);
    setShowDuesDialog(false);
    setPendingContractId(null);
    if (res.ok) loadContracts();
    else { const data = await res.json(); alert(data.error || 'حدث خطأ'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    if (res.ok) loadContracts();
    else { const data = await res.json(); alert(data.error || 'حدث خطأ'); }
  }

  async function handleCancel(id: string) {
    const reason = prompt('أدخل سبب إلغاء العقد:');
    if (!reason) return;
    if (!confirm('هل أنت متأكد من إلغاء العقد؟')) return;
    const res = await fetch(`/api/contracts/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) loadContracts();
    else { const data = await res.json(); alert(data.error || 'حدث خطأ'); }
  }

  const filtered = useMemo(() => {
    let list = contracts;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.tenant.fullName.toLowerCase().includes(q) ||
        c.building.name.toLowerCase().includes(q) ||
        c.unit.unitNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    return list;
  }, [contracts, search, statusFilter]);

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    draft: contracts.filter((c) => c.status === 'draft').length,
    expired: contracts.filter((c) => c.status === 'expired').length,
  }), [contracts]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">العقود</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة العقود الإيجارية والتجديدات</p>
        </div>
        <Link href="/contracts/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          عقد جديد
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إجمالي العقود', value: stats.total, icon: Calendar, color: 'bg-slate-50 text-slate-700' },
          { label: 'نشطة', value: stats.active, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'مسودة', value: stats.draft, icon: Calendar, color: 'bg-slate-100 text-slate-600' },
          { label: 'منتهية', value: stats.expired, icon: Calendar, color: 'bg-amber-50 text-amber-700' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${s.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم العقد أو المستأجر أو العمارة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium w-full pr-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-premium text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="active">نشط</option>
          <option value="expired">منتهي</option>
          <option value="cancelled">ملغي</option>
          <option value="evicted">تم الإخلاء</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم العقد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">العمارة / الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">القيمة / الدورة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      title="لا توجد عقود"
                      description="لم يتم العثور على عقود مطابقة لبحثك."
                      actionLabel="إنشاء عقد جديد"
                      actionHref="/contracts/new"
                      className="border-0 shadow-none"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="table-row-hover group">
                    <td className="px-4 py-3">
                      <Link href={`/contracts/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                        {c.contractNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <User className="h-3 w-3" />
                        {c.tenant.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Building2 className="h-3 w-3" />
                        {c.building.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Home className="h-3 w-3" />
                        {c.unit.unitNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.startDate).toLocaleDateString('en-GB')} - {new Date(c.endDate).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-700">{formatCurrency(c.rentAmount)}</div>
                      <div className="text-xs text-slate-500">{frequencyMap[c.paymentFrequency] || c.paymentFrequency}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`status-badge border ${statusStyles[c.status] || statusStyles.draft}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabels[c.status] || c.status}
                        </span>
                        {c.renewedContract && !isApprovedHistorical(c) && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 w-fit">أرشيفي</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/contracts/${c.id}`} className="btn-ghost" title="التفاصيل">
                          <Eye className="h-4 w-4" />
                        </Link>
                        {!isApprovedHistorical(c) && c.status === 'draft' && (
                          <button onClick={() => handleApprove(c.id)} className="btn-ghost text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" title="اعتماد">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!isApprovedHistorical(c) && c.status === 'draft' && (
                          <button onClick={() => handleDelete(c.id)} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!isApprovedHistorical(c) && c.status === 'active' && (
                          <button onClick={() => handleCancel(c.id)} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" title="إلغاء العقد">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!isApprovedHistorical(c) && (c.status === 'expired' || c.status === 'cancelled') && !c.renewedContract && (
                          <Link href={`/contracts/${c.id}/evict`} className="btn-ghost text-orange-600 hover:bg-orange-50 hover:text-orange-700" title="إخلاء">
                            <LogOut className="h-4 w-4" />
                          </Link>
                        )}
                        {!isApprovedHistorical(c) && c.status === 'expired' && !c.renewedContract && (
                          <Link href={`/contracts/${c.id}/renew`} className="btn-ghost text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="تجديد">
                            <RefreshCw className="h-4 w-4" />
                          </Link>
                        )}
                        <button onClick={() => setModalContractId(c.id)} className="btn-ghost text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="صور العقد">
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          إجمالي: {filtered.length} عقد
        </div>
      </div>

      {modalContractId && (
        <ContractAttachmentsModal
          contractId={modalContractId}
          isOpen={!!modalContractId}
          onClose={() => setModalContractId(null)}
        />
      )}

      <PastContractDuesDialog
        isOpen={showDuesDialog}
        isLoading={isProcessing}
        onConfirm={handleApproveWithDuesChoice}
        onCancel={() => { setShowDuesDialog(false); setPendingContractId(null); setIsProcessing(false); }}
      />
    </div>
  );
}
