'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, Layers, Hash } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface Floor {
  id: string;
  name: string;
  sortOrder: number;
  building: { name: string };
}

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadFloors(); }, []);
  async function loadFloors() { const res = await fetch('/api/floors'); const data = await res.json(); setFloors(data.floors || []); setLoading(false); }

  const filtered = useMemo(() => {
    if (!search.trim()) return floors;
    const q = search.trim().toLowerCase();
    return floors.filter((f) => f.name.toLowerCase().includes(q) || (f.building?.name || '').toLowerCase().includes(q));
  }, [floors, search]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">الطوابق</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة طوابق العمارات</p>
        </div>
        <Link href="/floors/new" className="btn-primary">
          <Plus className="h-4 w-4" /> طابق جديد
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="بحث بالاسم أو العمارة..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-premium w-full pr-9" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الاسم</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">العمارة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الترتيب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="py-12"><EmptyState title="لا توجد طوابق" description="لم يتم العثور على طوابق مطابقة." actionLabel="طابق جديد" actionHref="/floors/new" className="border-0 shadow-none" /></td></tr>
              ) : (filtered.map((f) => (
                <tr key={f.id} className="table-row-hover group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Layers className="h-3.5 w-3.5" /></div>
                      <span className="font-medium text-slate-900">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Building2 className="h-3 w-3" />{f.building?.name || '—'}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Hash className="h-3 w-3" />{f.sortOrder}</div></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">إجمالي: {filtered.length} طابق</div>
      </div>
    </div>
  );
}
