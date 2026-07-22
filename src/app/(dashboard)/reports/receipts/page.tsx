'use client';

import { useEffect, useState } from 'react';

interface ReceiptRow {
  id: string;
  receiptNumber: string;
  tenant: { fullName: string };
  receiptDate: string;
  amount: number;
  paymentMethod: string;
}

export default function ReceiptsReportPage() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/receipts')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  const total = data.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير الدفعات</h2>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">إجمالي الدفعات</div>
        <div className="text-xl font-bold">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">رقم السند</th>
              <th className="px-4 py-3 text-right">المستأجر</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">طريقة الدفع</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.receiptNumber}</td>
                <td className="px-4 py-3">{r.tenant?.fullName}</td>
                <td className="px-4 py-3">{new Date(r.receiptDate).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">{Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{r.paymentMethod === 'cash' ? 'نقداً' : 'شيك'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
