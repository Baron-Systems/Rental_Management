'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoadingState } from '@/components/ui/StatusMessage';

interface StatementLine {
  id: string; date: string; type: 'due' | 'receipt'; typeName: string;
  description: string; reference: string; debit: number; credit: number; balance: number;
}

export default function TenantStatementPage() {
  const { id } = useParams();
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [summary, setSummary] = useState({ openingBalance: 0, totalDues: 0, totalReceipts: 0, closingBalance: 0 });
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTenant(data.tenant);
        if (data.statement) {
          setLines(data.statement.lines);
          setSummary({
            openingBalance: data.statement.openingBalance,
            totalDues: data.statement.totalDues,
            totalReceipts: data.statement.totalReceipts,
            closingBalance: data.statement.closingBalance,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="جاري تحميل كشف الحساب..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">كشف حساب: {tenant?.fullName}</h2>
        <button onClick={() => window.print()} className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">طباعة</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">الرصيد الافتتاحي</div>
          <div className="text-xl font-bold">{summary.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">إجمالي الالتزامات</div>
          <div className="text-xl font-bold text-red-600">{summary.totalDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">إجمالي الدفعات</div>
          <div className="text-xl font-bold text-green-600">{summary.totalReceipts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">الرصيد الختامي</div>
          <div className={`text-xl font-bold ${summary.closingBalance > 0 ? 'text-red-600' : summary.closingBalance < 0 ? 'text-green-600' : ''}`}>
            {summary.closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">المرجع</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">النوع</th>
              <th className="px-4 py-3 text-right">المبلغ المستحق</th>
              <th className="px-4 py-3 text-right">المبلغ المدفوع</th>
              <th className="px-4 py-3 text-right">الرصيد</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{l.reference || '-'}</td>
                <td className="px-4 py-3">{new Date(l.date).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">{l.type === 'due' ? 'التزام' : 'سند قبض'}</td>
                <td className="px-4 py-3 text-red-600">{l.debit > 0 ? l.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                <td className="px-4 py-3 text-green-600">{l.credit > 0 ? l.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                <td className="px-4 py-3 font-bold">{l.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
