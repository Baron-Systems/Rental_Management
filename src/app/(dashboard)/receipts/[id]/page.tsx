'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User, Building2, Home, Calendar, Banknote, Printer, Trash2, FileText, StickyNote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReceiptDetail {
  id: string;
  receiptNumber: string;
  tenant: { fullName: string };
  building: { name: string };
  unit: { unitNumber: string };
  contract: { contractNumber: string };
  receiptDate: string;
  amount: number;
  description: string | null;
}

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((res) => res.json())
      .then((json) => { setReceipt(json.receipt || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!receipt) return;
    if (!confirm('هل أنت متأكد من حذف سند القبض؟')) return;
    const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/receipts';
    } else {
      const d = await res.json();
      alert(d.error || 'حدث خطأ');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">جاري التحميل...</div>;
  if (!receipt) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">السند غير موجود</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/receipts" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> الدفعات</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">سند قبض {receipt.receiptNumber}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-slate-500">{formatCurrency(receipt.amount)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/receipts/${id}/print`} target="_blank" className="btn-secondary"><Printer className="h-4 w-4" /> طباعة</Link>
            <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"><Trash2 className="h-4 w-4" /> حذف</button>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'المستأجر', value: receipt.tenant?.fullName || '—', icon: User },
          { label: 'العمارة', value: receipt.building?.name || '—', icon: Building2 },
          { label: 'الوحدة', value: receipt.unit?.unitNumber || '—', icon: Home },
          { label: 'العقد', value: receipt.contract?.contractNumber || '—', icon: FileText, link: receipt.contract ? `/contracts/${receipt.contract.contractNumber}` : undefined },
          { label: 'التاريخ', value: new Date(receipt.receiptDate).toLocaleDateString('en-GB'), icon: Calendar },
          { label: 'المبلغ', value: formatCurrency(receipt.amount), icon: Banknote },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><item.icon className="h-3.5 w-3.5" />{item.label}</div>
            <div className="text-sm font-bold text-slate-900">
              {item.link ? <Link href={item.link} className="text-blue-600 hover:text-blue-700 transition-colors">{item.value}</Link> : item.value}
            </div>
          </div>
        ))}
      </div>

      {receipt.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><StickyNote className="h-3.5 w-3.5" />البيان</div>
          <p className="text-sm text-slate-700">{receipt.description}</p>
        </div>
      )}
    </div>
  );
}
