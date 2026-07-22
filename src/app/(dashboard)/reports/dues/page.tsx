'use client';

import { useEffect, useState } from 'react';

interface DueRow {
  id: string;
  dueNumber: string;
  tenant: { fullName: string };
  building: { name: string } | null;
  unit: { unitNumber: string } | null;
  contract: { contractNumber: string } | null;
  dueType: { name: string };
  transactionDate: string;
  amount: number;
  description: string | null;
  status: string;
}

export default function DuesReportPage() {
  const [data, setData] = useState<DueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dues')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  const total = data.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير الالتزامات</h2>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">إجمالي الالتزامات</div>
        <div className="text-xl font-bold">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">رقم الالتزام</th>
              <th className="px-4 py-3 text-right">المستأجر</th>
              <th className="px-4 py-3 text-right">النوع</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((d) => (
              <tr key={d.id} className={`hover:bg-gray-50 ${d.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">{d.dueNumber}</td>
                <td className="px-4 py-3">{d.tenant?.fullName}</td>
                <td className="px-4 py-3">{d.dueType?.name}</td>
                <td className="px-4 py-3">{new Date(d.transactionDate).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">{Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${d.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {d.status === 'approved' ? 'معتمد' : 'ملغي'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
