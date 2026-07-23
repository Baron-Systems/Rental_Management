'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Tag, User, Building2, Home, Calendar, Banknote, XCircle, Printer, AlertTriangle, StickyNote, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';
import { Alert } from '@/components/ui/Alert';

interface DueDetail {
  id: string;
  dueNumber: string;
  dueType: { name: string } | null;
  tenant: { fullName: string } | null;
  building: { name: string } | null;
  unit: { unitNumber: string } | null;
  contract: { id: string; contractNumber: string } | null;
  transactionDate: string;
  dueDate: string;
  amount: number;
  description: string | null;
  status: string;
  sourceType: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  previousMeterReading: string | null;
  currentMeterReading: string | null;
  meterConsumption: string | null;
  unitPrice: number | null;
}

function getTemporalStatus(due: DueDetail): { label: string; style: string } {
  if (due.status === 'cancelled') return { label: 'ملغي', style: 'bg-red-50 text-red-700 border-red-200' };
  const d = new Date(due.dueDate); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d > today) return { label: 'مستقبلي', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'مستحق', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export default function DueDetailPage() {
  const { id } = useParams();
  const { confirm, prompt: promptDialog } = useDialog();
  const toast = useToast();
  const [due, setDue] = useState<DueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ dueDate: '', amount: '', description: '', previousMeterReading: '', currentMeterReading: '', meterConsumption: '', unitPrice: '' });
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetch(`/api/dues/${id}`)
      .then((res) => res.json())
      .then((json) => {
        const d = json.due || null;
        setDue(d);
        if (d) {
          const isMeter = d.dueType && (d.dueType.name === 'مياه' || d.dueType.name === 'كهرباء');
          setEditForm({ dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '', amount: String(d.amount), description: d.description || '', previousMeterReading: d.previousMeterReading || '', currentMeterReading: d.currentMeterReading || '', meterConsumption: d.meterConsumption || '', unitPrice: d.unitPrice ? String(d.unitPrice) : '' });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!due) return;
    const reason = await promptDialog({
      title: 'إلغاء الالتزام',
      description: 'أدخل سبب إلغاء هذا الالتزام.',
      inputLabel: 'سبب الإلغاء',
      inputPlaceholder: 'مثال: تم السداد مبكراً',
      variant: 'warning',
    });
    if (!reason) return;
    console.log('[DUE CANCEL FE] dueId:', id, 'reason:', reason);
    const res = await fetch(`/api/dues/${id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    console.log('[DUE CANCEL FE] res.status:', res.status, 'res.ok:', res.ok);
    if (res.ok) {
      setDue({ ...due, status: 'cancelled', cancellationReason: reason, cancelledAt: new Date().toISOString() });
    } else {
      const d = await res.json();
      console.error('[DUE CANCEL FE] error:', d);
      toast.error(d.error || 'حدث خطأ أثناء إلغاء الالتزام');
    }
  }

  async function handleDelete() {
    if (!due) return;
    const confirmed = await confirm({
      title: 'حذف الالتزام',
      description: 'سيتم حذف الالتزام نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/dues/${id}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/dues';
    } else {
      toast.error('حدث خطأ أثناء حذف الالتزام');
    }
  }

  function isMeterDue(d: DueDetail | null) {
    return d && d.dueType && (d.dueType.name === 'مياه' || d.dueType.name === 'كهرباء');
  }

  function calculateMeterFields(prev: string, curr: string, price: string) {
    const p = parseFloat(prev || '0');
    const c = parseFloat(curr || '0');
    const pr = parseFloat(price || '0');
    const consumption = (!isNaN(c) && !isNaN(p)) ? String(c - p) : '';
    const amount = (consumption && !isNaN(pr)) ? String(parseFloat(consumption) * pr) : '';
    return { consumption, amount };
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault(); setEditError('');
    const payload: any = {};
    if (editForm.dueDate) payload.dueDate = editForm.dueDate;
    if (editForm.amount) payload.amount = editForm.amount;
    if (editForm.description !== undefined) payload.description = editForm.description;
    if (isMeterDue(due)) {
      if (editForm.currentMeterReading) payload.currentMeterReading = editForm.currentMeterReading;
      if (editForm.previousMeterReading) payload.previousMeterReading = editForm.previousMeterReading;
      if (editForm.meterConsumption) payload.meterConsumption = editForm.meterConsumption;
      if (editForm.unitPrice) payload.unitPrice = editForm.unitPrice;
      if (editForm.currentMeterReading && editForm.previousMeterReading) {
        const prev = parseFloat(editForm.previousMeterReading || '0');
        const curr = parseFloat(editForm.currentMeterReading);
        if (isNaN(curr) || curr < prev) {
          setEditError('القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة'); return;
        }
      }
    }
    const res = await fetch(`/api/dues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const data = await res.json();
      setDue(data.due);
      setEditMode(false);
    } else {
      const data = await res.json();
      setEditError(data.error || 'حدث خطأ');
    }
  }

  if (loading) return <LoadingState message="جاري تحميل بيانات الالتزام..." />;
  if (!due) return <EmptyStateMessage title="الالتزام غير موجود" description="تعذر العثور على بيانات الالتزام المطلوب." />;

  const temporal = getTemporalStatus(due);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dues" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> الالتزامات</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">التزام {due.dueNumber}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`status-badge border ${temporal.style}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{temporal.label}
              </span>
              <span className="text-sm text-slate-500">{due.dueType?.name ?? '—'}</span>
              {due.sourceType === 'auto_contract' && <span className="text-xs text-slate-400">(ناتج من عقد)</span>}
              {due.sourceType === 'manual' && <span className="text-xs text-slate-400">(يدوي)</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dues/${id}/print`} target="_blank" className="btn-secondary"><Printer className="h-4 w-4" /> طباعة</Link>
            {due.status === 'approved' && due.sourceType === 'manual' && !editMode && (
              <button onClick={() => setEditMode(true)} className="btn-secondary text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"><Pencil className="h-4 w-4" /> تعديل</button>
            )}
            {due.status === 'approved' && (
              <button onClick={handleCancel} className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"><XCircle className="h-4 w-4" /> إلغاء</button>
            )}
            {due.status === 'cancelled' && (
              <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"><Trash2 className="h-4 w-4" /> حذف نهائي</button>
            )}
          </div>
        </div>
      </div>

      {editMode && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft animate-scale-in">
          {editError && <Alert className="mb-4" title="تعذر حفظ التعديل">{editError}</Alert>}
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="input-premium" required />
              {isMeterDue(due) && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">القراءة السابقة</label>
                    <input type="text" value={editForm.previousMeterReading} readOnly className="input-premium bg-slate-50" />
                  </div>
                  <input type="number" step="0.01" placeholder="القراءة الحالية *" value={editForm.currentMeterReading} onChange={(e) => { const curr = e.target.value; const { consumption, amount } = calculateMeterFields(editForm.previousMeterReading, curr, editForm.unitPrice); setEditForm({ ...editForm, currentMeterReading: curr, meterConsumption: consumption, amount }); }} className="input-premium" required />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">الاستهلاك</label>
                    <input type="text" value={editForm.meterConsumption} readOnly className="input-premium bg-slate-50" />
                  </div>
                  <input type="number" step="0.01" placeholder="سعر الوحدة *" value={editForm.unitPrice} onChange={(e) => { const price = e.target.value; const { consumption, amount } = calculateMeterFields(editForm.previousMeterReading, editForm.currentMeterReading, price); setEditForm({ ...editForm, unitPrice: price, meterConsumption: consumption, amount }); }} className="input-premium" required />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">المبلغ (تلقائي)</label>
                    <input type="text" value={editForm.amount} readOnly className="input-premium bg-slate-50" />
                  </div>
                </>
              )}
              {!isMeterDue(due) && (
                <input type="number" step="0.01" placeholder="المبلغ *" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="input-premium" required />
              )}
              <input placeholder="الوصف (اختياري)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input-premium" />
            </div>
            <div className="mt-4 flex gap-2"><button type="submit" className="btn-primary">حفظ التعديل</button><button type="button" onClick={() => setEditMode(false)} className="btn-secondary">إلغاء</button></div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'النوع', value: due.dueType?.name ?? '—', icon: Tag },
          { label: 'المستأجر', value: due.tenant?.fullName ?? '—', icon: User },
          { label: 'العمارة', value: due.building?.name ?? '—', icon: Building2 },
          { label: 'الوحدة', value: due.unit?.unitNumber ?? '—', icon: Home },
          ...(due.contract ? [{ label: 'العقد', value: due.contract.contractNumber, icon: FileText, link: `/contracts/${due.contract.id}` }] : []),
          { label: 'تاريخ الالتزام', value: new Date(due.dueDate).toLocaleDateString('en-GB'), icon: Calendar },
          { label: 'المبلغ', value: formatCurrency(due.amount), icon: Banknote },
          { label: 'الحالة الزمنية', value: temporal.label, icon: XCircle },
          ...(due.previousMeterReading ? [{ label: 'القراءة السابقة', value: due.previousMeterReading, icon: Tag }] : []),
          ...(due.currentMeterReading ? [{ label: 'القراءة الحالية', value: due.currentMeterReading, icon: Tag }] : []),
          ...(due.meterConsumption ? [{ label: 'الاستهلاك', value: due.meterConsumption, icon: Tag }] : []),
          ...(due.unitPrice ? [{ label: 'سعر الوحدة', value: formatCurrency(due.unitPrice), icon: Tag }] : []),
          ...(due.cancellationReason ? [{ label: 'سبب الإلغاء', value: due.cancellationReason, icon: AlertTriangle }] : []),
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><item.icon className="h-3.5 w-3.5" />{item.label}</div>
            <div className="text-sm font-bold text-slate-900">
              {item.link ? <Link href={item.link} className="text-blue-600 hover:text-blue-700 transition-colors">{item.value}</Link> : item.value}
            </div>
          </div>
        ))}
      </div>

      {due.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><StickyNote className="h-3.5 w-3.5" />البيان</div>
          <p className="text-sm text-slate-700">{due.description}</p>
        </div>
      )}
    </div>
  );
}
