'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Printer, Eye, Edit3 } from 'lucide-react';
import { getFrequencyMonths, getFrequencyCount } from '@/lib/utils';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';
import { ContractDocument, type ContractFormData, type TenantOption, type BuildingOption, type FloorOption, type UnitOption } from '@/components/contract/ContractDocument';
import { Alert } from '@/components/ui/Alert';
import { ContractSummary } from '@/components/contract/ContractSummary';

export default function RenewContractPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '', contractDate: new Date().toISOString().split('T')[0], tenantId: '', buildingId: '', floorId: '', unitId: '',
    startDate: '', endDate: '', rentAmount: '', paymentFrequency: 'monthly',
    firstDueDate: '', cycles: '1', paymentMethod: '', electricityResponsibility: 'tenant',
    waterResponsibility: 'tenant', maintenanceResponsibility: 'owner',
    servicesResponsibility: 'shared', commitmentTiming: 'start', terms: '', witnesses: '', notes: '', status: 'draft',
    previousContractId: id as string,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'print'>('edit');
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [previousContract, setPreviousContract] = useState<any>(null);

  useEffect(() => {
    fetch('/api/tenants').then((r) => r.json()).then((j) => setTenants(j.tenants || []));
    fetch('/api/buildings').then((r) => r.json()).then((j) => setBuildings(j.buildings || []));
    fetch('/api/floors').then((r) => r.json()).then((j) => setFloors(j.floors || []));
    fetch('/api/units').then((r) => r.json()).then((j) => setUnits(j.units || []));
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      const s = data.settings || [];
      const getVal = (key: string) => {
        const raw = s.find((x: any) => x.settingKey === key)?.settingValue;
        return typeof raw === 'object' && raw !== null ? raw.value : raw;
      };
      const prefix = (getVal('contract_prefix') || 'CNT') as string;
      const counter = (getVal('contract_counter') || 1) as number;
      const nextNum = String(counter).padStart(4, '0');
      setFormData((prev) => ({ ...prev, contractNumber: `${prefix}-${nextNum}` }));
    });
  }, []);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.contract) {
          const c = data.contract;
          setPreviousContract(c);
          const loadedUnit = units.find((u) => u.id === c.unitId);
          const endDate = new Date(c.endDate);
          const nextStart = new Date(endDate);
          nextStart.setDate(nextStart.getDate() + 1);
          const nextEnd = new Date(nextStart);
          nextEnd.setFullYear(nextEnd.getFullYear() + 1);
          const months = getFrequencyMonths(c.paymentFrequency || 'monthly');
          const cycles = months === 0 ? '1' : String(Math.max(1, getFrequencyCount(nextStart, nextEnd, c.paymentFrequency || 'monthly')));
          setFormData((prev) => ({
            ...prev,
            tenantId: c.tenantId || '',
            buildingId: c.buildingId || '',
            floorId: loadedUnit?.floorId || '',
            unitId: c.unitId || '',
            startDate: nextStart.toISOString().slice(0, 10),
            endDate: nextEnd.toISOString().slice(0, 10),
            rentAmount: c.rentAmount?.toString() || '',
            paymentFrequency: c.paymentFrequency || 'monthly',
            paymentMethod: c.paymentMethod || '',
            electricityResponsibility: c.electricityResponsibility || 'tenant',
            waterResponsibility: c.waterResponsibility || 'tenant',
            maintenanceResponsibility: c.maintenanceResponsibility || 'owner',
            servicesResponsibility: c.servicesResponsibility || 'shared',
            commitmentTiming: c.commitmentTiming || 'start',
            terms: c.terms || '',
            witnesses: c.witnesses || '',
            notes: c.notes || '',
            firstDueDate: nextStart.toISOString().slice(0, 10),
            cycles,
            previousContractId: id as string,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, units]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    if (!formData.tenantId) newErrors.tenantId = 'المستأجر مطلوب';
    if (!formData.unitId) newErrors.unitId = 'الوحدة مطلوبة';
    if (!formData.firstDueDate) newErrors.firstDueDate = 'تاريخ أول التزام مطلوب';
    if (!formData.cycles || parseInt(formData.cycles, 10) <= 0) newErrors.cycles = 'عدد الدورات مطلوب';
    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) newErrors.rentAmount = 'قيمة الإيجار مطلوبة';

    if (formData.firstDueDate && formData.endDate) {
      const firstDue = new Date(formData.firstDueDate);
      const end = new Date(formData.endDate);
      if (firstDue >= end) newErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ أول التزام';
    }

    if (previousContract && formData.startDate) {
      const prevEnd = new Date(previousContract.endDate);
      const start = new Date(formData.startDate);
      if (start <= prevEnd) {
        newErrors.startDate = 'تاريخ بداية العقد الجديد يجب أن يكون بعد تاريخ نهاية العقد السابق';
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }, [formData, previousContract]);

  useEffect(() => {
    validate();
  }, [validate]);

  async function handleSave(asDraft: boolean) {
    if (!asDraft && !validate()) return;
    setIsSaving(true);

    const payload: any = { ...formData };
    delete payload.contractNumber;
    payload.status = 'active';
    payload.previousContractId = id;

    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/contracts/${data.contract.id}`);
    } else {
      const data = await res.json();
      setErrors({ general: data.error || 'حدث خطأ' });
      setIsSaving(false);
    }
  }

  function handlePrint() {
    setViewMode('print');
    setTimeout(() => window.print(), 300);
  }

  if (loading) return <LoadingState message="جاري تحميل بيانات العقد..." />;
  if (!previousContract) return <EmptyStateMessage title="العقد غير موجود" description="تعذر العثور على بيانات العقد المطلوب." />;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/contracts/${id}`} className="btn-ghost text-slate-500">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">العقد</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-900">تجديد العقد: {previousContract.contractNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'edit' ? (
              <button onClick={() => setViewMode('preview')} className="btn-secondary">
                <Eye className="h-4 w-4" /> معاينة
              </button>
            ) : (
              <button onClick={() => setViewMode('edit')} className="btn-secondary">
                <Edit3 className="h-4 w-4" /> تحرير
              </button>
            )}
            <button onClick={handlePrint} className="btn-secondary">
              <Printer className="h-4 w-4" /> طباعة
            </button>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mx-auto max-w-7xl px-4 pt-4 print:hidden">
          <Alert title="تعذر حفظ التجديد">{errors.general}</Alert>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 print:p-0">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <ContractDocument
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              tenants={tenants}
              buildings={buildings}
              floors={floors}
              units={units}
              mode="renew"
              warnings={warnings}
            />
          </div>
          <div className="hidden w-80 shrink-0 lg:block print:hidden">
            <div className="sticky top-20 space-y-4">
              <ContractSummary
                formData={formData}
                tenants={tenants}
                units={units}
                buildings={buildings}
                errors={errors}
                warnings={warnings}
                isSaving={isSaving}
                onSave={handleSave}
                onPreview={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
                onPrint={handlePrint}
                onToggleEditPreview={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
                mode="renew"
                status={formData.status}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setShowMobileSummary(!showMobileSummary)} className="btn-secondary flex-1">ملخص العقد</button>
          <button onClick={() => handleSave(false)} disabled={isSaving} className="btn-primary flex-[2]">
            {isSaving ? 'جاري الحفظ...' : 'تجديد العقد'}
          </button>
        </div>
      </div>

      {showMobileSummary && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setShowMobileSummary(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-center">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
            </div>
            <ContractSummary
              formData={formData}
              tenants={tenants}
              units={units}
              buildings={buildings}
              errors={errors}
              warnings={warnings}
              isSaving={isSaving}
              onSave={handleSave}
              onPreview={() => { setViewMode(viewMode === 'preview' ? 'edit' : 'preview'); setShowMobileSummary(false); }}
              onPrint={handlePrint}
              onToggleEditPreview={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
              mode="renew"
              status={formData.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
