'use client';

import { useEffect, useState } from 'react';

interface BuildingIncomeRow {
  buildingId: string;
  buildingName: string;
  totalUnits: number;
  rentedUnits: number;
  totalIncome: number;
}

export default function BuildingsIncomeReportPage() {
  const [data, setData] = useState<BuildingIncomeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/buildings-income')
      .then((res) => res.json())
      .then((json) => { setData(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">جاري التحميل...</div>;

  const totalIncome = data.reduce((sum, b) => sum + Number(b.totalIncome), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير دخل العمارات</h2>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">إجمالي الدخل</div>
        <div className="text-xl font-bold">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">العمارة</th>
              <th className="px-4 py-3 text-right">عدد الوحدات</th>
              <th className="px-4 py-3 text-right">الوحدات المؤجرة</th>
              <th className="px-4 py-3 text-right">إجمالي الدخل</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((b) => (
              <tr key={b.buildingId} className="hover:bg-gray-50">
                <td className="px-4 py-3">{b.buildingName}</td>
                <td className="px-4 py-3">{b.totalUnits}</td>
                <td className="px-4 py-3">{b.rentedUnits}</td>
                <td className="px-4 py-3">{Number(b.totalIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
