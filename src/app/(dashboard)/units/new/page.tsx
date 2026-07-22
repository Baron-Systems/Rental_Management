'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Building { id: string; name: string; }
interface Floor { id: string; name: string; buildingId: string; }

export default function NewUnitPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    buildingId: '', floorId: '', unitNumber: '', unitType: '', area: '',
    roomsCount: '', bathroomsCount: '',
    electricityMeterNumber: '', waterMeterNumber: '', status: 'empty', notes: '',
  });

  useEffect(() => {
    fetch('/api/buildings').then((r) => r.json()).then((j) => setBuildings(j.buildings || []));
    fetch('/api/floors').then((r) => r.json()).then((j) => setFloors(j.floors || []));
  }, []);

  const buildingFloors = floors.filter((f) => f.buildingId === formData.buildingId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body = {
      ...formData,
      roomsCount: formData.roomsCount ? parseInt(formData.roomsCount) : null,
      bathroomsCount: formData.bathroomsCount ? parseInt(formData.bathroomsCount) : null,
    };
    const res = await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { router.push('/units'); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-bold">وحدة جديدة</h2>
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <select value={formData.buildingId} onChange={(e) => setFormData({ ...formData, buildingId: e.target.value, floorId: '' })} className="rounded-md border px-3 py-2 text-sm" required>
            <option value="">اختر العمارة *</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={formData.floorId} onChange={(e) => setFormData({ ...formData, floorId: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="">اختر الطابق</option>
            {buildingFloors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input placeholder="رقم الوحدة *" value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} className="rounded-md border px-3 py-2 text-sm" required />
          <select value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })} className="rounded-md border px-3 py-2 text-sm" required>
            <option value="">نوع الوحدة *</option>
            <option value="شقة">شقة</option><option value="محل">محل</option><option value="مكتب">مكتب</option>
            <option value="مستودع">مستودع</option><option value="كراج">كراج</option><option value="غرفة">غرفة</option>
            <option value="عقار مستقل">عقار مستقل</option><option value="أخرى">أخرى</option>
          </select>
          <input type="number" placeholder="المساحة" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" placeholder="عدد الغرف" value={formData.roomsCount} onChange={(e) => setFormData({ ...formData, roomsCount: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" placeholder="عدد الحمامات" value={formData.bathroomsCount} onChange={(e) => setFormData({ ...formData, bathroomsCount: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="عداد الكهرباء" value={formData.electricityMeterNumber} onChange={(e) => setFormData({ ...formData, electricityMeterNumber: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="عداد المياه" value={formData.waterMeterNumber} onChange={(e) => setFormData({ ...formData, waterMeterNumber: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="empty">فارغة</option><option value="rented">مؤجرة</option><option value="reserved">محجوزة</option><option value="unavailable">غير متاحة</option>
          </select>
        </div>
        <textarea placeholder="ملاحظات" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-4 w-full rounded-md border px-3 py-2 text-sm" rows={3} />
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">حفظ</button>
          <button type="button" onClick={() => router.push('/units')} className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
