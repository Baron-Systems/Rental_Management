'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoadingState } from '@/components/ui/StatusMessage';

interface ReceiptDetail {
  receiptNumber: string;
  tenant: { fullName: string };
  building: { name: string };
  unit: { unitNumber: string };
  contract: { contractNumber: string } | null;
  receiptDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export default function PrintReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((res) => res.json())
      .then((json) => { setReceipt(json.receipt || null); });
  }, [id]);

  useEffect(() => {
    if (receipt) setTimeout(() => window.print(), 500);
  }, [receipt]);

  if (!receipt) return <LoadingState className="min-h-screen" message="جاري تحميل سند القبض..." />;

  const methodLabels: Record<string, string> = { cash: 'نقداً', cheque: 'شيك', bank_transfer: 'تحويل بنكي', card: 'بطاقة' };
  const r = receipt;

  const rows = [
    { label: 'رقم السند', value: r.receiptNumber },
    { label: 'التاريخ', value: formatDate(r.receiptDate) },
    { label: 'المستأجر', value: r.tenant?.fullName || '-' },
    { label: 'العقار', value: r.building?.name || '-' },
    { label: 'الوحدة', value: r.unit?.unitNumber || '-' },
    ...(r.contract ? [{ label: 'رقم العقد', value: r.contract.contractNumber }] : []),
    { label: 'المبلغ', value: `${formatCurrency(Number(r.amount))} شيكل` },
    { label: 'طريقة الدفع', value: methodLabels[r.paymentMethod] || r.paymentMethod },
    ...(r.referenceNumber ? [{ label: 'رقم المرجع', value: r.referenceNumber }] : []),
    ...(r.notes ? [{ label: 'ملاحظات', value: r.notes }] : []),
  ];

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; }
        }
      `}} />

      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">سند قبض</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-700">رقم السند:</span> {r.receiptNumber}</div>
            <div><span className="font-bold text-slate-700">التاريخ:</span> {formatDate(r.receiptDate)}</div>
          </div>
          <div className="space-y-1 text-left">
            <div><span className="font-bold text-slate-700">المستأجر:</span> {r.tenant?.fullName || '-'}</div>
            {r.contract && (
              <div><span className="font-bold text-slate-700">رقم العقد:</span> {r.contract.contractNumber}</div>
            )}
          </div>
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-900">
            <th className="px-3 py-2 text-right font-bold text-slate-900 w-1/3">البيان</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">التفاصيل</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="px-3 py-2 text-slate-700 font-bold">{row.label}</td>
              <td className="px-3 py-2 text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 border-t-2 border-slate-900 pt-4 text-center text-sm">
        <div className="font-bold text-slate-700 mb-1">المبلغ</div>
        <div className="text-lg font-bold text-emerald-600">{formatCurrency(Number(r.amount))} شيكل</div>
      </div>

    </div>
  );
}
