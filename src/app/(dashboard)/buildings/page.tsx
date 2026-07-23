'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil, Trash2, Search, Building2, MapPin, Layers, Home, TrendingUp, Banknote, Receipt, DollarSign, SlidersHorizontal } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';

interface Building {
  id: string;
  name: string;
  ownerName: string | null;
  address: string | null;
  floorsCount: number;
  unitsCount: number;
  rentedUnits: number;
  emptyUnits: number;
  totalDues: number;
  totalReceipts: number;
  balanceDue: number;
  isActive: boolean;
}

export default function BuildingsPage() {
  const { confirm } = useDialog();
  const toast = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ owner: '', city: '', minOccupancy: '', maxUnits: '' });

  useEffect(() => {
    loadBuildings();
  }, []);

  async function loadBuildings() {
    const res = await fetch('/api/buildings');
    const data = await res.json();
    setBuildings(data.buildings || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      ...formData,
    };
    const res = await fetch('/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setFormData({ name: '', address: '' });
      setShowForm(false);
      loadBuildings();
    } else {
      const data = await res.json();
      setError(data.error || 'حدث خطأ');
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'حذف العمارة',
      description: 'سيتم حذف العمارة نهائيًا مع جميع بياناتها. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
    if (res.ok) loadBuildings();
    else {
      const data = await res.json();
      toast.error(data.error || 'حدث خطأ أثناء حذف العمارة');
    }
  }

  const filteredBuildings = useMemo(() => {
    let result = buildings;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || (b.ownerName?.toLowerCase() || '').includes(q) || (b.address?.toLowerCase() || '').includes(q)
      );
    }
    if (filters.owner.trim()) {
      const q = filters.owner.trim().toLowerCase();
      result = result.filter((b) => (b.ownerName?.toLowerCase() || '').includes(q));
    }
    if (filters.city.trim()) {
      const q = filters.city.trim().toLowerCase();
      result = result.filter((b) => (b.address?.toLowerCase() || '').includes(q));
    }
    if (filters.minOccupancy.trim()) {
      const min = parseInt(filters.minOccupancy);
      result = result.filter((b) => b.unitsCount > 0 && (b.rentedUnits / b.unitsCount) * 100 >= min);
    }
    if (filters.maxUnits.trim()) {
      const max = parseInt(filters.maxUnits);
      result = result.filter((b) => b.unitsCount <= max);
    }
    return result;
  }, [buildings, search, filters]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">العقارات</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة العمارات والطوابق والوحدات في مكان واحد</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" />
          إضافة عمارة
        </button>
      </div>

      {/* Quick Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft animate-scale-in">
          {error && <Alert className="mb-4" title="تعذر حفظ العمارة">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                placeholder="اسم العمارة *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-premium"
                required
              />
              <input
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-premium"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="btn-primary">حفظ</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو المالك أو العنوان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium w-full pr-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">تصفية</span>
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <input
              type="text"
              placeholder="المالك"
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              className="input-premium"
            />
            <input
              type="text"
              placeholder="المدينة/العنوان"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="input-premium"
            />
            <input
              type="number"
              placeholder="الحد الأدنى لنسبة الإشغال %"
              value={filters.minOccupancy}
              onChange={(e) => setFilters({ ...filters, minOccupancy: e.target.value })}
              className="input-premium"
            />
            <input
              type="number"
              placeholder="الحد الأقصى للوحدات"
              value={filters.maxUnits}
              onChange={(e) => setFilters({ ...filters, maxUnits: e.target.value })}
              className="input-premium"
            />
          </div>
        )}
      </div>

      {/* Buildings Cards */}
      {filteredBuildings.length === 0 ? (
        <EmptyState
          title="لا توجد عمارات"
          description="لم يتم العثور على عمارات مطابقة لبحثك."
          actionLabel="إضافة عمارة"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBuildings.map((b) => {
            const occupancyRate = b.unitsCount > 0 ? Math.round((b.rentedUnits / b.unitsCount) * 100) : 0;
            return (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:shadow-soft-md hover:border-slate-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/buildings/${b.id}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate">
                      {b.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{b.address || '—'}</span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                      <Layers className="h-3.5 w-3.5" />
                      الطوابق
                    </div>
                    <div className="text-lg font-bold text-slate-900">{b.floorsCount}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 mb-1">
                      <Home className="h-3.5 w-3.5" />
                      مؤجرة
                    </div>
                    <div className="text-lg font-bold text-emerald-700">{b.rentedUnits}</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-amber-600 mb-1">
                      <Home className="h-3.5 w-3.5" />
                      فارغة
                    </div>
                    <div className="text-lg font-bold text-amber-700">{b.emptyUnits}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">نسبة الإشغال</span>
                    <span className="font-medium text-slate-900">{occupancyRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div className="rounded-md bg-blue-50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
                      <Receipt className="h-3 w-3" />
                      المستحقات
                    </div>
                    <div className="font-bold text-blue-700">{b.totalDues.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                      <Banknote className="h-3 w-3" />
                      التحصيلات
                    </div>
                    <div className="font-bold text-emerald-700">{b.totalReceipts.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md bg-rose-50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-rose-600 mb-0.5">
                      <DollarSign className="h-3 w-3" />
                      الرصيد
                    </div>
                    <div className="font-bold text-rose-700">{b.balanceDue.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/buildings/${b.id}`}
                      className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="عرض"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
