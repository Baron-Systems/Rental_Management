'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/StatusMessage';
import { Alert } from '@/components/ui/Alert';

export default function EditTenantPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '', nationalId: '', phone: '',
    workplace: '', guarantorName: '', guarantorPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/tenants/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant) {
          const t = data.tenant;
          setFormData({
            fullName: t.fullName || '', nationalId: t.nationalId || '', phone: t.phone || '',
            workplace: t.workplace || '',
            guarantorName: t.guarantorName || '', guarantorPhone: t.guarantorPhone || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    if (res.ok) { router.push(`/tenants/${id}`); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  }

  if (loading) return <LoadingState message="جاري تحميل بيانات المستأجر..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-bold">تعديل المستأجر</h2>
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        {error && <Alert className="mb-4" title="تعذر حفظ التغييرات">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input placeholder="الاسم الكامل *" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="rounded-md border px-3 py-2 text-sm" required />
          <input placeholder="رقم الهوية" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="جهة العمل" value={formData.workplace} onChange={(e) => setFormData({ ...formData, workplace: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="اسم الكفيل" value={formData.guarantorName} onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="هاتف الكفيل" value={formData.guarantorPhone} onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        {/* Notes field removed */}
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">حفظ</button>
          <button type="button" onClick={() => router.back()} className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
