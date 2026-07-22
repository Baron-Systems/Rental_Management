'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface StatementLine {
  id: string;
  date: string;
  type: string;
  typeName: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PrintData {
  tenant: {
    fullName: string;
    nationalId: string | null;
  };
  contract: {
    contractNumber: string;
    building: { name: string };
    unit: { unitNumber: string };
  } | null;
  statement: {
    lines: StatementLine[];
    totalDues: number;
    totalReceipts: number;
    closingBalance: number;
  };
  reportDate: string;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export default function TenantPrintPage() {
  const { id } = useParams();
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${id}/print-statement`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
        setTimeout(() => window.print(), 500);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center p-10 text-sm text-slate-500">جاري التحميل...</div>;
  if (!data) return <div className="text-center p-10 text-sm text-slate-500">المستأجر غير موجود</div>;

  const { tenant, contract, statement, reportDate } = data;

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; }
        }
      `}} />

      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">كشف حساب المستأجر</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-700">اسم المستأجر:</span> {tenant.fullName}</div>
            <div><span className="font-bold text-slate-700">رقم الهوية:</span> {tenant.nationalId || '-'}</div>
            {contract && (
              <div><span className="font-bold text-slate-700">رقم العقد:</span> {contract.contractNumber}</div>
            )}
          </div>
          <div className="space-y-1 text-left">
            {contract && (
              <>
                <div><span className="font-bold text-slate-700">المبنى:</span> {contract.building.name}</div>
                <div><span className="font-bold text-slate-700">الوحدة:</span> {contract.unit.unitNumber}</div>
              </>
            )}
            <div><span className="font-bold text-slate-700">تاريخ إصدار التقرير:</span> {formatDate(reportDate)}</div>
          </div>
        </div>
      </div>

      {/* Statement Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-900">
            <th className="px-3 py-2 text-right font-bold text-slate-900">التاريخ</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">النوع</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">المرجع</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">المبلغ المستحق</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">المبلغ المدفوع</th>
            <th className="px-3 py-2 text-right font-bold text-slate-900">الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {statement.lines.map((line, i) => (
            <tr key={`${line.id}-${i}`} className="border-b border-slate-200">
              <td className="px-3 py-2 text-slate-700">{formatDate(line.date)}</td>
              <td className="px-3 py-2 text-slate-700">{line.typeName}</td>
              <td className="px-3 py-2 text-slate-700">{line.reference || '-'}</td>
              <td className="px-3 py-2 text-red-600 text-right">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
              <td className="px-3 py-2 text-emerald-600 text-right">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
              <td className="px-3 py-2 font-bold text-slate-900 text-right">{formatCurrency(line.balance)}</td>
            </tr>
          ))}
          {statement.lines.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-500">لا توجد حركات</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer Summary */}
      <div className="mt-6 border-t-2 border-slate-900 pt-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-slate-700 mb-1">إجمالي المستحقات</div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(statement.totalDues)}</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-slate-700 mb-1">إجمالي المدفوعات</div>
            <div className="text-lg font-bold text-emerald-600">{formatCurrency(statement.totalReceipts)}</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-slate-700 mb-1">الرصيد الحالي</div>
            <div className={`text-lg font-bold ${statement.closingBalance > 0 ? 'text-red-600' : statement.closingBalance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatCurrency(statement.closingBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
