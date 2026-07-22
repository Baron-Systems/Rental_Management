'use client';

import { useEffect, useState } from 'react';

interface ContractRow {
  contractNumber: string;
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: string;
}

export default function ContractsReportPage() {
  const [data, setData] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/contracts')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  const statusLabels: Record<string, string> = {
    draft: 'مسودة', active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', evicted: 'تم الإخلاء',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير العقود</h2>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">رقم العقد</th>
              <th className="px-4 py-3 text-right">المستأجر</th>
              <th className="px-4 py-3 text-right">العمارة</th>
              <th className="px-4 py-3 text-right">الوحدة</th>
              <th className="px-4 py-3 text-right">الفترة</th>
              <th className="px-4 py-3 text-right">القيمة</th>
              <th className="px-4 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3">{c.contractNumber}</td>
                <td className="px-4 py-3">{c.tenantName}</td>
                <td className="px-4 py-3">{c.buildingName}</td>
                <td className="px-4 py-3">{c.unitNumber}</td>
                <td className="px-4 py-3">{new Date(c.startDate).toLocaleDateString('en-GB')} - {new Date(c.endDate).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">{Number(c.rentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{statusLabels[c.status] || c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
