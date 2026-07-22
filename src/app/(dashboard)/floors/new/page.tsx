'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Building { id: string; name: string; }

export default function NewFloorPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ buildingId: '', name: '', sortOrder: '0' });

  useEffect(() => {
    fetch('/api/buildings').then((r) => r.json()).then((j) => setBuildings(j.buildings || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body = { ...formData, sortOrder: parseInt(formData.sortOrder) };
    const res = await fetch('/api/floors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { router.push('/floors'); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-bold">طابق جديد</h2>
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 gap-4">
          <select value={formData.buildingId} onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })} className="rounded-md border px-3 py-2 text-sm" required>
            <option value="">اختر العمارة *</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input placeholder="اسم الطابق *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-md border px-3 py-2 text-sm" required />
          <input type="number" placeholder="ترتيب العرض" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">حفظ</button>
          <button type="button" onClick={() => router.push('/floors')} className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
