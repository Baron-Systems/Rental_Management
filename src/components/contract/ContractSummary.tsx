'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn, formatCurrency, calculateContractDueSchedule } from '@/lib/utils';
import { User, Home, Calendar, Banknote, Receipt, AlertCircle, AlertTriangle, Printer, Eye, Edit3 } from 'lucide-react';
import { unitTypeLabels } from './ContractDocument';
import type { ContractFormData, TenantOption, UnitOption, BuildingOption } from './ContractDocument';

export interface DueRow {
  number: number;
  dueDate: string;
  amount: number;
}

interface ContractSummaryProps {
  formData: ContractFormData;
  tenants: TenantOption[];
  units: UnitOption[];
  buildings: BuildingOption[];
  errors: Record<string, string>;
  warnings: string[];
  isSaving: boolean;
  onSave: (asDraft: boolean) => void;
  onPreview: () => void;
  onPrint: () => void;
  onToggleEditPreview?: () => void;
  mode: 'create' | 'edit' | 'renew';
  status: string;
  viewMode?: 'edit' | 'preview' | 'print';
  dues?: DueRow[];
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

export function ContractSummary({
  formData,
  tenants,
  units,
  buildings,
  errors,
  warnings,
  isSaving,
  onSave,
  onPreview,
  onPrint,
  onToggleEditPreview,
  mode,
  status,
  viewMode = 'edit',
  dues,
}: ContractSummaryProps) {
  const [frequencyOptions, setFrequencyOptions] = useState<{ label: string; value: string; months: number }[]>([
    { label: 'شهرية', value: 'monthly', months: 1 },
    { label: 'كل شهرين', value: 'bimonthly', months: 2 },
    { label: 'ربع سنوية', value: 'quarterly', months: 3 },
    { label: 'نصف سنوية', value: 'semiannual', months: 6 },
    { label: 'سنوية', value: 'annual', months: 12 },
    { label: 'دفعة واحدة', value: 'one_time', months: 0 },
  ]);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings || [];
        const rawFreq = s.find((x: any) => x.settingKey === 'payment_frequencies')?.settingValue;
        const arr = Array.isArray(rawFreq) ? rawFreq : (rawFreq?.value ? rawFreq.value : null);
        if (arr && Array.isArray(arr) && arr.length > 0) {
          setFrequencyOptions(arr);
        }
      });
  }, []);

  const freqConfig = useMemo(() => {
    const config: Record<string, number> = {};
    for (const f of frequencyOptions) config[f.value] = f.months;
    return config;
  }, [frequencyOptions]);

  function paymentFrequencyLabel(freq: string): string {
    return frequencyOptions.find((f) => f.value === freq)?.label || freq;
  }

  const selectedTenant = tenants.find((t) => t.id === formData.tenantId);
  const selectedUnit = units.find((u) => u.id === formData.unitId);
  const selectedBuilding = buildings.find((b) => b.id === formData.buildingId);
  const schedule = dues || getPaymentSchedule(formData, freqConfig);
  const totalAmount = schedule.reduce((sum: number, s: DueRow) => sum + s.amount, 0);
  const dueAmount = schedule.length > 0 ? schedule[0].amount : 0;

  const errorCount = Object.keys(errors).length;
  const warningCount = warnings.length;

  return (
    <div className="space-y-4">
      {/* Preview / Edit / Print */}
      <div className="flex gap-2">
        {viewMode === 'edit' ? (
          <button onClick={onToggleEditPreview || onPreview} className="btn-secondary flex-1 justify-center">
            <Eye className="h-4 w-4" /> معاينة
          </button>
        ) : (
          <button onClick={onToggleEditPreview || onPreview} className="btn-secondary flex-1 justify-center">
            <Edit3 className="h-4 w-4" /> تحرير
          </button>
        )}
        <button onClick={onPrint} className="btn-secondary flex-1 justify-center">
          <Printer className="h-4 w-4" /> طباعة
        </button>
      </div>

      {/* Key Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-3 font-bold text-slate-800">ملخص العقد</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">المستأجر</p>
              <p className="font-medium text-slate-800">{selectedTenant?.fullName || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Home className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">الوحدة</p>
              <p className="font-medium text-slate-800">
                {selectedUnit ? `${selectedUnit.unitNumber} — ${selectedBuilding?.name || ''}` : '—'}
              </p>
              {selectedUnit && (
                <p className="text-xs text-slate-500">{selectedUnit.floor?.name} {selectedUnit.unitType ? `(${unitTypeLabels[selectedUnit.unitType] || selectedUnit.unitType})` : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">المدة</p>
              <p className="font-medium text-slate-800">
                {formData.startDate && formData.endDate
                  ? `${new Date(formData.startDate).toLocaleDateString('en-GB')} — ${new Date(formData.endDate).toLocaleDateString('en-GB')}`
                  : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Receipt className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">الدورية</p>
              <p className="font-medium text-slate-800">{paymentFrequencyLabel(formData.paymentFrequency)}</p>
            </div>
          </div>
          {dueAmount > 0 && (
            <div className="flex items-start gap-2">
              <Receipt className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">قيمة كل التزام</p>
                <p className="font-medium text-slate-800">{formatCurrency(dueAmount)} شيكل</p>
              </div>
            </div>
          )}
          {schedule.length > 0 && (
            <div className="flex items-start gap-2">
              <Receipt className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">عدد الالتزامات</p>
                <p className="font-medium text-slate-800">{schedule.length}</p>
              </div>
            </div>
          )}
          {totalAmount > 0 && (
            <div className="flex items-start gap-2">
              <Banknote className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">إجمالي الالتزامات</p>
                <p className="font-bold text-slate-900">{formatCurrency(totalAmount)} شيكل</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation */}
      {(errorCount > 0 || warningCount > 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-2 font-bold text-slate-800">التحقق والتنبيهات</h3>
          {errorCount > 0 && (
            <div className="mb-2 space-y-1">
              {Object.entries(errors).map(([field, msg]) => (
                <div key={field} className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {msg}
                </div>
              ))}
            </div>
          )}
          {warningCount > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onSave(false)}
          disabled={isSaving}
          className="btn-primary w-full justify-center"
        >
          {isSaving ? 'جاري الحفظ...' : mode === 'create' ? 'حفظ العقد' : mode === 'renew' ? 'تجديد العقد' : 'تحديث العقد'}
        </button>
        {mode !== 'renew' && (
          <button
            onClick={() => onSave(true)}
            disabled={isSaving}
            className="btn-secondary w-full justify-center"
          >
            حفظ كمسودة
          </button>
        )}
      </div>
    </div>
  );
}
