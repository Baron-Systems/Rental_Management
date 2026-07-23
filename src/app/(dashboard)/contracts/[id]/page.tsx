'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, ChevronLeft, User, Building2, Home, Calendar, CalendarClock, Banknote, Repeat, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PastContractDuesDialog } from '@/components/contract/PastContractDuesDialog';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';

interface ContractData {
  contract: {
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
    dues: {
      id: string;
      dueNumber: string;
      dueType: { name: string };
      transactionDate: string;
      amount: number;
      description: string | null;
      status: string;
    }[];
    receipts: {
      id: string;
      receiptNumber: string;
      receiptDate: string;
      amount: number;
    }[];
    attachments: {
      id: string;
      fileName: string;
      fileType: string;
      fileData: string;
      createdAt: string;
    }[];
    evictions: {
      id: string;
      evictionDate: string;
      electricityMeterReading: string | null;
      waterMeterReading: string | null;
      notes: string | null;
    }[];
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

const dueStatusLabels: Record<string, string> = { approved: 'معتمد', cancelled: 'ملغي' };
const dueStatusStyles: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const { confirm, prompt: promptDialog } = useDialog();
  const toast = useToast();
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDuesDialog, setShowDuesDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frequencyMap, setFrequencyMap] = useState<Record<string, string>>({
    monthly: 'شهري', bimonthly: 'كل شهرين', quarterly: 'ربع سنوي',
    semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'دفعة واحدة',
  });

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.settings?.find((s: any) => s.settingKey === 'payment_frequencies')?.settingValue;
        const arr = Array.isArray(raw) ? raw : (raw?.value ? raw.value : null);
        if (arr && Array.isArray(arr)) {
          const map: Record<string, string> = { monthly: 'شهري', bimonthly: 'كل شهرين', quarterly: 'ربع سنوي', semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'دفعة واحدة' };
          for (const f of arr) { if (f.value && f.label) map[f.value] = f.label; }
          setFrequencyMap(map);
        }
      })
      .catch(() => {});
  }, [id]);

  if (loading) return <LoadingState message="جاري تحميل بيانات العقد..." />;
  if (!data?.contract) return <EmptyStateMessage title="العقد غير موجود" description="تعذر العثور على بيانات العقد المطلوب." />;

  const c = data.contract;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isHistorical = new Date(c.startDate) < today && new Date(c.endDate) < today;
  const isApprovedHistorical = isHistorical && c.status !== 'draft';

  async function handleApprove() {
    if (!data?.contract) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(data.contract.endDate);
    const isPastContract = endDate < today;

    if (isPastContract) {
      setShowDuesDialog(true);
      return;
    }

    const approved = await confirm({
      title: 'اعتماد العقد',
      description: 'هل أنت متأكد من اعتماد هذا العقد؟ سيتم تفعيل المستحقات المرتبطة.',
      variant: 'warning',
      confirmLabel: 'اعتماد',
    });
    if (!approved) return;
    const res = await fetch(`/api/contracts/${id}/approve`, { method: 'POST' });
    if (res.ok) window.location.reload();
    else { const d = await res.json(); toast.error(d.error || 'حدث خطأ أثناء اعتماد العقد'); }
  }

  async function handleApproveWithDuesChoice(generateDues: boolean) {
    if (!id) return;
    setIsProcessing(true);
    const res = await fetch(`/api/contracts/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generateDues }),
    });
    setIsProcessing(false);
    setShowDuesDialog(false);
    if (res.ok) window.location.reload();
    else { const d = await res.json(); toast.error(d.error || 'حدث خطأ أثناء اعتماد العقد'); }
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'حذف العقد',
      description: 'سيتم حذف العقد نهائيًا مع جميع بياناته. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/contracts';
    else { const d = await res.json(); toast.error(d.error || 'حدث خطأ أثناء حذف العقد'); }
  }

  async function handleCancel() {
    const reason = await promptDialog({
      title: 'إلغاء العقد',
      description: 'أدخل سبب إلغاء العقد بشكل موجز.',
      inputLabel: 'سبب الإلغاء',
      inputPlaceholder: 'مثال: اتفاق الطرفين',
      variant: 'warning',
    });
    if (!reason) return;
    const confirmed = await confirm({
      title: 'تأكيد الإلغاء',
      description: 'هل أنت متأكد من إلغاء هذا العقد؟',
      variant: 'warning',
      confirmLabel: 'إلغاء',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/contracts/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const d = await res.json();
      toast.error(d.error || 'حدث خطأ أثناء إلغاء العقد');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/contracts" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> العقود</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">عقد {c.contractNumber}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className={`status-badge border ${contractStatusStyles[c.status] || contractStatusStyles.draft}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{contractStatusLabels[c.status] || c.status}
              </span>
              {isApprovedHistorical && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">عقد تاريخي</span>
              )}
              {c.renewedContract && !isApprovedHistorical && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">أرشيفي (تم التجديد)</span>
              )}
              <span className="text-sm text-slate-500 flex items-center gap-1"><User className="h-3.5 w-3.5" />{c.tenant.fullName}</span>
              <span className="text-sm text-slate-500 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{c.building.name}</span>
              <span className="text-sm text-slate-500 flex items-center gap-1"><Home className="h-3.5 w-3.5" />{c.unit.unitNumber}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/contracts/${id}/preview`} className="btn-secondary"><Eye className="h-4 w-4" /> معاينة العقد</Link>
            {!isApprovedHistorical && c.status === 'draft' && <Link href={`/contracts/${id}/edit`} className="btn-secondary">تعديل</Link>}
            {!isApprovedHistorical && c.status === 'draft' && (
              <button onClick={handleApprove} className="btn-primary"><CheckCircle className="h-4 w-4" /> اعتماد</button>
            )}
            {!isApprovedHistorical && c.status === 'draft' && (
              <button onClick={handleDelete} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /> حذف</button>
            )}
            {!isApprovedHistorical && c.status === 'active' && (
              <button onClick={handleCancel} className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                <XCircle className="h-4 w-4" /> إلغاء العقد
              </button>
            )}
            {!isApprovedHistorical && (c.status === 'expired' || c.status === 'cancelled') && !c.renewedContract && (
              <Link href={`/contracts/${id}/evict`} className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">إخلاء</Link>
            )}
            {!isApprovedHistorical && c.status === 'expired' && !c.renewedContract && (
              <Link href={`/contracts/${id}/renew`} className="btn-primary">تجديد</Link>
            )}
          </div>
        </div>
      </div>

      {/* Archive warning for historical contracts */}
      {isApprovedHistorical && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <p className="font-medium">⚠ عقد تاريخي</p>
          <p className="text-xs text-amber-700 mt-1">
            {c.dues.length === 0
              ? 'لم يُنشأ لهذا العقد أي التزامات مالية. يُعتبر هذا العقد للأرشفة والاطلاع فقط.'
              : 'عقد تاريخي تم إنشاؤه لسجل المستأجر. المستحقات أُضيفت إلى ذمة المستأجر لكن العقد لا يُؤثر على الحالة الحالية للوحدة.'}
          </p>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'قيمة الإيجار', value: formatCurrency(c.rentAmount), icon: Banknote },
          { label: 'تاريخ البدء', value: new Date(c.startDate).toLocaleDateString('en-GB'), icon: Calendar },
          { label: 'تاريخ الانتهاء', value: new Date(c.endDate).toLocaleDateString('en-GB'), icon: CalendarClock },
          { label: 'تكرار الدفع', value: frequencyMap[c.paymentFrequency] || c.paymentFrequency, icon: Repeat },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><item.icon className="h-3.5 w-3.5" />{item.label}</div>
            <div className="text-sm font-bold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Eviction Data */}
      {c.status === 'evicted' && c.evictions?.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/40 shadow-soft">
          <div className="border-b border-orange-100 px-5 py-4">
            <h3 className="font-semibold text-orange-900">بيانات الإخلاء</h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {c.evictions.map((e) => (
              <div key={e.id} className="space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <div><span className="text-slate-500">تاريخ الإخلاء:</span> <span className="font-medium text-slate-900">{new Date(e.evictionDate).toLocaleDateString('en-GB')}</span></div>
                  <div><span className="text-slate-500">قراءة عداد الكهرباء:</span> <span className="font-medium text-slate-900">{e.electricityMeterReading || '—'}</span></div>
                  <div><span className="text-slate-500">قراءة عداد المياه:</span> <span className="font-medium text-slate-900">{e.waterMeterReading || '—'}</span></div>
                </div>
                {e.notes && (
                  <div><span className="text-slate-500">ملاحظات:</span> <span className="font-medium text-slate-900">{e.notes}</span></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dues Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">التزامات العقد</h3>
          <span className="text-xs text-slate-500">{c.dues.length} التزام</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.dues.map((d) => (
                <tr key={d.id} className={`table-row-hover ${d.status === 'cancelled' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.dueNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{d.dueType.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(d.transactionDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-3"><span className={`status-badge border ${dueStatusStyles[d.status] || dueStatusStyles.cancelled}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{dueStatusLabels[d.status] || d.status}</span></td>
                </tr>
              ))}
              {c.dues.length === 0 && <tr><td colSpan={5}><EmptyStateMessage className="py-8" title="لا توجد التزامات" description="لم يتم إنشاء التزامات لهذا العقد." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachments */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">صور العقد</h3>
          <span className="text-xs text-slate-500">{c.attachments?.length || 0} صورة</span>
        </div>
        <div className="p-5">
          {c.attachments?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {c.attachments.map((a) => (
                <a key={a.id} href={a.fileData} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow">
                  <img src={a.fileData} alt={a.fileName} className="h-32 w-full object-cover" />
                  <div className="px-2 py-1 text-xs text-slate-500 truncate">{a.fileName}</div>
                </a>
              ))}
            </div>
          ) : (
            <EmptyStateMessage className="py-8" title="لا توجد صور مرفقة" description="لم يتم إرفاق أي صور بهذا العقد." />
          )}
        </div>
      </div>

      <PastContractDuesDialog
        isOpen={showDuesDialog}
        isLoading={isProcessing}
        onConfirm={handleApproveWithDuesChoice}
        onCancel={() => { setShowDuesDialog(false); setIsProcessing(false); }}
      />
    </div>
  );
}
