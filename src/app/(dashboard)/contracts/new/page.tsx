'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ContractDocument, type ContractFormData, type TenantOption, type BuildingOption, type FloorOption, type UnitOption } from '@/components/contract/ContractDocument';
import { Alert } from '@/components/ui/Alert';
import { ContractSummary } from '@/components/contract/ContractSummary';
import { PastContractDuesDialog } from '@/components/contract/PastContractDuesDialog';

export default function NewContractPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'print'>('edit');
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showDuesDialog, setShowDuesDialog] = useState(false);
  const [pendingContractId, setPendingContractId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '',
    contractDate: new Date().toISOString().split('T')[0],
    tenantId: '',
    buildingId: '',
    floorId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    paymentFrequency: '',
    firstDueDate: '',
    cycles: '1',
    paymentMethod: '',
    electricityResponsibility: 'tenant',
    waterResponsibility: 'tenant',
    maintenanceResponsibility: 'owner',
    servicesResponsibility: 'shared',
    commitmentTiming: 'start',
    terms: '',
    witnesses: '',
    notes: '',
    status: 'draft',
  });

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
      const defaultTerms = (getVal('default_contract_terms') || '') as string;
      setFormData((prev) => ({ ...prev, contractNumber: `${prefix}-${nextNum}`, terms: defaultTerms }));
    });
  }, []);

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

    const unit = units.find((u) => u.id === formData.unitId);
    if (unit && unit.status !== 'empty' && unit.status !== 'rented') {
      // rented is okay for edit, but for new contract it should be empty
      // We'll let the server handle overlap checks
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }, [formData, units]);

  useEffect(() => {
    validate();
  }, [validate]);

  async function handleSave(asDraft: boolean) {
    const isValid = validate();
    if (!isValid && !asDraft) {
      return;
    }

    setIsSaving(true);
    const payload: any = { ...formData };
    delete payload.contractNumber;

    console.log('[CREATE_CONTRACT_PAYLOAD]', payload);
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (asDraft) {
        router.push('/contracts');
      } else if (data.requiresDuesChoice) {
        setPendingContractId(data.contract.id);
        setShowDuesDialog(true);
        setIsSaving(false);
      } else {
        // Approve immediately
        const approveRes = await fetch(`/api/contracts/${data.contract.id}/approve`, { method: 'POST' });
        if (approveRes.ok) {
          router.push('/contracts');
        } else {
          const err = await approveRes.json();
          setErrors({ general: err.error || 'فشل اعتماد العقد' });
          setIsSaving(false);
        }
      }
    } else {
      const data = await res.json();
      console.log('[CREATE_CONTRACT_ERROR]', data);
      setErrors({ general: data.error || 'حدث خطأ' });
      setIsSaving(false);
    }
  }

  async function handleApproveWithDuesChoice(generateDues: boolean) {
    if (!pendingContractId) return;
    setIsSaving(true);
    const approveRes = await fetch(`/api/contracts/${pendingContractId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generateDues }),
    });
    if (approveRes.ok) {
      setShowDuesDialog(false);
      router.push('/contracts');
    } else {
      const err = await approveRes.json();
      setErrors({ general: err.error || 'فشل اعتماد العقد' });
      setIsSaving(false);
    }
  }

  function handlePrint() {
    setViewMode('print');
    setTimeout(() => window.print(), 300);
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {errors.general && (
        <div className="mx-auto max-w-7xl px-4 pt-4 print:hidden">
          <Alert title="تعذر حفظ العقد">{errors.general}</Alert>
        </div>
      )}

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 print:p-0">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Document */}
          <div className="flex-1">
            <ContractDocument
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              tenants={tenants}
              buildings={buildings}
              floors={floors}
              units={units}
              mode={viewMode}
              warnings={warnings}
            />
          </div>

          {/* Sidebar - Desktop */}
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
                mode="create"
                status="draft"
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Trigger */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="btn-secondary flex-1"
          >
            ملخص العقد
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="btn-primary flex-[2]"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ العقد'}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
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
              mode="create"
              status="draft"
              viewMode={viewMode}
            />
          </div>
        </div>
      )}

      <PastContractDuesDialog
        isOpen={showDuesDialog}
        isLoading={isSaving}
        onConfirm={handleApproveWithDuesChoice}
        onCancel={() => { setShowDuesDialog(false); setPendingContractId(null); setIsSaving(false); }}
      />
    </div>
  );
}
