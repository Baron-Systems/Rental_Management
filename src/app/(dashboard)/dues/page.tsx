'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Eye, Search, User, Building2, Home, Calendar, Receipt, Wallet, CheckCircle, XCircle, Pencil, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';

interface Due {
  id: string;
  dueNumber: string;
  tenantId: string;
  tenant: { fullName: string };
  building: { name: string } | null;
  unitId: string | null;
  unit: { unitNumber: string } | null;
  contract: { contractNumber: string } | null;
  dueTypeId: string;
  dueType: { name: string };
  dueDate: string;
  transactionDate: string;
  amount: number;
  description: string | null;
  status: string;
  sourceType: string;
  cancellationReason: string | null;
  previousMeterReading: string | null;
  currentMeterReading: string | null;
  meterConsumption: string | null;
  unitPrice: number | null;
}

interface Unit {
  id: string;
  unitNumber: string;
  building: { name: string };
  currentWaterMeterReading: string | null;
  currentElectricityMeterReading: string | null;
}

function getTemporalStatus(d: Due): { label: string; style: string } {
  if (d.status === 'cancelled') return { label: 'ملغي', style: 'bg-red-50 text-red-700 border-red-200' };
  const due = new Date(d.dueDate); due.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (due > today) return { label: 'مستقبلي', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'مستحق', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export default function DuesPage() {
  const { confirm, prompt: promptDialog } = useDialog();
  const toast = useToast();
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tenantId: '', dueTypeId: '', dueDate: new Date().toISOString().split('T')[0], amount: '', description: '', unitId: '', previousMeterReading: '', currentMeterReading: '', meterConsumption: '', unitPrice: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ tenantId: '', tenantName: '', dueTypeId: '', dueDate: '', amount: '', description: '', unitId: '', previousMeterReading: '', currentMeterReading: '', meterConsumption: '', unitPrice: '' });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [tenants, setTenants] = useState<{ id: string; fullName: string }[]>([]);
  const [dueTypes, setDueTypes] = useState<{ id: string; name: string }[]>([]);
  const [formUnits, setFormUnits] = useState<Unit[]>([]);
  const [editUnits, setEditUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => { loadDues(); loadTenants(); loadDueTypes(); }, []);

  async function loadDues() { const res = await fetch('/api/dues'); const data = await res.json(); setDues(data.dues || []); setLoading(false); }
  async function loadTenants() { const res = await fetch('/api/tenants'); const data = await res.json(); setTenants((data.tenants || []).map((t: any) => ({ id: t.id, fullName: t.fullName }))); }
  async function loadDueTypes() { const res = await fetch('/api/settings/due-types'); const data = await res.json(); setDueTypes(data.dueTypes || []); }
  async function loadUnitsForTenant(tenantId: string) { const res = await fetch(`/api/units?tenantId=${tenantId}`); const data = await res.json(); return (data.units || []) as Unit[]; }

  function isMeterDueType(dueTypeId: string) {
    const dt = dueTypes.find((d) => d.id === dueTypeId);
    return dt && (dt.name === 'مياه' || dt.name === 'كهرباء');
  }

  function getDueTypeName(dueTypeId: string) {
    return dueTypes.find((d) => d.id === dueTypeId)?.name || '';
  }

  function getPreviousReading(unit: Unit | undefined, dueTypeId: string) {
    if (!unit) return '0';
    const name = getDueTypeName(dueTypeId);
    if (name === 'مياه') return unit.currentWaterMeterReading || '0';
    if (name === 'كهرباء') return unit.currentElectricityMeterReading || '0';
    return '0';
  }

  function calculateMeterFields(prev: string, curr: string, price: string) {
    const p = parseFloat(prev || '0');
    const c = parseFloat(curr || '0');
    const pr = parseFloat(price || '0');
    const consumption = (!isNaN(c) && !isNaN(p)) ? String(c - p) : '';
    const amount = (consumption && !isNaN(pr)) ? String(parseFloat(consumption) * pr) : '';
    return { consumption, amount };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const payload = { ...formData };
    if (isMeterDueType(formData.dueTypeId)) {
      if (!formData.currentMeterReading || formData.currentMeterReading.trim() === '') {
        setError('القراءة الحالية مطلوبة'); return;
      }
      if (!formData.unitPrice || formData.unitPrice.trim() === '') {
        setError('سعر الوحدة مطلوب'); return;
      }
      const prev = parseFloat(formData.previousMeterReading || '0');
      const curr = parseFloat(formData.currentMeterReading);
      if (isNaN(curr) || curr < prev) {
        setError('القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة'); return;
      }
      payload.meterConsumption = formData.meterConsumption || String(curr - prev);
      payload.amount = formData.amount || String(parseFloat(payload.meterConsumption) * parseFloat(formData.unitPrice));
    }
    const res = await fetch('/api/dues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setFormData({ tenantId: '', dueTypeId: '', dueDate: new Date().toISOString().split('T')[0], amount: '', description: '', unitId: '', previousMeterReading: '', currentMeterReading: '', meterConsumption: '', unitPrice: '' }); setShowForm(false); loadDues(); }
    else { const data = await res.json(); setError(data.error || 'حدث خطأ'); }
  }

  async function handleCancel(id: string) {
    const reason = await promptDialog({
      title: 'إلغاء الالتزام',
      description: 'أدخل سبب إلغاء هذا الالتزام.',
      inputLabel: 'سبب الإلغاء',
      inputPlaceholder: 'مثال: تم السداد مبكراً',
      variant: 'warning',
    });
    if (!reason) return;
    const res = await fetch(`/api/dues/${id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    if (res.ok) {
      loadDues();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error + (d.detail ? ' - ' + d.detail : '') || 'حدث خطأ أثناء إلغاء الالتزام');
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'حذف الالتزام',
      description: 'سيتم حذف الالتزام نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/dues/${id}`, { method: 'DELETE' });
    if (res.ok) loadDues(); else toast.error('حدث خطأ أثناء حذف الالتزام');
  }

  function startEdit(d: Due) {
    setEditId(d.id);
    setEditData({ tenantId: d.tenantId, tenantName: d.tenant?.fullName || '', dueTypeId: d.dueTypeId || '', dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '', amount: String(d.amount), description: d.description || '', unitId: d.unitId || '', previousMeterReading: d.previousMeterReading || '', currentMeterReading: d.currentMeterReading || '', meterConsumption: d.meterConsumption || '', unitPrice: d.unitPrice ? String(d.unitPrice) : '' });
    setEditError('');
    loadUnitsForTenant(d.tenantId).then(setEditUnits);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault(); setEditError(''); if (!editId) return;
    const payload: any = {};
    if (editData.unitId) payload.unitId = editData.unitId;
    if (editData.dueTypeId) payload.dueTypeId = editData.dueTypeId;
    if (editData.dueDate) payload.dueDate = editData.dueDate;
    if (editData.amount) payload.amount = editData.amount;
    if (editData.description !== undefined) payload.description = editData.description;
    if (isMeterDueType(editData.dueTypeId)) {
      if (editData.currentMeterReading) payload.currentMeterReading = editData.currentMeterReading;
      if (editData.previousMeterReading) payload.previousMeterReading = editData.previousMeterReading;
      if (editData.meterConsumption) payload.meterConsumption = editData.meterConsumption;
      if (editData.unitPrice) payload.unitPrice = editData.unitPrice;
      if (editData.currentMeterReading && editData.previousMeterReading) {
        const prev = parseFloat(editData.previousMeterReading || '0');
        const curr = parseFloat(editData.currentMeterReading);
        if (isNaN(curr) || curr < prev) {
          setEditError('القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة'); return;
        }
      }
    }
    const res = await fetch(`/api/dues/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setEditId(null); loadDues(); }
    else { const data = await res.json(); setEditError(data.error || 'حدث خطأ'); }
  }

  const filtered = useMemo(() => {
    let list = dues;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.dueNumber.toLowerCase().includes(q) || d.tenant?.fullName.toLowerCase().includes(q) || d.dueType?.name.toLowerCase().includes(q) || (d.building?.name || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'cancelled') list = list.filter((d) => d.status === 'cancelled');
      else if (statusFilter === 'due') list = list.filter((d) => d.status === 'approved' && getTemporalStatus(d).label === 'مستحق');
      else if (statusFilter === 'future') list = list.filter((d) => d.status === 'approved' && getTemporalStatus(d).label === 'مستقبلي');
    }
    return list;
  }, [dues, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const total = dues.filter((d) => d.status !== 'cancelled').length;
    const due = dues.filter((d) => d.status === 'approved' && new Date(d.dueDate).setHours(0,0,0,0) <= today.getTime()).length;
    const future = dues.filter((d) => d.status === 'approved' && new Date(d.dueDate).setHours(0,0,0,0) > today.getTime()).length;
    const cancelled = dues.filter((d) => d.status === 'cancelled').length;
    return { total, due, future, cancelled };
  }, [dues]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">الالتزامات</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة الالتزامات المالية للمستأجرين</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" /> إضافة التزام
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إجمالي الالتزامات', value: stats.total, icon: Receipt, color: 'bg-slate-50 text-slate-700' },
          { label: 'المستحق حتى اليوم', value: stats.due, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'الالتزامات المستقبلية', value: stats.future, icon: Calendar, color: 'bg-amber-50 text-amber-700' },
          { label: 'الملغي', value: stats.cancelled, icon: XCircle, color: 'bg-red-50 text-red-700' },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md ${s.color}`}><Icon className="h-3.5 w-3.5" /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-900">{s.value}</p></div>
            </div>
          </div>
        ); })}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft animate-scale-in">
          {error && <Alert className="mb-4" title="تعذر حفظ الالتزام">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select value={formData.tenantId} onChange={async (e) => { const tenantId = e.target.value; setFormData({ ...formData, tenantId, unitId: '', previousMeterReading: '', currentMeterReading: '', meterConsumption: '', unitPrice: '', amount: '' }); if (tenantId) { const units = await loadUnitsForTenant(tenantId); setFormUnits(units); } else { setFormUnits([]); } }} className="select-premium" required>
                <option value="">اختر المستأجر *</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              <select value={formData.unitId} onChange={(e) => { const unitId = e.target.value; const unit = formUnits.find((u) => u.id === unitId); const prev = unit ? getPreviousReading(unit, formData.dueTypeId) : '0'; setFormData({ ...formData, unitId, previousMeterReading: prev }); }} className="select-premium" required>
                <option value="">اختر الوحدة *</option>
                {formUnits.map((u) => <option key={u.id} value={u.id}>{u.building?.name} - {u.unitNumber}</option>)}
              </select>
              <select value={formData.dueTypeId} onChange={(e) => { const dueTypeId = e.target.value; const unit = formUnits.find((u) => u.id === formData.unitId); const prev = unit ? getPreviousReading(unit, dueTypeId) : '0'; const meter = isMeterDueType(dueTypeId); setFormData({ ...formData, dueTypeId, previousMeterReading: prev, currentMeterReading: meter ? formData.currentMeterReading : '', meterConsumption: meter ? formData.meterConsumption : '', unitPrice: meter ? formData.unitPrice : '', amount: meter ? formData.amount : '' }); }} className="select-premium" required>
                <option value="">اختر نوع الالتزام *</option>
                {dueTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
              </select>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="input-premium" required />
              {isMeterDueType(formData.dueTypeId) && (
                <>
                  <div className="col-span-1 md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-500">بيانات العداد</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">القراءة السابقة (من تفاصيل الوحدة)</label>
                        <input type="text" value={formData.previousMeterReading} readOnly className="input-premium bg-slate-100" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">القراءة الحالية *</label>
                        <input type="number" step="0.01" placeholder="أدخل القراءة الجديدة" value={formData.currentMeterReading} onChange={(e) => { const curr = e.target.value; const { consumption, amount } = calculateMeterFields(formData.previousMeterReading, curr, formData.unitPrice); setFormData({ ...formData, currentMeterReading: curr, meterConsumption: consumption, amount }); }} className="input-premium" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">الاستهلاك</label>
                        <input type="text" value={formData.meterConsumption} readOnly className="input-premium bg-slate-100" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">سعر الوحدة *</label>
                        <input type="number" step="0.01" placeholder="مثال: 0.15" value={formData.unitPrice} onChange={(e) => { const price = e.target.value; const { consumption, amount } = calculateMeterFields(formData.previousMeterReading, formData.currentMeterReading, price); setFormData({ ...formData, unitPrice: price, meterConsumption: consumption, amount }); }} className="input-premium" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">المبلغ (تلقائي)</label>
                        <input type="text" value={formData.amount} readOnly className="input-premium bg-slate-100" />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!isMeterDueType(formData.dueTypeId) && (
                <input type="number" step="0.01" placeholder="المبلغ *" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-premium" required />
              )}
              <input placeholder="الوصف (اختياري)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-premium" />
            </div>
            <div className="mt-4 flex gap-2"><button type="submit" className="btn-primary">حفظ</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button></div>
          </form>
        </div>
      )}

      {editId && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft animate-scale-in">
          {editError && <Alert className="mb-4" title="تعذر حفظ التعديل">{editError}</Alert>}
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                <span>{(editData as any).tenantName || ''}</span>
              </div>
              <select value={editData.unitId} onChange={(e) => setEditData({ ...editData, unitId: e.target.value })} className="select-premium" required>
                <option value="">اختر الوحدة *</option>
                {editUnits.map((u) => <option key={u.id} value={u.id}>{u.building?.name} - {u.unitNumber}</option>)}
              </select>
              <select value={editData.dueTypeId} onChange={(e) => { const dueTypeId = e.target.value; const unit = editUnits.find((u) => u.id === editData.unitId); const prev = unit ? getPreviousReading(unit, dueTypeId) : '0'; const meter = isMeterDueType(dueTypeId); setEditData({ ...editData, dueTypeId, previousMeterReading: prev, currentMeterReading: meter ? editData.currentMeterReading : '', meterConsumption: meter ? editData.meterConsumption : '', unitPrice: meter ? editData.unitPrice : '', amount: meter ? editData.amount : '' }); }} className="select-premium" required>
                <option value="">اختر نوع الالتزام *</option>
                {dueTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
              </select>
              <input type="date" value={editData.dueDate} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} className="input-premium" required />
              {isMeterDueType(editData.dueTypeId) && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">القراءة السابقة</label>
                    <input type="text" value={editData.previousMeterReading} readOnly className="input-premium bg-slate-50" />
                  </div>
                  <input type="number" step="0.01" placeholder="القراءة الحالية *" value={editData.currentMeterReading} onChange={(e) => { const curr = e.target.value; const { consumption, amount } = calculateMeterFields(editData.previousMeterReading, curr, editData.unitPrice); setEditData({ ...editData, currentMeterReading: curr, meterConsumption: consumption, amount }); }} className="input-premium" required />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">الاستهلاك</label>
                    <input type="text" value={editData.meterConsumption} readOnly className="input-premium bg-slate-50" />
                  </div>
                  <input type="number" step="0.01" placeholder="سعر الوحدة *" value={editData.unitPrice} onChange={(e) => { const price = e.target.value; const { consumption, amount } = calculateMeterFields(editData.previousMeterReading, editData.currentMeterReading, price); setEditData({ ...editData, unitPrice: price, meterConsumption: consumption, amount }); }} className="input-premium" required />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">المبلغ (تلقائي)</label>
                    <input type="text" value={editData.amount} readOnly className="input-premium bg-slate-50" />
                  </div>
                </>
              )}
              {!isMeterDueType(editData.dueTypeId) && (
                <input type="number" step="0.01" placeholder="المبلغ *" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} className="input-premium" required />
              )}
              <input placeholder="الوصف (اختياري)" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="input-premium" />
            </div>
            <div className="mt-4 flex gap-2"><button type="submit" className="btn-primary">حفظ التعديل</button><button type="button" onClick={() => setEditId(null)} className="btn-secondary">إلغاء</button></div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث برقم الالتزام أو المستأجر..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-premium w-full pr-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-premium text-sm">
          <option value="all">كل الحالات</option>
          <option value="due">مستحق</option>
          <option value="future">مستقبلي</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم الالتزام</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر / الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">تاريخ الالتزام</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة الزمنية</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12"><EmptyState title="لا توجد التزامات" description="لم يتم العثور على التزامات مطابقة." actionLabel="إضافة التزام" onAction={() => setShowForm(true)} className="border-0 shadow-none" /></td></tr>
              ) : (filtered.map((d) => {
                const temporal = getTemporalStatus(d);
                return (
                <tr key={d.id} className={`table-row-hover group ${d.status === 'cancelled' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/dues/${d.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{d.dueNumber}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-700"><User className="h-3 w-3" />{d.tenant?.fullName}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Home className="h-3 w-3" />{d.building?.name || '—'} / {d.unit?.unitNumber || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{d.dueType?.name}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Calendar className="h-3 w-3" />{new Date(d.dueDate).toLocaleDateString('en-GB')}</div></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-3"><span className={`status-badge border ${temporal.style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{temporal.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/dues/${d.id}`} className="btn-ghost" title="عرض"><Eye className="h-4 w-4" /></Link>
                      {d.status === 'approved' && d.sourceType === 'manual' && (
                        <button onClick={() => startEdit(d)} className="btn-ghost text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="تعديل"><Pencil className="h-4 w-4" /></button>
                      )}
                      {d.status === 'approved' && (
                        <button onClick={() => handleCancel(d.id)} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" title="إلغاء"><XCircle className="h-4 w-4" /></button>
                      )}
                      {d.status === 'cancelled' && (
                        <button onClick={() => handleDelete(d.id)} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" title="حذف نهائي"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ); }))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">إجمالي: {filtered.length} التزام</div>
      </div>
    </div>
  );
}
