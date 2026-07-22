'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil, Search, Building2, Layers, Home, User } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface Unit {
  id: string;
  unitNumber: string;
  unitType: string;
  buildingId: string;
  building: { name: string };
  floor: { name: string } | null;
  status: string;
  contracts: { status: string; tenant: { fullName: string } }[];
}

const statusLabels: Record<string, string> = {
  empty: 'فارغة',
  rented: 'مؤجرة',
  reserved: 'محجوزة',
  unavailable: 'غير متاحة',
};

const statusStyles: Record<string, string> = {
  empty: 'bg-amber-50 text-amber-700 border-amber-200',
  rented: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  unavailable: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    const res = await fetch('/api/units');
    const data = await res.json();
    setUnits(data.units || []);
    setLoading(false);
  }

  const filteredUnits = useMemo(() => {
    let filtered = units;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.unitNumber.toLowerCase().includes(q) ||
          u.unitType.toLowerCase().includes(q) ||
          u.building?.name.toLowerCase().includes(q) ||
          (u.floor?.name || '').toLowerCase().includes(q) ||
          (u.contracts[0]?.tenant?.fullName || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    return filtered;
  }, [units, search, statusFilter]);

  const stats = useMemo(() => ({
    total: units.length,
    rented: units.filter((u) => u.status === 'rented').length,
    empty: units.filter((u) => u.status === 'empty').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
  }), [units]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">الوحدات</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة الوحدات العقارية وحالتها</p>
        </div>
        <Link href="/units/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          وحدة جديدة
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إجمالي الوحدات', value: stats.total, color: 'bg-slate-50 text-slate-700', icon: Home },
          { label: 'مؤجرة', value: stats.rented, color: 'bg-emerald-50 text-emerald-700', icon: Home },
          { label: 'فارغة', value: stats.empty, color: 'bg-amber-50 text-amber-700', icon: Home },
          { label: 'محجوزة', value: stats.reserved, color: 'bg-blue-50 text-blue-700', icon: Home },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${s.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الوحدة أو النوع أو العمارة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium w-full pr-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-premium text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="rented">مؤجرة</option>
          <option value="empty">فارغة</option>
          <option value="reserved">محجوزة</option>
          <option value="unavailable">غير متاحة</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">العمارة / الطابق</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر الحالي</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title="لا توجد وحدات"
                      description="لم يتم العثور على وحدات مطابقة لبحثك."
                      actionLabel="إضافة وحدة"
                      actionHref="/units/new"
                      className="border-0 shadow-none"
                    />
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="table-row-hover group">
                    <td className="px-4 py-3">
                      <Link href={`/units/${u.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                        {u.unitNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {u.unitType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Building2 className="h-3 w-3" />
                        {u.building?.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Layers className="h-3 w-3" />
                        {u.floor?.name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge border ${statusStyles[u.status] || statusStyles.empty}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabels[u.status] || u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.contracts[0]?.status === 'active' && u.contracts[0]?.tenant?.fullName ? (
                        <div className="flex items-center gap-1 text-xs text-slate-700">
                          <User className="h-3 w-3" />
                          {u.contracts[0].tenant.fullName}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/units/${u.id}`} className="btn-ghost" title="عرض">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/buildings/${u.buildingId}`} className="btn-ghost" title="تعديل في العمارة">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          إجمالي: {filteredUnits.length} وحدة
        </div>
      </div>
    </div>
  );
}
