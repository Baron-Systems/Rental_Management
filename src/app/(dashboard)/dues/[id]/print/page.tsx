'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoadingState } from '@/components/ui/StatusMessage';

interface DueDetail {
  dueNumber: string;
  dueType: { name: string };
  tenant: { fullName: string };
  building: { name: string };
  unit: { unitNumber: string };
  contract: { contractNumber: string } | null;
  transactionDate: string;
  dueDate: string;
  amount: number;
  description: string | null;
  status: string;
  cancellationReason: string | null;
  referenceNumber: string | null;
  notes: string | null;
  previousMeterReading: string | null;
  currentMeterReading: string | null;
  meterConsumption: string | null;
  unitPrice: number | null;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

function isMeterDue(d: DueDetail | null) {
  return d && (d.dueType?.name === 'مياه' || d.dueType?.name === 'كهرباء');
}

export default function PrintDuePage() {
  const { id } = useParams();
  const [due, setDue] = useState<DueDetail | null>(null);

  useEffect(() => {
    fetch(`/api/dues/${id}`)
      .then((res) => res.json())
      .then((json) => { setDue(json.due || null); });
  }, [id]);

  useEffect(() => {
    if (due) setTimeout(() => window.print(), 500);
  }, [due]);

  if (!due) return <LoadingState className="min-h-screen" message="جاري تحميل سند الالتزام..." />;

  const d = due;
  const meter = isMeterDue(d);

  const rows = [
    { label: 'رقم السند', value: d.dueNumber },
    { label: 'نوع الالتزام', value: d.dueType?.name || '-' },
    { label: 'التاريخ', value: formatDate(d.transactionDate) },
    { label: 'تاريخ الاستحقاق', value: formatDate(d.dueDate) },
    { label: 'المستأجر', value: d.tenant?.fullName || '-' },
    { label: 'العقار', value: d.building?.name || '-' },
    { label: 'الوحدة', value: d.unit?.unitNumber || '-' },
    ...(d.contract ? [{ label: 'رقم العقد', value: d.contract.contractNumber }] : []),
    ...(d.referenceNumber ? [{ label: 'رقم المرجع', value: d.referenceNumber }] : []),
    ...(d.description ? [{ label: 'البيان', value: d.description }] : []),
    ...(d.notes ? [{ label: 'ملاحظات', value: d.notes }] : []),
    ...(d.status === 'cancelled' && d.cancellationReason ? [{ label: 'سبب الإلغاء', value: d.cancellationReason }] : []),
  ];

  const meterRows = meter ? [
    { label: 'القراءة السابقة', value: d.previousMeterReading || '-' },
    { label: 'القراءة الحالية', value: d.currentMeterReading || '-' },
    { label: 'الاستهلاك', value: d.meterConsumption || '-' },
    { label: 'سعر الوحدة', value: d.unitPrice ? `${formatCurrency(d.unitPrice)} شيكل` : '-' },
  ] : [];

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; }
        }
      `}} />

      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">سند التزام</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-700">رقم السند:</span> {d.dueNumber}</div>
            <div><span className="font-bold text-slate-700">التاريخ:</span> {formatDate(d.transactionDate)}</div>
          </div>
          <div className="space-y-1 text-left">
            <div><span className="font-bold text-slate-700">المستأجر:</span> {d.tenant?.fullName || '-'}</div>
            {d.contract && (
              <div><span className="font-bold text-slate-700">رقم العقد:</span> {d.contract.contractNumber}</div>
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
          {meterRows.length > 0 && (
            <tr className="border-b border-slate-200">
              <td colSpan={2} className="px-3 py-3">
                <div className="font-bold text-slate-900 mb-2">بيانات العداد</div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300">
                      <th className="px-2 py-1 text-right font-bold text-slate-700">القراءة السابقة</th>
                      <th className="px-2 py-1 text-right font-bold text-slate-700">القراءة الحالية</th>
                      <th className="px-2 py-1 text-right font-bold text-slate-700">الاستهلاك</th>
                      <th className="px-2 py-1 text-right font-bold text-slate-700">سعر الوحدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 text-slate-900">{d.previousMeterReading || '-'}</td>
                      <td className="px-2 py-1 text-slate-900">{d.currentMeterReading || '-'}</td>
                      <td className="px-2 py-1 text-slate-900">{d.meterConsumption || '-'}</td>
                      <td className="px-2 py-1 text-slate-900">{d.unitPrice ? `${formatCurrency(d.unitPrice)} شيكل` : '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 border-t-2 border-slate-900 pt-4 text-center text-sm">
        <div className="font-bold text-slate-700 mb-1">المبلغ</div>
        <div className={`text-lg font-bold ${d.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-red-600'}`}>
          {formatCurrency(Number(d.amount))} شيكل
        </div>
        {d.status === 'cancelled' && (
          <div className="text-xs text-red-600 mt-1">ملغي</div>
        )}
      </div>

    </div>
  );
}
