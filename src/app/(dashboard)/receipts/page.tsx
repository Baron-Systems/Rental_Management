'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Eye, Search, User, Calendar, Banknote, Wallet, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';

interface Receipt {
  id: string;
  receiptNumber: string;
  tenant: { fullName: string };
  receiptDate: string;
  amount: number;
  paymentMethod: string;
}

const paymentMethodLabels: Record<string, string> = { cash: 'نقداً', cheque: 'شيك' };

export default function ReceiptsPage() {
  const { confirm } = useDialog();
  const toast = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tenantId: '', receiptDate: new Date().toISOString().split('T')[0], amount: '', paymentMethod: 'cash', notes: '' });
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<{ id: string; fullName: string }[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadReceipts(); loadTenants(); }, []);
  async function loadReceipts() { const res = await fetch('/api/receipts'); const data = await res.json(); setReceipts(data.receipts || []); setLoading(false); }
  async function loadTenants() { const res = await fetch('/api/tenants'); const data = await res.json(); setTenants((data.tenants || []).map((t: any) => ({ id: t.id, fullName: t.fullName }))); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    console.log('[Receipts Form] Submitting:', formData);
    const res = await fetch('/api/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    if (res.ok) { setFormData({ tenantId: '', receiptDate: new Date().toISOString().split('T')[0], amount: '', paymentMethod: 'cash', notes: '' }); setShowForm(false); loadReceipts(); }
    else { const data = await res.json(); console.error('[Receipts Form] Error response:', data); setError(data.error || 'حدث خطأ'); }
  }
  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'حذف سند القبض',
      description: 'سيتم حذف سند القبض نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    if (res.ok) loadReceipts();
    else toast.error('حدث خطأ أثناء حذف سند القبض');
  }

  const filtered = useMemo(() => {
    let list = receipts;
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter((r) => r.receiptNumber.toLowerCase().includes(q) || r.tenant?.fullName.toLowerCase().includes(q)); }
    return list;
  }, [receipts, search]);

  const stats = useMemo(() => ({
    total: receipts.length,
    totalAmount: receipts.reduce((s, r) => s + r.amount, 0),
  }), [receipts]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">سندات القبض</h1>
          <p className="mt-1 text-sm text-slate-500">تسجيل وإدارة دفعات المستأجرين</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" /> إنشاء سند قبض
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {[
          { label: 'إجمالي السندات', value: stats.total, icon: Banknote, color: 'bg-slate-50 text-slate-700' },
          { label: 'إجمالي المبالغ', value: formatCurrency(stats.totalAmount), icon: Wallet, color: 'bg-blue-50 text-blue-700' },
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
          {error && <Alert className="mb-4" title="تعذر الحفظ">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select value={formData.tenantId} onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })} className="select-premium" required>
                <option value="">اختر المستأجر *</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              <input type="date" value={formData.receiptDate} onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })} className="input-premium" required />
              <input type="number" step="0.01" placeholder="المبلغ *" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-premium" required />
              <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="select-premium">
                <option value="cash">نقداً</option><option value="cheque">شيك</option>
              </select>
              <input placeholder="ملاحظات" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-premium" />
            </div>
            <div className="mt-4 flex gap-2"><button type="submit" className="btn-primary">حفظ</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button></div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث برقم السند أو المستأجر..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-premium w-full pr-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم السند</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">طريقة الدفع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12"><EmptyState title="لا توجد سندات قبض" description="لم يتم العثور على سندات قبض مطابقة." actionLabel="إنشاء سند قبض" onAction={() => setShowForm(true)} className="border-0 shadow-none" /></td></tr>
              ) : (filtered.map((r) => (
                <tr key={r.id} className="table-row-hover group">
                  <td className="px-4 py-3"><Link href={`/receipts/${r.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{r.receiptNumber}</Link></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-700"><User className="h-3 w-3" />{r.tenant?.fullName}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Calendar className="h-3 w-3" />{new Date(r.receiptDate).toLocaleDateString('en-GB')}</div></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">{paymentMethodLabels[r.paymentMethod] || r.paymentMethod}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/receipts/${r.id}`} className="btn-ghost" title="عرض"><Eye className="h-4 w-4" /></Link>
                      <button onClick={() => handleDelete(r.id)} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" title="حذف"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">إجمالي: {filtered.length} سند</div>
      </div>
    </div>
  );
}
