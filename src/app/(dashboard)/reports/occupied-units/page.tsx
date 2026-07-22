'use client';

import { useEffect, useState } from 'react';

interface UnitRow {
  id: string;
  unitNumber: string;
  unitType: string;
  building: { name: string };
  floor: { name: string } | null;
  status: string;
  contracts: { tenant: { fullName: string } }[];
}

export default function OccupiedUnitsReportPage() {
  const [data, setData] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/occupied-units')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير الوحدات المؤجرة</h2>
      <div className="text-sm text-gray-500">عدد الوحدات المؤجرة: {data.length}</div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">رقم الوحدة</th>
              <th className="px-4 py-3 text-right">النوع</th>
              <th className="px-4 py-3 text-right">العمارة</th>
              <th className="px-4 py-3 text-right">الطابق</th>
              <th className="px-4 py-3 text-right">المستأجر الحالي</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{u.unitNumber}</td>
                <td className="px-4 py-3">{u.unitType}</td>
                <td className="px-4 py-3">{u.building?.name}</td>
                <td className="px-4 py-3">{u.floor?.name || '-'}</td>
                <td className="px-4 py-3">{u.contracts[0]?.tenant?.fullName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
