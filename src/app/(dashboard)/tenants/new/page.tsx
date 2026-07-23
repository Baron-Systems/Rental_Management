'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, Users, StickyNote, Save, X } from 'lucide-react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

export default function NewTenantPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', nationalId: '', phone: '',
    workplace: '', guarantorName: '', guarantorPhone: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      router.push('/tenants');
    } else {
      const data = await res.json();
      setError(data.error || 'حدث خطأ');
    }
  }

  const inputClass = 'input-premium w-full';

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href="/tenants" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> المستأجرين</Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">مستأجر جديد</h1>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        {error && <Alert className="mb-4" title="تعذر حفظ المستأجر">{error}</Alert>}

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><User className="h-4 w-4 text-blue-600" /> البيانات الأساسية</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input placeholder="الاسم الكامل *" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={inputClass} required />
              <input placeholder="رقم الهوية *" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} className={inputClass} required />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Phone className="h-4 w-4 text-blue-600" /> معلومات التواصل</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
              <input placeholder="جهة العمل" value={formData.workplace} onChange={(e) => setFormData({ ...formData, workplace: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Guarantor */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Users className="h-4 w-4 text-blue-600" /> الكفيل</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input placeholder="اسم الكفيل" value={formData.guarantorName} onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })} className={inputClass} />
              <input placeholder="هاتف الكفيل" value={formData.guarantorPhone} onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })} className={inputClass} />
            </div>
          </div>

        </div>

        <div className="mt-6 flex gap-2">
          <button type="submit" className="btn-primary"><Save className="h-4 w-4" /> حفظ</button>
          <button type="button" onClick={() => router.push('/tenants')} className="btn-secondary"><X className="h-4 w-4" /> إلغاء</button>
        </div>
      </form>
    </div>
  );
}
