'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Droplets, FileText, AlertTriangle, ChevronLeft, Home, User, Building2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

interface Contract { id: string; contractNumber: string; tenant: { fullName: string }; unit: { unitNumber: string }; building: { name: string }; }

export default function EvictContractPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractId: id, electricityMeterReading: '', waterMeterReading: '', notes: '',
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/contracts/${id}`).then((r) => r.json()).then((j) => {
        if (j.contract) setContract(j.contract);
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...formData,
      electricityMeterReading: formData.electricityMeterReading || null,
      waterMeterReading: formData.waterMeterReading || null,
    };
    const res = await fetch('/api/evictions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/contracts/${id}`);
    } else {
      const d = await res.json().catch(() => ({ error: 'حدث خطأ' }));
      setError(d.error || 'حدث خطأ');
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <Link href={`/contracts/${id}`} className="btn-ghost text-slate-500">
            <ChevronLeft className="h-4 w-4" /> العقد
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">إخلاء وحدة</h1>

        {contract && (
          <div className="card-premium overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 bg-blue-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Home className="h-4 w-4" />
                بيانات العقد
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">العقد:</span>
                <span className="font-semibold text-slate-900">{contract.contractNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">المستأجر:</span>
                <span className="font-semibold text-slate-900">{contract.tenant.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">الوحدة:</span>
                <span className="font-semibold text-slate-900">{contract.unit.unitNumber} - {contract.building.name}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-premium overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              بيانات الإخلاء
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            {error && <Alert className="mb-4" title="تعذر حفظ الإخلاء">{error}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Zap className="h-4 w-4 text-amber-500" />
                  قراءة عداد الكهرباء
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="أدخل القراءة الحالية"
                  value={formData.electricityMeterReading}
                  onChange={(e) => setFormData({ ...formData, electricityMeterReading: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  قراءة عداد المياه
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="أدخل القراءة الحالية"
                  value={formData.waterMeterReading}
                  onChange={(e) => setFormData({ ...formData, waterMeterReading: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-slate-500" />
                ملاحظات
              </label>
              <textarea
                placeholder="أي ملاحظات إضافية حول حالة الوحدة..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-premium w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التنفيذ...' : 'تنفيذ الإخلاء'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
