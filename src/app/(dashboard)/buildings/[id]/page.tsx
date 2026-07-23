'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { contractStatusLabels } from '@/components/ui/StatusBadge';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';
import { Alert } from '@/components/ui/Alert';
import {
  ChevronLeft, Building2, MapPin, Layers, Home, Key, DoorOpen, User, Pencil, Trash2, FileText,
  Plus, X, ChevronDown, ChevronRight, Receipt, Banknote, DollarSign,
  BarChart3, TrendingUp, ArrowUpDown, FileSignature, AlertCircle, Calendar,
  Zap, Droplets, BedDouble, Bath, Maximize, CircleDollarSign, Wallet, CirclePlus, PenSquare,
  ArrowRightLeft, FileCheck, ArrowUp
} from 'lucide-react';

interface ContractData {
  id: string; contractNumber: string; status: string; startDate: string; endDate: string;
  tenant: { fullName: string; phone: string | null }; unit: { unitNumber: string };
}

interface FloorData { id: string; name: string; sortOrder: number; }

interface UnitData {
  id: string; unitNumber: string; unitType: string; status: string;
  area: number | null; roomsCount: number | null; bathroomsCount: number | null;
  defaultRent: number | null; electricityMeterNumber: string | null; waterMeterNumber: string | null;
  currentElectricityMeterReading: string | null; currentWaterMeterReading: string | null;
  notes: string | null; floor: { id: string; name: string } | null;
  contracts: { id: string; startDate: string; endDate: string; status: string; tenant: { fullName: string; phone: string | null } }[];
  dues: any[]; receipts: any[];
}

interface TenantData {
  id: string; fullName: string; phone: string | null; email: string | null;
  contracts: { id: string; unit: { unitNumber: string }; status: string; startDate: string; endDate: string }[];
}

interface BuildingData {
  id: string; name: string; ownerName: string | null; address: string | null;
  latitude: string | null; longitude: string | null; floorsCount: number; unitsCount: number;
  isActive: boolean; floors: FloorData[]; units: UnitData[]; contracts: ContractData[];
  tenants: TenantData[]; totalDues: number; totalReceipts: number; balanceDue: number;
}

const unitStatusLabels: Record<string, string> = { empty: 'فارغة', rented: 'مؤجرة', reserved: 'محجوزة', unavailable: 'غير متاحة' };
const unitTypeLabels: Record<string, string> = { apartment: 'شقة', shop: 'محل', office: 'مكتب', warehouse: 'مستودع', room: 'غرفة', garage: 'كراج', independent: 'عقار مستقل', other: 'أخرى' };
const unitStatusColors: Record<string, string> = {
  empty: 'bg-amber-50 text-amber-700 border-amber-200',
  rented: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  unavailable: 'bg-slate-50 text-slate-600 border-slate-200',
};
const unitStatusDotColors: Record<string, string> = {
  empty: 'bg-amber-500', rented: 'bg-emerald-500', reserved: 'bg-blue-500', unavailable: 'bg-slate-400',
};

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${m}/${y}`;
}

const TABS = [
  { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { key: 'floors', label: 'الطوابق والوحدات', icon: Layers },
  { key: 'tenants', label: 'المستأجرون', icon: User },
  { key: 'contracts', label: 'العقود', icon: FileSignature },
  { key: 'reports', label: 'التقارير', icon: TrendingUp },
];

export default function BuildingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { confirm } = useDialog();
  const toast = useToast();
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchBuilding();
  }, [id]);

  async function fetchBuilding() {
    try {
      const res = await fetch(`/api/buildings/${id}`);
      const data = await res.json();
      setBuilding(data.building || null);
    } catch {}
    setLoading(false);
  }

  if (loading) return <LoadingState message="جاري تحميل بيانات العمارة..." />;
  if (!building) return <EmptyStateMessage title="العمارة غير موجودة" description="تعذر العثور على بيانات العمارة المطلوبة." />;

  const overviewStats = {
    floors: building.floors.length,
    units: building.units.length,
    rented: building.units.filter((u) => u.status === 'rented').length,
    empty: building.units.filter((u) => u.status === 'empty').length,
    reserved: building.units.filter((u) => u.status === 'reserved').length,
    unavailable: building.units.filter((u) => u.status === 'unavailable').length,
    occupancyRate: building.units.length > 0 ? Math.round((building.units.filter((u) => u.status === 'rented').length / building.units.length) * 100) : 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/buildings" className="btn-ghost text-slate-500"><ChevronLeft className="h-4 w-4" /> العمارات</Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{building.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {building.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{building.address}</span>}
                {building.ownerName && <span>المالك: {building.ownerName}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/buildings/${id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> تعديل</Link>
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'حذف العمارة',
                  description: 'سيتم حذف العمارة نهائيًا مع جميع بياناتها. لا يمكن التراجع عن هذا الإجراء.',
                  variant: 'danger',
                  confirmLabel: 'حذف',
                });
                if (!confirmed) return;
                const res = await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
                if (res.ok) router.push('/buildings');
                else { const d = await res.json(); toast.error(d.error || 'حدث خطأ أثناء حذف العمارة'); }
              }}
              className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                isActive ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && <OverviewTab building={building} stats={overviewStats} />}
        {activeTab === 'floors' && <FloorsUnitsTab building={building} onRefresh={fetchBuilding} />}
        {activeTab === 'tenants' && <TenantsTab tenants={building.tenants} />}
        {activeTab === 'contracts' && <ContractsTab contracts={building.contracts} />}
        {activeTab === 'reports' && <ReportsTab building={building} stats={overviewStats} />}
      </div>
    </div>
  );
}

function OverviewTab({ building, stats }: { building: BuildingData; stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'الطوابق', value: stats.floors, icon: Layers, color: 'bg-blue-50 text-blue-600' },
          { label: 'الوحدات', value: stats.units, icon: Home, color: 'bg-slate-50 text-slate-600' },
          { label: 'مؤجرة', value: stats.rented, icon: Key, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'فارغة', value: stats.empty, icon: DoorOpen, color: 'bg-amber-50 text-amber-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${s.color}`}><Icon className="h-4 w-4" /></div>
                <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-900">{s.value}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Receipt className="h-4 w-4" /></div>
            <div><p className="text-xs text-slate-500">المستحقات</p><p className="text-xl font-bold text-slate-900">{building.totalDues.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><Banknote className="h-4 w-4" /></div>
            <div><p className="text-xs text-slate-500">إجمالي التحصيلات</p><p className="text-xl font-bold text-slate-900">{building.totalReceipts.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600"><DollarSign className="h-4 w-4" /></div>
            <div><p className="text-xs text-slate-500">الرصيد</p><p className="text-xl font-bold text-slate-900">{building.balanceDue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-semibold text-slate-900 mb-4">نسبة الإشغال</h3>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
          <span className="text-sm font-bold text-slate-900">{stats.occupancyRate}%</span>
        </div>
      </div>

    </div>
  );
}

function FloorsUnitsTab({ building, onRefresh }: { building: BuildingData; onRefresh: () => void }) {
  const { confirm } = useDialog();
  const toast = useToast();
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set(building.floors.map((f) => f.id)));
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [showEditFloor, setShowEditFloor] = useState(false);
  const [showMoveUnit, setShowMoveUnit] = useState(false);
  const [targetFloorId, setTargetFloorId] = useState('');
  const [floorForm, setFloorForm] = useState({ name: '' });
  const [unitForm, setUnitForm] = useState({
    unitNumber: '', unitType: 'apartment', area: '', roomsCount: '', bathroomsCount: '',
    electricityMeterNumber: '', waterMeterNumber: '', currentElectricityMeterReading: '', currentWaterMeterReading: '', status: 'empty', notes: '', floorId: ''
  });
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitError, setUnitError] = useState('');
  const [floorError, setFloorError] = useState('');

  const toggleFloor = (floorId: string) => {
    const next = new Set(expandedFloors);
    if (next.has(floorId)) next.delete(floorId); else next.add(floorId);
    setExpandedFloors(next);
  };

  const unitsByFloor = useMemo(() => {
    const map: Record<string, UnitData[]> = {};
    building.floors.forEach((f) => { map[f.id] = []; });
    building.units.forEach((u) => {
      const fid = u.floor?.id || '__none';
      if (!map[fid]) map[fid] = [];
      map[fid].push(u);
    });
    building.floors.forEach((f) => { map[f.id].sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)); });
    return map;
  }, [building]);

  async function createFloor(e: React.FormEvent) {
    e.preventDefault();
    setFloorError('');
    const res = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId: building.id, name: floorForm.name, sortOrder: building.floors.length }),
    });
    if (res.ok) { setFloorForm({ name: '' }); setShowAddFloor(false); onRefresh(); }
    else { const data = await res.json(); setFloorError(data.error || 'حدث خطأ'); }
  }

  async function updateFloor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFloorId) return;
    setFloorError('');
    const res = await fetch(`/api/floors/${editingFloorId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: floorForm.name }) });
    if (res.ok) { setFloorForm({ name: '' }); setShowEditFloor(false); setEditingFloorId(null); onRefresh(); }
    else { const data = await res.json(); setFloorError(data.error || 'حدث خطأ'); }
  }

  async function deleteFloor(floorId: string) {
    const confirmed = await confirm({
      title: 'حذف الطابق',
      description: 'هل أنت متأكد من حذف هذا الطابق؟',
      variant: 'warning',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/floors/${floorId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = { error: text || 'حدث خطأ' }; }
        toast.error(data.error || 'حدث خطأ أثناء حذف الطابق');
      }
    } catch (err: any) {
      console.error('deleteFloor error:', err);
      toast.error('فشل الاتصال بالخادم: ' + (err.message || 'حدث خطأ غير معروف'));
    }
  }

  async function createUnit(e: React.FormEvent) {
    e.preventDefault();
    setUnitError('');
    const payload = {
      buildingId: building.id, floorId: unitForm.floorId || null, unitNumber: unitForm.unitNumber,
      unitType: unitForm.unitType, area: unitForm.area || null,
      roomsCount: unitForm.roomsCount ? parseInt(unitForm.roomsCount) : null,
      bathroomsCount: unitForm.bathroomsCount ? parseInt(unitForm.bathroomsCount) : null,
      electricityMeterNumber: unitForm.electricityMeterNumber || null,
      waterMeterNumber: unitForm.waterMeterNumber || null,
      currentElectricityMeterReading: unitForm.currentElectricityMeterReading || null,
      currentWaterMeterReading: unitForm.currentWaterMeterReading || null,
      status: unitForm.status, notes: unitForm.notes || null,
    };
    const res = await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setUnitForm({ unitNumber: '', unitType: 'apartment', area: '', roomsCount: '', bathroomsCount: '', electricityMeterNumber: '', waterMeterNumber: '', currentElectricityMeterReading: '', currentWaterMeterReading: '', status: 'empty', notes: '', floorId: '' }); setShowAddUnit(false); onRefresh(); }
    else { const data = await res.json(); setUnitError(data.error || 'حدث خطأ'); }
  }

  async function updateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUnitId) return;
    setUnitError('');
    const payload = {
      unitNumber: unitForm.unitNumber, unitType: unitForm.unitType, area: unitForm.area || null,
      roomsCount: unitForm.roomsCount ? parseInt(unitForm.roomsCount) : null,
      bathroomsCount: unitForm.bathroomsCount ? parseInt(unitForm.bathroomsCount) : null,
      electricityMeterNumber: unitForm.electricityMeterNumber || null,
      waterMeterNumber: unitForm.waterMeterNumber || null,
      currentElectricityMeterReading: unitForm.currentElectricityMeterReading || null,
      currentWaterMeterReading: unitForm.currentWaterMeterReading || null,
      status: unitForm.status, notes: unitForm.notes || null,
      floorId: unitForm.floorId || null,
    };
    const res = await fetch(`/api/units/${editingUnitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setShowEditUnit(false); setEditingUnitId(null); setSelectedUnit(null); onRefresh(); }
    else { const data = await res.json(); setUnitError(data.error || 'حدث خطأ'); }
  }

  async function deleteUnit(unitId: string) {
    const confirmed = await confirm({
      title: 'حذف الوحدة',
      description: 'سيتم حذف الوحدة نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedUnit(null);
        onRefresh();
      } else {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = { error: text || 'حدث خطأ' }; }
        toast.error(data.error || 'حدث خطأ أثناء حذف الوحدة');
      }
    } catch (err: any) {
      console.error('deleteUnit error:', err);
      toast.error('فشل الاتصال بالخادم: ' + (err.message || 'حدث خطأ غير معروف'));
    }
  }

  async function moveUnit() {
    if (!selectedUnit || !targetFloorId) return;
    const res = await fetch(`/api/units/${selectedUnit.id}/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ floorId: targetFloorId }) });
    if (res.ok) { setShowMoveUnit(false); setSelectedUnit(null); onRefresh(); }
    else { const data = await res.json(); toast.error(data.error || 'حدث خطأ أثناء نقل الوحدة'); }
  }

  const startEditUnit = (unit: UnitData) => {
    setEditingUnitId(unit.id);
    setUnitForm({
      unitNumber: unit.unitNumber, unitType: unit.unitType, area: unit.area ? String(unit.area) : '',
      roomsCount: unit.roomsCount ? String(unit.roomsCount) : '', bathroomsCount: unit.bathroomsCount ? String(unit.bathroomsCount) : '',
      electricityMeterNumber: unit.electricityMeterNumber || '',
      waterMeterNumber: unit.waterMeterNumber || '',
      currentElectricityMeterReading: unit.currentElectricityMeterReading || '',
      currentWaterMeterReading: unit.currentWaterMeterReading || '',
      status: unit.status, notes: unit.notes || '', floorId: unit.floor?.id || ''
    });
    setShowEditUnit(true);
  };

  const startEditFloor = (floor: FloorData) => {
    setEditingFloorId(floor.id);
    setFloorForm({ name: floor.name });
    setShowEditFloor(true);
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">شجرة العقار</h3>
          <div className="flex gap-2">
            <button onClick={() => { setShowAddUnit(true); setUnitForm((u) => ({ ...u, floorId: '' })); }} className="btn-secondary text-sm"><Plus className="h-4 w-4" /> إضافة وحدة</button>
            <button onClick={() => setShowAddFloor(true)} className="btn-secondary text-sm"><Plus className="h-4 w-4" /> إضافة طابق</button>
          </div>
        </div>

        {showAddFloor && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            {floorError && <Alert className="mb-3" title="تعذر الحفظ">{floorError}</Alert>}
            <form onSubmit={createFloor} className="flex gap-2">
              <input value={floorForm.name} onChange={(e) => setFloorForm({ name: e.target.value })} placeholder="اسم الطابق *" className="input-premium flex-1" required />
              <button type="submit" className="btn-primary text-sm">حفظ</button>
              <button type="button" onClick={() => { setShowAddFloor(false); setFloorError(''); }} className="btn-secondary text-sm">إلغاء</button>
            </form>
          </div>
        )}

        {showEditFloor && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            {floorError && <Alert className="mb-3" title="تعذر الحفظ">{floorError}</Alert>}
            <form onSubmit={updateFloor} className="flex gap-2">
              <input value={floorForm.name} onChange={(e) => setFloorForm({ name: e.target.value })} placeholder="اسم الطابق *" className="input-premium flex-1" required />
              <button type="submit" className="btn-primary text-sm">تحديث</button>
              <button type="button" onClick={() => { setShowEditFloor(false); setEditingFloorId(null); setFloorError(''); }} className="btn-secondary text-sm">إلغاء</button>
            </form>
          </div>
        )}

        {showAddUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddUnit(false); setUnitError(''); }} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-0 max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-base">إضافة وحدة</h3>
                </div>
                <button onClick={() => { setShowAddUnit(false); setUnitError(''); }} className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              {unitError && <Alert className="rounded-none border-0 border-b" title="تعذر الحفظ">{unitError}</Alert>}
              <form onSubmit={createUnit} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto p-6 space-y-5 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">رقم الوحدة <span className="text-red-500">*</span></label>
                      <input value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })} placeholder="مثال: 101" className="input-premium py-2.5 w-full text-right" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">نوع الوحدة</label>
                      <select value={unitForm.unitType} onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })} className="select-premium text-sm py-2.5 w-full">
                        <option value="apartment">شقة</option>
                        <option value="shop">محل</option>
                        <option value="office">مكتب</option>
                        <option value="warehouse">مستودع</option>
                        <option value="room">غرفة</option>
                        <option value="garage">كراج</option>
                        <option value="independent">عقار مستقل</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">الطابق</label>
                      <select value={unitForm.floorId} onChange={(e) => setUnitForm({ ...unitForm, floorId: e.target.value })} className="select-premium text-sm py-2.5 w-full">
                        <option value="">بدون طابق</option>
                        {building.floors.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">المساحة</label>
                      <div className="relative">
                        <input type="number" value={unitForm.area} onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })} placeholder="مثال: 120" className="input-premium py-2.5 w-full pl-12 text-right" />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">م²</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">عدد الغرف</label>
                      <input type="number" value={unitForm.roomsCount} onChange={(e) => setUnitForm({ ...unitForm, roomsCount: e.target.value })} placeholder="0" className="input-premium py-2.5 w-full text-right" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">عدد الحمامات</label>
                      <input type="number" value={unitForm.bathroomsCount} onChange={(e) => setUnitForm({ ...unitForm, bathroomsCount: e.target.value })} placeholder="0" className="input-premium py-2.5 w-full text-right" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">عداد الكهرباء</label>
                      <input value={unitForm.electricityMeterNumber} onChange={(e) => setUnitForm({ ...unitForm, electricityMeterNumber: e.target.value })} placeholder="أدخل رقم العداد" className="input-premium py-2.5 w-full text-right" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">عداد المياه</label>
                      <input value={unitForm.waterMeterNumber} onChange={(e) => setUnitForm({ ...unitForm, waterMeterNumber: e.target.value })} placeholder="أدخل رقم العداد" className="input-premium py-2.5 w-full text-right" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">آخر قراءة كهرباء</label>
                      <input type="number" value={unitForm.currentElectricityMeterReading} onChange={(e) => setUnitForm({ ...unitForm, currentElectricityMeterReading: e.target.value })} placeholder="أدخل القراءة" className="input-premium py-2.5 w-full text-right" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">آخر قراءة مياه</label>
                      <input type="number" value={unitForm.currentWaterMeterReading} onChange={(e) => setUnitForm({ ...unitForm, currentWaterMeterReading: e.target.value })} placeholder="أدخل القراءة" className="input-premium py-2.5 w-full text-right" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
                  <button type="submit" className="btn-primary flex-1 py-2.5 text-sm font-semibold">حفظ</button>
                  <button type="button" onClick={() => { setShowAddUnit(false); setUnitError(''); }} className="btn-secondary flex-1 py-2.5 text-sm font-medium">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMoveUnit && selectedUnit && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">نقل الوحدة {selectedUnit.unitNumber}</h4>
            <div className="flex gap-2">
              <select value={targetFloorId} onChange={(e) => setTargetFloorId(e.target.value)} className="select-premium flex-1">
                <option value="">اختر الطابق</option>
                {building.floors.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
              <button onClick={moveUnit} className="btn-primary text-sm">نقل</button>
              <button onClick={() => setShowMoveUnit(false)} className="btn-secondary text-sm">إلغاء</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {building.floors.map((floor) => {
            const isExpanded = expandedFloors.has(floor.id);
            const floorUnits = unitsByFloor[floor.id] || [];
            return (
              <div key={floor.id} className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 cursor-pointer" onClick={() => toggleFloor(floor.id)}>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleFloor(floor.id); }} className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <span className="font-semibold text-slate-900 text-sm">{floor.name}</span>
                    <span className="text-xs text-slate-500">({floorUnits.length} وحدة)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedUnit(null); setShowAddUnit(true); setUnitForm((u) => ({ ...u, floorId: floor.id })); }} className="rounded-md p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="إضافة وحدة"><Plus className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); startEditFloor(floor); }} className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="تعديل"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); console.log('delete floor button clicked', floor.id); deleteFloor(floor.id); }} className="rounded-md p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50" title="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 py-2 space-y-1">
                    {floorUnits.length === 0 ? (
                      <EmptyStateMessage className="py-4" title="لا توجد وحدات" description="لا توجد وحدات في هذا الطابق." />
                    ) : (
                      floorUnits.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUnit(u)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                            selectedUnit?.id === u.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${unitStatusDotColors[u.status] || 'bg-slate-400'}`} />
                            <span className="text-sm font-medium text-slate-900">{u.unitNumber}</span>
                            <span className="text-xs text-slate-500">{unitTypeLabels[u.unitType] || u.unitType}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-md border ${unitStatusColors[u.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {unitStatusLabels[u.status] || u.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {unitsByFloor['__none'] && unitsByFloor['__none'].length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80">
                <span className="font-semibold text-slate-900 text-sm">وحدات بدون طابق</span>
                <span className="text-xs text-slate-500 mr-2">({unitsByFloor['__none'].length} وحدة)</span>
              </div>
              <div className="px-4 py-2 space-y-1">
                {unitsByFloor['__none'].map((u) => (
                  <div key={u.id} onClick={() => setSelectedUnit(u)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${selectedUnit?.id === u.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${unitStatusDotColors[u.status] || 'bg-slate-400'}`} />
                      <span className="text-sm font-medium text-slate-900">{u.unitNumber}</span>
                      <span className="text-xs text-slate-500">{unitTypeLabels[u.unitType] || u.unitType}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${unitStatusColors[u.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {unitStatusLabels[u.status] || u.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unit Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (showEditUnit) { setShowEditUnit(false); setEditingUnitId(null); setUnitError(''); } else { setSelectedUnit(null); } }} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-0 max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
            {showEditUnit && editingUnitId === selectedUnit.id ? (
              <>
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-2xl shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <Pencil className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-base">تعديل الوحدة</h3>
                  </div>
                  <button onClick={() => { setShowEditUnit(false); setEditingUnitId(null); setUnitError(''); }} className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                {unitError && <Alert className="rounded-none border-0 border-b" title="تعذر الحفظ">{unitError}</Alert>}
                <form onSubmit={updateUnit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="overflow-y-auto p-6 space-y-5 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">رقم الوحدة <span className="text-red-500">*</span></label>
                        <input value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })} placeholder="مثال: 101" className="input-premium py-2.5 w-full text-right" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">نوع الوحدة</label>
                        <select value={unitForm.unitType} onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })} className="select-premium text-sm py-2.5 w-full">
                          <option value="apartment">شقة</option>
                          <option value="shop">محل</option>
                          <option value="office">مكتب</option>
                          <option value="warehouse">مستودع</option>
                          <option value="room">غرفة</option>
                          <option value="garage">كراج</option>
                          <option value="independent">عقار مستقل</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">الطابق</label>
                        <select value={unitForm.floorId} onChange={(e) => setUnitForm({ ...unitForm, floorId: e.target.value })} className="select-premium text-sm py-2.5 w-full">
                          <option value="">بدون طابق</option>
                          {building.floors.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">المساحة</label>
                        <div className="relative">
                          <input type="number" value={unitForm.area} onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })} placeholder="مثال: 120" className="input-premium py-2.5 w-full pl-12 text-right" />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">م²</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">عدد الغرف</label>
                        <input type="number" value={unitForm.roomsCount} onChange={(e) => setUnitForm({ ...unitForm, roomsCount: e.target.value })} placeholder="0" className="input-premium py-2.5 w-full text-right" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">عدد الحمامات</label>
                        <input type="number" value={unitForm.bathroomsCount} onChange={(e) => setUnitForm({ ...unitForm, bathroomsCount: e.target.value })} placeholder="0" className="input-premium py-2.5 w-full text-right" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">عداد الكهرباء</label>
                        <input value={unitForm.electricityMeterNumber} onChange={(e) => setUnitForm({ ...unitForm, electricityMeterNumber: e.target.value })} placeholder="أدخل رقم العداد" className="input-premium py-2.5 w-full text-right" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">عداد المياه</label>
                        <input value={unitForm.waterMeterNumber} onChange={(e) => setUnitForm({ ...unitForm, waterMeterNumber: e.target.value })} placeholder="أدخل رقم العداد" className="input-premium py-2.5 w-full text-right" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">آخر قراءة كهرباء</label>
                        <input type="number" value={unitForm.currentElectricityMeterReading} onChange={(e) => setUnitForm({ ...unitForm, currentElectricityMeterReading: e.target.value })} placeholder="أدخل القراءة" className="input-premium py-2.5 w-full text-right" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">آخر قراءة مياه</label>
                        <input type="number" value={unitForm.currentWaterMeterReading} onChange={(e) => setUnitForm({ ...unitForm, currentWaterMeterReading: e.target.value })} placeholder="أدخل القراءة" className="input-premium py-2.5 w-full text-right" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
                    <button type="submit" className="btn-primary flex-1 py-2.5 text-sm font-semibold">حفظ</button>
                    <button type="button" onClick={() => { setShowEditUnit(false); setEditingUnitId(null); setUnitError(''); }} className="btn-secondary flex-1 py-2.5 text-sm font-medium">إلغاء</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3 rounded-t-2xl shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                      <DoorOpen className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-sm">تفاصيل الوحدة</h3>
                  </div>
                  <button onClick={() => setSelectedUnit(null)} className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{selectedUnit.unitNumber}</div>
                    <div className={`inline-flex items-center gap-1.5 mt-1 text-xs px-2.5 py-1 rounded-full border ${unitStatusColors[selectedUnit.status]}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${unitStatusDotColors[selectedUnit.status]}`} />
                      {unitStatusLabels[selectedUnit.status]}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" /> النوع</span><span className="font-semibold text-slate-900 text-xs">{unitTypeLabels[selectedUnit.unitType] || selectedUnit.unitType}</span></div>
                    <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1.5 text-xs"><Maximize className="h-3.5 w-3.5" /> المساحة</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.area ? `${selectedUnit.area} م²` : '—'}</span></div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><BedDouble className="h-3.5 w-3.5" /> الغرف</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.roomsCount ?? '—'}</span></div>
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><Bath className="h-3.5 w-3.5" /> الحمامات</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.bathroomsCount ?? '—'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><Zap className="h-3.5 w-3.5" /> الكهرباء</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.electricityMeterNumber || '—'}</span></div>
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><Droplets className="h-3.5 w-3.5" /> المياه</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.waterMeterNumber || '—'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><Zap className="h-3.5 w-3.5" /> قراءة الكهرباء</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.currentElectricityMeterReading || '—'}</span></div>
                      <div className="flex justify-between items-center rounded-md bg-slate-50 border border-slate-100 px-3 py-2"><span className="text-slate-500 flex items-center gap-1 text-xs"><Droplets className="h-3.5 w-3.5" /> قراءة المياه</span><span className="font-semibold text-slate-900 text-xs">{selectedUnit.currentWaterMeterReading || '—'}</span></div>
                    </div>
                  </div>

                  {selectedUnit.contracts[0]?.status === 'active' && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-1.5">
                      <div className="text-xs font-bold text-blue-700">المستأجر الحالي</div>
                      <div className="text-sm font-semibold text-slate-900">{selectedUnit.contracts[0].tenant?.fullName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> نهاية العقد: {formatDate(selectedUnit.contracts[0].endDate)}</div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0 bg-white">
                  <button onClick={() => startEditUnit(selectedUnit)} className="btn-primary flex items-center justify-center gap-1 py-2 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /> تعديل</button>
                  <button onClick={() => deleteUnit(selectedUnit.id)} className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"><Trash2 className="h-3.5 w-3.5" /> حذف</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TenantsTab({ tenants }: { tenants: TenantData[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">المستأجرون</h3>
        <span className="text-xs text-slate-500">{tenants.length} مستأجر</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky-table-header border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الاسم</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الهاتف</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الوحدة</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">حالة العقد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => {
              const activeContract = t.contracts.find((c: any) => c.status === 'active');
              return (
                <tr key={t.id} className="table-row-hover">
                  <td className="px-4 py-3"><Link href={`/tenants/${t.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{t.fullName}</Link></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{t.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{activeContract?.unit?.unitNumber || '—'}</td>
                  <td className="px-4 py-3">
                    {activeContract ? <span className="text-xs font-medium text-emerald-600">نشط</span> : <span className="text-xs text-slate-400">لا يوجد</span>}
                  </td>
                </tr>
              );
            })}
            {tenants.length === 0 && <tr><td colSpan={4}><EmptyStateMessage className="py-8" title="لا يوجد مستأجرون" description="لا يوجد مستأجرون مسجلون في هذا المبنى." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractsTab({ contracts }: { contracts: ContractData[] }) {
  const currentContracts = contracts.filter((c) => c.status === 'active' || c.status === 'draft');
  const pastContracts = contracts.filter((c) => c.status !== 'active' && c.status !== 'draft');
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">العقود الحالية</h3>
          <span className="text-xs text-slate-500">{currentContracts.length} عقد</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم العقد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">تاريخ البدء</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">تاريخ الانتهاء</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentContracts.map((c) => (
                <tr key={c.id} className="table-row-hover group">
                  <td className="px-4 py-3"><Link href={`/contracts/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.contractNumber}</Link></td>
                  <td className="px-4 py-3 text-xs text-slate-700">{c.tenant.fullName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.unit.unitNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.startDate)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.endDate)}</td>
                  <td className="px-4 py-3"><span className="text-xs font-medium text-emerald-600">{c.status === 'active' ? 'نشط' : 'مسودة'}</span></td>
                </tr>
              ))}
              {currentContracts.length === 0 && <tr><td colSpan={6}><EmptyStateMessage className="py-8" title="لا توجد عقود" description="لا توجد عقود حالية في هذا المبنى." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pastContracts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">العقود السابقة</h3>
            <span className="text-xs text-slate-500">{pastContracts.length} عقد</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky-table-header border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">رقم العقد</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المستأجر</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الوحدة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastContracts.map((c) => (
                  <tr key={c.id} className="table-row-hover group">
                    <td className="px-4 py-3"><Link href={`/contracts/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.contractNumber}</Link></td>
                    <td className="px-4 py-3 text-xs text-slate-700">{c.tenant.fullName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.unit.unitNumber}</td>
                    <td className="px-4 py-3"><span className="text-xs font-medium text-slate-500">{contractStatusLabels[c.status] || c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ building, stats }: { building: BuildingData; stats: any }) {
  const statusLabels: Record<string, string> = { empty: 'فارغة', rented: 'مؤجرة', reserved: 'محجوزة', unavailable: 'غير متاحة' };
  const statusColors: Record<string, string> = { empty: 'bg-amber-500', rented: 'bg-emerald-500', reserved: 'bg-blue-500', unavailable: 'bg-slate-400' };
  const statusData = [
    { key: 'rented', value: stats.rented, label: statusLabels.rented },
    { key: 'empty', value: stats.empty, label: statusLabels.empty },
    { key: 'reserved', value: stats.reserved, label: statusLabels.reserved },
    { key: 'unavailable', value: stats.unavailable, label: statusLabels.unavailable },
  ].filter((s) => s.value > 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Receipt className="h-4 w-4" /></div>
            <p className="text-xs text-slate-500">إجمالي الالتزامات</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{building.totalDues.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><Banknote className="h-4 w-4" /></div>
            <p className="text-xs text-slate-500">إجمالي التحصيلات</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{building.totalReceipts.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600"><DollarSign className="h-4 w-4" /></div>
            <p className="text-xs text-slate-500">الرصيد المستحق</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{building.balanceDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-semibold text-slate-900 mb-4">توزيع حالات الوحدات</h3>
        <div className="space-y-3">
          {statusData.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <div className={`flex h-3 w-3 shrink-0 rounded-full ${statusColors[s.key]}`} />
              <span className="text-sm text-slate-600 w-24">{s.label}</span>
              <div className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${statusColors[s.key]}`} style={{ width: `${stats.units > 0 ? (s.value / stats.units) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-bold text-slate-900 w-8 text-left">{s.value}</span>
            </div>
          ))}
          {statusData.length === 0 && <EmptyStateMessage className="py-4" title="لا توجد وحدات" description="لا توجد وحدات في هذا المبنى." />}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="font-semibold text-slate-900 mb-4">ملخص العقود</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{building.contracts.length}</div>
            <div className="text-xs text-slate-500">إجمالي العقود</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{building.contracts.filter((c) => c.status === 'active').length}</div>
            <div className="text-xs text-slate-500">نشطة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600">{building.contracts.filter((c) => c.status === 'expired').length}</div>
            <div className="text-xs text-slate-500">منتهية</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600">{building.contracts.filter((c) => c.status === 'cancelled').length}</div>
            <div className="text-xs text-slate-500">ملغاة</div>
          </div>
        </div>
      </div>
    </div>
  );
}
