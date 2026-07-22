'use client';

import React, { useEffect, useState } from 'react';
import { InlineField } from './InlineField';
import { cn, formatCurrency, formatDate, getFrequencyMonths, calculateContractDueSchedule } from '@/lib/utils';
import { AlertTriangle, Building2, Zap, Droplets } from 'lucide-react';

export const unitTypeLabels: Record<string, string> = {
  apartment: 'شقة', shop: 'محل', office: 'مكتب', warehouse: 'مستودع',
  room: 'غرفة', garage: 'كراج', independent: 'عقار مستقل', other: 'أخرى',
};

export interface ContractFormData {
  contractNumber: string;
  contractDate: string;
  tenantId: string;
  buildingId: string;
  floorId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  paymentFrequency: string;
  firstDueDate: string;
  cycles: string;
  paymentMethod: string;
  electricityResponsibility: string;
  waterResponsibility: string;
  maintenanceResponsibility: string;
  servicesResponsibility: string;
  commitmentTiming: string;
  terms: string;
  witnesses: string;
  notes: string;
  status: string;
  previousContractId?: string;
}

export interface TenantOption {
  id: string;
  fullName: string;
  nationalId?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface BuildingOption {
  id: string;
  name: string;
  address?: string | null;
  ownerName?: string | null;
}

export interface FloorOption {
  id: string;
  name: string;
  buildingId: string;
}

export interface UnitOption {
  id: string;
  unitNumber: string;
  buildingId: string;
  floorId?: string | null;
  unitType?: string | null;
  area?: string | number | null;
  defaultRent?: string | number | null;
  status: string;
  electricityMeterNumber?: string | null;
  waterMeterNumber?: string | null;
  floor?: { name: string } | null;
  building?: { name: string } | null;
}

export interface DueRow {
  number: number;
  dueDate: string;
  amount: number;
}

interface ContractDocumentProps {
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  errors: Record<string, string>;
  tenants: TenantOption[];
  buildings: BuildingOption[];
  floors: FloorOption[];
  units: UnitOption[];
  mode: 'edit' | 'preview' | 'print' | 'renew';
  warnings: string[];
  dues?: DueRow[];
}

const responsibilityOptions = [
  { label: 'المستأجر', value: 'tenant' },
  { label: 'المالك', value: 'owner' },
  { label: 'المالك والمستأجر', value: 'shared' },
];

function getDurationMonths(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + (e.getDate() >= s.getDate() ? 0 : -1));
}

function getDurationText(start: string, end: string): string {
  const months = getDurationMonths(start, end);
  if (months <= 0) return '-';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} سنة`);
  if (rem > 0) parts.push(`${rem} شهر`);
  return parts.join(' و ') || '0 شهر';
}

function getPaymentSchedule(formData: ContractFormData, freqConfig?: Record<string, number>) {
  if (!formData.firstDueDate || !formData.endDate || !formData.rentAmount || !formData.paymentFrequency) return [];
  const firstDue = new Date(formData.firstDueDate);
  const end = new Date(formData.endDate);
  const rent = parseFloat(formData.rentAmount) || 0;
  const cycles = parseInt(formData.cycles || '1', 10);

  const schedule = calculateContractDueSchedule(
    firstDue,
    end,
    rent,
    formData.paymentFrequency,
    cycles,
    formData.commitmentTiming,
    freqConfig
  );

  return schedule.map((item) => ({
    number: item.index + 1,
    dueDate: item.dueDate.toISOString().split('T')[0],
    amount: item.amount,
  }));
}

export function ContractDocument({
  formData,
  setFormData,
  errors,
  tenants,
  buildings,
  floors,
  units,
  mode,
  warnings,
  dues,
}: ContractDocumentProps) {
  const isPreview = mode === 'preview' || mode === 'print';
  const isPrint = mode === 'print';
  const isRenew = mode === 'renew';

  const [landlordName, setLandlordName] = useState('');
  const [landlordId, setLandlordId] = useState('');
  const [frequencyOptions, setFrequencyOptions] = useState<{ label: string; value: string; months: number }[]>([
    { label: 'شهري', value: 'monthly', months: 1 },
    { label: 'كل شهرين', value: 'bimonthly', months: 2 },
    { label: 'ربع سنوي', value: 'quarterly', months: 3 },
    { label: 'نصف سنوي', value: 'semiannual', months: 6 },
    { label: 'سنوي', value: 'annual', months: 12 },
    { label: 'مرة واحدة', value: 'one_time', months: 0 },
  ]);

  const freqConfig = React.useMemo(() => {
    const config: Record<string, number> = {};
    for (const f of frequencyOptions) config[f.value] = f.months;
    return config;
  }, [frequencyOptions]);

  function paymentFrequencyText(freq: string): string {
    return frequencyOptions.find((f) => f.value === freq)?.label || freq;
  }

  function getFrequencyAdjective(freq: string, config: Record<string, number>): string {
    const months = config[freq];
    if (months === 0 || months === undefined) return 'دفعة واحدة';
    if (months === 1) return 'الشهرية';
    if (months === 2) return 'كل شهرين';
    if (months === 3) return 'ربع السنوية';
    if (months === 6) return 'نصف السنوية';
    if (months === 12) return 'السنوية';
    return `كل ${months} أشهر`;
  }

  function getFrequencyPaymentText(freq: string, config: Record<string, number>): string {
    const months = config[freq];
    if (months === 0 || months === undefined) return 'دفعة واحدة';
    if (months === 1) return 'شهرياً';
    if (months === 2) return 'كل شهرين';
    if (months === 3) return 'كل ثلاثة أشهر';
    if (months === 6) return 'كل ستة أشهر';
    if (months === 12) return 'مرة واحدة كل سنة';
    return `كل ${months} أشهر`;
  }

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings || [];
        const getValue = (key: string) => {
          const raw = s.find((x: any) => x.settingKey === key)?.settingValue;
          return (typeof raw === 'object' && raw !== null ? raw.value : raw) || '';
        };
        setLandlordName(getValue('landlord_name'));
        setLandlordId(getValue('landlord_id'));
        const rawFreq = s.find((x: any) => x.settingKey === 'payment_frequencies')?.settingValue;
        const arr = Array.isArray(rawFreq) ? rawFreq : (rawFreq?.value ? rawFreq.value : null);
        if (arr && Array.isArray(arr) && arr.length > 0) {
          setFrequencyOptions(arr);
        }
      });
  }, []);

  useEffect(() => {
    if (!formData.firstDueDate) return;
    const firstDue = new Date(formData.firstDueDate);
    const startDate = formData.firstDueDate;
    let endDate = formData.endDate;
    const cycles = parseInt(formData.cycles || '1', 10);
    if (cycles > 0 && formData.paymentFrequency) {
      const months = getFrequencyMonths(formData.paymentFrequency, freqConfig);
      if (months > 0) {
        const end = new Date(firstDue);
        end.setMonth(end.getMonth() + cycles * months);
        endDate = end.toISOString().split('T')[0];
      } else if (months === 0) {
        endDate = startDate;
      }
    }
    if (endDate !== formData.endDate || startDate !== formData.startDate) {
      setFormData((prev) => ({ ...prev, startDate, endDate }));
    }
  }, [formData.firstDueDate, formData.cycles, formData.paymentFrequency, freqConfig]);

  const tenantOptions = tenants.map((t) => ({ label: t.fullName, value: t.id, meta: t.nationalId || t.phone || '' }));
  const selectedTenant = tenants.find((t) => t.id === formData.tenantId);

  const buildingsWithEmpty = buildings.filter((b) =>
    b.id === formData.buildingId || units.some((u) => u.buildingId === b.id && u.status === 'empty')
  );
  const buildingOptions = buildingsWithEmpty.map((b) => ({ label: b.name, value: b.id }));
  const selectedBuilding = buildings.find((b) => b.id === formData.buildingId);
  const buildingStats = selectedBuilding ? {
    total: units.filter((u) => u.buildingId === selectedBuilding.id).length,
    empty: units.filter((u) => u.buildingId === selectedBuilding.id && u.status === 'empty').length,
    rented: units.filter((u) => u.buildingId === selectedBuilding.id && u.status === 'rented').length,
  } : null;

  const floorOptions = floors
    .filter((f) => f.buildingId === formData.buildingId)
    .map((f) => ({ label: f.name, value: f.id }));
  const selectedFloor = floors.find((f) => f.id === formData.floorId);

  const availableUnits = units.filter(
    (u) => u.buildingId === formData.buildingId && u.floorId === formData.floorId && (u.status === 'empty' || u.id === formData.unitId)
  );
  const unitOptions = availableUnits.map((u) => ({ label: u.unitNumber, value: u.id, meta: u.floor?.name || u.unitType || '' }));
  const selectedUnit = units.find((u) => u.id === formData.unitId);

  const updateField = (field: keyof ContractFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'buildingId') {
        next.floorId = '';
        next.unitId = '';
      }
      if (field === 'floorId') {
        next.unitId = '';
      }
      if (field === 'unitId') {
        const u = units.find((x) => x.id === value);
        if (u) {
          next.buildingId = u.buildingId;
          next.floorId = u.floorId || '';
        }
      }
      if (field === 'startDate' && !prev.firstDueDate) {
        next.firstDueDate = value;
      }
      return next;
    });
  };

  const schedule = dues || getPaymentSchedule(formData, freqConfig);
  const totalAmount = schedule.reduce((sum: number, s: DueRow) => sum + s.amount, 0);
  const dueAmount = schedule.length > 0 ? schedule[0].amount : 0;

  return (
    <div className={cn(
      "relative mx-auto bg-white shadow-lg print:shadow-none",
      isPrint ? "w-[210mm] min-h-[297mm] p-[20mm]" : "max-w-[210mm] min-h-[297mm] p-8 md:p-12"
    )}>
      {/* Header */}
      <div className="mb-6 border-b-2 border-slate-800 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="h-6 w-6 text-slate-700" />
        </div>
        <h1 className="text-2xl font-bold tracking-wide text-slate-900 mb-3">عقد إيجار</h1>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>رقم العقد:</span>
            <strong className="text-slate-900 font-bold">{formData.contractNumber || '—'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span>تاريخ العقد:</span>
            <InlineField value={formData.contractDate} onChange={(v) => updateField('contractDate', v)} placeholder="تاريخ التوقيع" type="date" preview={isPreview} error={errors.contractDate} width="140px" />
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="mb-6 leading-loose text-slate-800">
        <p className="text-justify">
          إنه في يوم <InlineField value={formData.contractDate} onChange={(v) => updateField('contractDate', v)} placeholder="تاريخ العقد" type="date" preview={isPreview} error={errors.contractDate} width="140px" /> ، تم الاتفاق والتراضي بين:
        </p>
      </div>

      {/* Parties */}
      <div className="mb-6 space-y-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 font-bold text-slate-800">الطرف الأول: المؤجر</h3>
          <p className="leading-loose text-justify text-slate-700">
            السيد {landlordName ? <strong>{landlordName}</strong> : <span className="text-slate-400">[لم يُحدد اسم المؤجر في الإعدادات]</span>} {landlordId ? <span>، حامل هوية رقم <strong>{landlordId}</strong></span> : null} ، ويشار إليه لاحقاً بـ <strong>الطرف الأول أو المؤجر</strong>.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 font-bold text-slate-800">الطرف الثاني: المستأجر</h3>
          <div className="leading-loose text-justify text-slate-700">
            {!isPreview && !isRenew && (
              <InlineField value={formData.tenantId} onChange={(v) => updateField('tenantId', v)} placeholder="اختر المستأجر" type="search" searchOptions={tenantOptions} preview={false} error={errors.tenantId} width="180px" />
            )}
            {selectedTenant ? (
              <>
                {' '}السيد <strong>{selectedTenant.fullName}</strong> ، حامل هوية رقم <strong>{selectedTenant.nationalId || '—'}</strong>
              </>
            ) : (
              <span className="text-slate-400"> [المستأجر لم يُحدد]</span>
            )}
            {' '}، ويشار إليه لاحقاً بـ <strong>الطرف الثاني أو المستأجر</strong>.
          </div>
          {!isPreview && !selectedTenant && <div className="mt-2 text-xs text-slate-400">اختر المستأجر لإظهار بياناته تلقائياً</div>}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && !isPreview && (
        <div className="mb-4 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Article 1: Unit */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند الأول: موضوع العقد</h3>

        {/* Building / Floor / Unit Selection */}
        {!isPreview && !isRenew && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">العمارة:</span>
              <select
                value={formData.buildingId}
                onChange={(e) => updateField('buildingId', e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="">اختر العمارة</option>
                {buildingOptions.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {formData.buildingId && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">الطابق:</span>
                <select
                  value={formData.floorId}
                  onChange={(e) => updateField('floorId', e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="">اختر الطابق</option>
                  {floorOptions.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.floorId && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">الوحدة:</span>
                <select
                  value={formData.unitId}
                  onChange={(e) => updateField('unitId', e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="">اختر الوحدة</option>
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>{u.label} {u.meta ? `— ${u.meta}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {errors.unitId && <div className="text-sm text-red-600">{errors.unitId}</div>}
          </div>
        )}

        {/* Auto-filled contract text */}
        {selectedUnit ? (
          <p className="leading-loose text-justify text-slate-700">
            أجر الطرف الأول إلى الطرف الثاني الوحدة رقم <strong>{selectedUnit.unitNumber}</strong> الواقعة في عمارة <strong>{selectedBuilding?.name}</strong>، في <strong>{selectedUnit.floor?.name || '—'}</strong>، من نوع <strong>{unitTypeLabels[selectedUnit.unitType || ''] || selectedUnit.unitType || '—'}</strong>{selectedUnit.area && <>، ومساحتها <strong>{selectedUnit.area}</strong> م²</>}{selectedUnit.electricityMeterNumber && <>، وعليها عداد كهرباء رقم <strong>{selectedUnit.electricityMeterNumber}</strong></>}{selectedUnit.waterMeterNumber && <>، وعداد مياه رقم <strong>{selectedUnit.waterMeterNumber}</strong></>}.
          </p>
        ) : (
          <p className="text-slate-400">{isPreview ? 'لم يُحدد الوحدة' : 'اختر العمارة، ثم الطابق، ثم الوحدة'}</p>
        )}
      </div>

      {/* Article 2: Rent Value */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند الثاني: القيمة الإيجارية</h3>
        <div className="leading-loose text-justify text-slate-700">
          اتفق الطرفان على أن تكون القيمة الإيجارية {getFrequencyAdjective(formData.paymentFrequency, freqConfig)} مبلغاً وقدره <InlineField value={formData.rentAmount} onChange={(v) => updateField('rentAmount', v)} placeholder="قيمة الإيجار" type="number" preview={isPreview} error={errors.rentAmount} width="100px" /> شيكل، {isPreview ? `يستحق السداد ${getFrequencyPaymentText(formData.paymentFrequency, freqConfig)}.` : <>تلتزم وفق دورية <InlineField value={formData.paymentFrequency} onChange={(v) => updateField('paymentFrequency', v)} placeholder="دورية الالتزام" type="select" options={frequencyOptions} preview={isPreview} error={errors.paymentFrequency} width="120px" />.</>}
        </div>
        {formData.rentAmount && (
          <div className="mt-2 text-sm font-medium text-slate-700">
            ({formatCurrency(parseFloat(formData.rentAmount) || 0)} شيكل) — {numberToWordsArabic(parseFloat(formData.rentAmount) || 0)} شيكل فقط لا غير.
          </div>
        )}
      </div>

      {/* Article 3: Duration */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند الثالث: مدة العقد</h3>
        <p className="leading-loose text-justify text-slate-700">
          تبدأ مدة هذا العقد اعتباراً من تاريخ <strong>{formData.startDate ? formatDate(formData.startDate) : '-'}</strong> وتنتهي بتاريخ <strong>{formData.endDate ? formatDate(formData.endDate) : '-'}</strong>.
        </p>
        {!isPreview && (
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">عدد الدورات:</span>
              <input
                type="number"
                min="1"
                value={formData.cycles || '1'}
                onChange={(e) => updateField('cycles', e.target.value)}
                className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                placeholder="الدورات"
              />
              <span className="text-xs text-slate-500">({frequencyOptions.find(f => f.value === formData.paymentFrequency)?.label || 'دورة'} لكل دورة)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">تاريخ البداية:</span>
              <span className="text-sm text-slate-800">{formData.startDate ? formatDate(formData.startDate) : '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">تاريخ النهاية:</span>
              <span className="text-sm text-slate-800">{formData.endDate ? formatDate(formData.endDate) : '-'}</span>
              {errors.endDate && <span className="text-xs text-red-600">{errors.endDate}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Article 4: Due Dates */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند الرابع: مواعيد الالتزامات</h3>
        <div className="leading-loose text-justify text-slate-700">
          يبدأ أول التزام بتاريخ <InlineField value={formData.firstDueDate} onChange={(v) => updateField('firstDueDate', v)} placeholder="تاريخ أول التزام" type="date" preview={isPreview} error={errors.firstDueDate} width="140px" /> ، ثم تتكرر الالتزامات وفق دورية <strong>{paymentFrequencyText(formData.paymentFrequency)}</strong> ، على ألا يتم إنشاء أي التزام بعد تاريخ انتهاء العقد. يتم إنشاء الالتزامات في <InlineField value={formData.commitmentTiming} onChange={(v) => updateField('commitmentTiming', v)} placeholder="توقيت الالتزام" type="select" options={[{ label: 'بداية الدورة', value: 'start' }, { label: 'نهاية الدورة', value: 'end' }]} preview={isPreview} width="140px" />.
        </div>
      </div>

      {/* Payment Schedule Table */}
      {schedule.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 font-bold text-slate-800">جدول الدفعات الإيجارية</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-right font-semibold">الرقم</th>
                  <th className="px-3 py-2 text-right font-semibold">تاريخ الالتزام</th>
                  <th className="px-3 py-2 text-right font-semibold">القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((row: DueRow) => (
                  <tr key={row.number} className="text-slate-700">
                    <td className="px-3 py-2">{row.number}</td>
                    <td className="px-3 py-2">{formatDate(row.dueDate)}</td>
                    <td className="px-3 py-2 font-medium">{formatCurrency(row.amount)} شيكل</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-sm text-slate-600">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>عدد الالتزامات: <strong>{schedule.length}</strong></span>
                <span>قيمة كل التزام: <strong>{formatCurrency(dueAmount)} شيكل</strong></span>
                <span>إجمالي الالتزامات: <strong>{formatCurrency(totalAmount)} شيكل</strong></span>
                <span>أول تاريخ: <strong>{formatDate(schedule[0].dueDate)}</strong></span>
                <span>آخر تاريخ: <strong>{formatDate(schedule[schedule.length - 1].dueDate)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article 5: Obligations */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند الخامس: الكهرباء والمياه والخدمات</h3>
        <div className="space-y-2 leading-loose text-justify text-slate-700">
          <p>يتحمل <InlineField value={formData.electricityResponsibility} onChange={(v) => updateField('electricityResponsibility', v)} placeholder="اختر" type="select" options={responsibilityOptions} preview={isPreview} width="100px" /> تكاليف استهلاك الكهرباء.</p>
          <p>يتحمل <InlineField value={formData.waterResponsibility} onChange={(v) => updateField('waterResponsibility', v)} placeholder="اختر" type="select" options={responsibilityOptions} preview={isPreview} width="100px" /> تكاليف استهلاك المياه.</p>
          <p>يتحمل <InlineField value={formData.maintenanceResponsibility} onChange={(v) => updateField('maintenanceResponsibility', v)} placeholder="اختر" type="select" options={responsibilityOptions} preview={isPreview} width="100px" /> أعمال الصيانة.</p>
          <p>يتحمل <InlineField value={formData.servicesResponsibility} onChange={(v) => updateField('servicesResponsibility', v)} placeholder="اختر" type="select" options={responsibilityOptions} preview={isPreview} width="100px" /> رسوم الخدمات المشتركة.</p>
        </div>
      </div>

      {/* Terms */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">البند السادس: الشروط والأحكام</h3>
        {isPreview ? (
          <div className="whitespace-pre-wrap leading-loose text-justify text-slate-700">{formData.terms || defaultTerms}</div>
        ) : (
          <textarea
            value={formData.terms || defaultTerms}
            onChange={(e) => updateField('terms', e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-loose text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            dir="rtl"
          />
        )}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <h3 className="mb-2 font-bold text-slate-800">ملاحظات إضافية</h3>
        {isPreview ? (
          <div className="whitespace-pre-wrap leading-loose text-justify text-slate-700">{formData.notes || 'لا يوجد.'}</div>
        ) : (
          <textarea
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-loose text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            dir="rtl"
            placeholder="أي ملاحظات إضافية..."
          />
        )}
      </div>

      {/* Signatures */}
      <div className="mt-10 border-t-2 border-slate-200 pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="mb-4 font-bold text-slate-800">الطرف الأول – المؤجر</p>
            <div className="mb-2"><span className="text-sm text-slate-500">الاسم:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
            <div><span className="text-sm text-slate-500">التوقيع:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
          </div>
          <div className="text-center">
            <p className="mb-4 font-bold text-slate-800">الطرف الثاني – المستأجر</p>
            <div className="mb-2"><span className="text-sm text-slate-500">الاسم:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
            <div><span className="text-sm text-slate-500">التوقيع:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="mb-4 font-bold text-slate-800">الشاهد الأول</p>
            <div className="mb-2"><span className="text-sm text-slate-500">الاسم:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
            <div><span className="text-sm text-slate-500">التوقيع:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
          </div>
          <div className="text-center">
            <p className="mb-4 font-bold text-slate-800">الشاهد الثاني</p>
            <div className="mb-2"><span className="text-sm text-slate-500">الاسم:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
            <div><span className="text-sm text-slate-500">التوقيع:</span><div className="mt-1 h-8 border-b border-slate-300" /></div>
          </div>
        </div>
      </div>

    </div>
  );
}

const defaultTerms = `1. يلتزم المستأجر باستخدام الوحدة للغرض المتفق عليه وعدم استخدامها لغرض غير مشروع.
2. لا يجوز للمستأجر تأجير الوحدة لطرف آخر دون موافقة خطية مسبقة من المؤجر.
3. يلتزم المستأجر بالمحافظة على الوحدة وعدم إجراء أي تعديلات دون إذن.
4. يلتزم المستأجر بسداد المبالغ المستحقة في مواعيدها المحددة.
5. يلتزم المستأجر بإخلاء الوحدة عند انتهاء مدة العقد أو إنهائه وفقاً للأنظمة.
6. في حال التأخر في سداد الإيجار لأكثر من 15 يوماً، يحق للمؤجر اتخاذ الإجراءات القانونية.`;

function numberToWordsArabic(n: number): string {
  if (n === 0) return 'صفر';
  const ones = ['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
  const tens = ['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
  const hundreds = ['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];

  function convertLessThanThousand(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const o = num % 10;
      return o > 0 ? `${ones[o]} و${tens[t]}` : tens[t];
    }
    const h = Math.floor(num / 100);
    const rem = num % 100;
    if (rem === 0) return hundreds[h];
    return `${hundreds[h]} و${convertLessThanThousand(rem)}`;
  }

  const parts: string[] = [];
  let remaining = Math.floor(n);

  if (remaining >= 1000000) {
    const m = Math.floor(remaining / 1000000);
    parts.push(`${convertLessThanThousand(m)} مليون${m > 2 ? 'ات' : m === 2 ? 'ان' : ''}`);
    remaining %= 1000000;
  }
  if (remaining >= 1000) {
    const th = Math.floor(remaining / 1000);
    if (th === 1) parts.push('ألف');
    else if (th === 2) parts.push('ألفان');
    else if (th >= 3 && th <= 10) parts.push(`${convertLessThanThousand(th)} آلاف`);
    else parts.push(`${convertLessThanThousand(th)} ألف`);
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(convertLessThanThousand(remaining));
  }

  return parts.join(' و ');
}
