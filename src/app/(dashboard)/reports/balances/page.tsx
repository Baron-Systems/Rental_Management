'use client';

import { useEffect, useState } from 'react';
import { LoadingState } from '@/components/ui/StatusMessage';
import Link from 'next/link';

interface BalanceRow {
  tenantId: string;
  tenantName: string;
  phone: string | null;
  building: string;
  unit: string;
  totalDues: number;
  totalReceipts: number;
  balance: number;
}

export default function BalancesReportPage() {
  const [data, setData] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/balances')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="جاري تحميل تقرير الأرصدة..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير أرصدة المستأجرين</h2>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">المستأجر</th>
              <th className="px-4 py-3 text-right">الهاتف</th>
              <th className="px-4 py-3 text-right">العمارة</th>
              <th className="px-4 py-3 text-right">الوحدة</th>
              <th className="px-4 py-3 text-right">الالتزامات</th>
              <th className="px-4 py-3 text-right">الدفعات</th>
              <th className="px-4 py-3 text-right">الرصيد</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.tenantId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/tenants/${row.tenantId}`} className="font-medium text-blue-600 hover:underline">
                    {row.tenantName}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.phone || '-'}</td>
                <td className="px-4 py-3">{row.building}</td>
                <td className="px-4 py-3">{row.unit}</td>
                <td className="px-4 py-3">{row.totalDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{row.totalReceipts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className={`px-4 py-3 font-bold ${row.balance > 0 ? 'text-red-600' : row.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
