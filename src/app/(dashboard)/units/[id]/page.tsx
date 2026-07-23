'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Home, Building2, Layers, Tag, Ruler, BedDouble, Bath, Zap, Droplets, Banknote, Pencil, Trash2, User, Calendar, CalendarClock, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';

interface UnitData {
  id: string;
  unitNumber: string;
  unitType: string;
  area: number | null;
  roomsCount: number | null;
  bathroomsCount: number | null;
  defaultRent: number | null;
  electricityMeterNumber: string | null;
  waterMeterNumber: string | null;
  currentElectricityMeterReading: string | null;
  currentWaterMeterReading: string | null;
  status: string;
  notes: string | null;
  building: { id: string; name: string };
  floor: { name: string } | null;
  contracts: {
    id: string; contractNumber: string; status: string; startDate: string; endDate: string;
    tenant: { id: string; fullName: string };
  }[];
}

const unitStatusLabels: Record<string, string> = { empty: 'فارغة', rented: 'مؤجرة', reserved: 'محجوزة', unavailable: 'غير متاحة' };
const unitStatusStyles: Record<string, string> = {
  empty: 'bg-amber-50 text-amber-700 border-amber-200',
  rented: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  unavailable: 'bg-slate-50 text-slate-700 border-slate-200',
};

const contractStatusLabels: Record<string, string> = { draft: 'مسودة', active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', evicted: 'تم الإخلاء' };
const contractStatusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  evicted: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function UnitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { confirm } = useDialog();
  const toast = useToast();
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/units/${id}`)
      .then((res) => res.json())
      .then((data) => { setUnit(data.unit || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="جاري تحميل بيانات الوحدة..." />;
  if (!unit) return <EmptyStateMessage title="الوحدة غير موجودة" description="تعذر العثور على بيانات الوحدة المطلوبة." />;

  const activeContract = unit.contracts.find((c) => c.status === 'active');

  const infoItems = [
    { label: 'العمارة', value: unit.building.name, icon: Building2, link: `/buildings/${unit.building.id}` },
    { label: 'الطابق', value: unit.floor?.name || '—', icon: Layers },
    { label: 'النوع', value: unit.unitType, icon: Tag },
    { label: 'المساحة', value: unit.area ? `${unit.area} م²` : '—', icon: Ruler },
    { label: 'الغرف', value: unit.roomsCount?.toString() || '—', icon: BedDouble },
    { label: 'الحمامات', value: unit.bathroomsCount?.toString() || '—', icon: Bath },
    { label: 'الإيجار الافتراضي', value: unit.defaultRent ? formatCurrency(unit.defaultRent) : '—', icon: Banknote },
    { label: 'عداد الكهرباء', value: unit.electricityMeterNumber || '—', icon: Zap },
    { label: 'عداد المياه', value: unit.waterMeterNumber || '—', icon: Droplets },
    { label: 'قراءة الكهرباء الحالية', value: unit.currentElectricityMeterReading || '—', icon: Zap },
    { label: 'قراءة المياه الحالية', value: unit.currentWaterMeterReading || '—', icon: Droplets },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/units" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> الوحدات</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Home className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">وحدة {unit.unitNumber}</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className={`status-badge border ${unitStatusStyles[unit.status] || unitStatusStyles.unavailable}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />{unitStatusLabels[unit.status] || unit.status}
                </span>
                {activeContract && <span className="text-xs text-slate-500">العقد الحالي: {activeContract.contractNumber}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/buildings/${unit.building.id}`} className="btn-secondary"><Pencil className="h-4 w-4" /> تعديل في العمارة</Link>
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'حذف الوحدة',
                  description: 'سيتم حذف الوحدة نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
                  variant: 'danger',
                  confirmLabel: 'حذف',
                });
                if (!confirmed) return;
                const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
                if (res.ok) router.push('/units');
                else { const d = await res.json(); toast.error(d.error || 'حدث خطأ أثناء حذف الوحدة'); }
              }}
              className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </button>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {infoItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <item.icon className="h-3.5 w-3.5" />{item.label}
            </div>
            <div className="text-sm font-medium text-slate-900">
              {item.link ? <Link href={item.link} className="text-blue-600 hover:text-blue-700 transition-colors">{item.value}</Link> : item.value}
            </div>
          </div>
        ))}
      </div>

      {unit.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2"><FileText className="h-3.5 w-3.5" />ملاحظات</div>
          <p className="text-sm text-slate-700">{unit.notes}</p>
        </div>
      )}

      {/* Active Contract */}
      {activeContract && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" />العقد الحالي</h3>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <div><span className="text-slate-500">رقم العقد:</span> <Link href={`/contracts/${activeContract.id}`} className="font-medium text-blue-600 hover:text-blue-700 transition-colors">{activeContract.contractNumber}</Link></div>
            <div><span className="text-slate-500">المستأجر:</span> <Link href={`/tenants/${activeContract.tenant.id}`} className="font-medium text-blue-600 hover:text-blue-700 transition-colors">{activeContract.tenant.fullName}</Link></div>
            <div><span className="text-slate-500">الفترة:</span> {new Date(activeContract.startDate).toLocaleDateString('en-GB')} - {new Date(activeContract.endDate).toLocaleDateString('en-GB')}</div>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">العقود</h3>
          <span className="text-xs text-slate-500">{unit.contracts.length} عقد</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم العقد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unit.contracts.map((c) => (
                <tr key={c.id} className="table-row-hover group">
                  <td className="px-4 py-3"><Link href={`/contracts/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.contractNumber}</Link></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-700"><User className="h-3 w-3" />{c.tenant.fullName}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-slate-600"><Calendar className="h-3 w-3" />{new Date(c.startDate).toLocaleDateString('en-GB')} - {new Date(c.endDate).toLocaleDateString('en-GB')}</div></td>
                  <td className="px-4 py-3"><span className={`status-badge border ${contractStatusStyles[c.status] || contractStatusStyles.draft}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{contractStatusLabels[c.status] || c.status}</span></td>
                </tr>
              ))}
              {unit.contracts.length === 0 && <tr><td colSpan={4}><EmptyStateMessage className="py-8" title="لا توجد عقود" description="لا توجد عقود مسجلة لهذه الوحدة." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
