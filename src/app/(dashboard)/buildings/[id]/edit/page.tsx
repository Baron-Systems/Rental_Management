'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Building2, MapPin, Save, X } from 'lucide-react';

export default function EditBuildingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/buildings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.building) {
          setFormData({
            name: data.building.name || '',
            address: data.building.address || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/buildings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      router.push(`/buildings/${id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'حدث خطأ');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">جاري التحميل...</div>;

  const inputClass = 'input-premium w-full';

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/buildings/${id}`} className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> العمارة</Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">تعديل العمارة</h1>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Building2 className="h-4 w-4 text-blue-600" /> بيانات العمارة</h3>
            <div className="grid grid-cols-1 gap-3">
              <input placeholder="اسم العمارة *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
              <input placeholder="العنوان" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="submit" className="btn-primary"><Save className="h-4 w-4" /> حفظ</button>
          <button type="button" onClick={() => router.back()} className="btn-secondary"><X className="h-4 w-4" /> إلغاء</button>
        </div>
      </form>
    </div>
  );
}
