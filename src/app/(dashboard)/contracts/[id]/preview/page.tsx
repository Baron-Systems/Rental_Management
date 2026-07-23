'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Printer } from 'lucide-react';
import { getFrequencyMonths, getFrequencyCount } from '@/lib/utils';
import { LoadingState } from '@/components/ui/StatusMessage';
import { ContractDocument, type ContractFormData, type TenantOption, type BuildingOption, type FloorOption, type UnitOption, type DueRow } from '@/components/contract/ContractDocument';

export default function PreviewContractPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '', contractDate: '', tenantId: '', buildingId: '', floorId: '', unitId: '',
    startDate: '', endDate: '', rentAmount: '', paymentFrequency: 'monthly',
    firstDueDate: '', cycles: '1', paymentMethod: '', electricityResponsibility: 'tenant',
    waterResponsibility: 'tenant', maintenanceResponsibility: 'owner',
    servicesResponsibility: 'shared', commitmentTiming: 'start', terms: '', witnesses: '', notes: '', status: 'draft',
  });
  const [loading, setLoading] = useState(true);
  const [errors] = useState<Record<string, string>>({});
  const [warnings] = useState<string[]>([]);
  const [dues, setDues] = useState<DueRow[]>([]);

  useEffect(() => {
    fetch('/api/tenants').then((r) => r.json()).then((j) => setTenants(j.tenants || []));
    fetch('/api/buildings').then((r) => r.json()).then((j) => setBuildings(j.buildings || []));
    fetch('/api/floors').then((r) => r.json()).then((j) => setFloors(j.floors || []));
    fetch('/api/units').then((r) => r.json()).then((j) => setUnits(j.units || []));
  }, []);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.contract) {
          const c = data.contract;
          const loadedUnit = units.find((u) => u.id === c.unitId);
          setFormData({
            contractNumber: c.contractNumber || '',
            contractDate: c.contractDate?.slice(0, 10) || '',
            tenantId: c.tenantId || '',
            buildingId: c.buildingId || '',
            floorId: loadedUnit?.floorId || c.unit?.floorId || '',
            unitId: c.unitId || '',
            startDate: c.startDate?.slice(0, 10) || '',
            endDate: c.endDate?.slice(0, 10) || '',
            rentAmount: c.rentAmount?.toString() || '',
            paymentFrequency: c.paymentFrequency || 'monthly',
            firstDueDate: c.firstDueDate?.slice(0, 10) || '',
            cycles: (() => {
              const firstDue = new Date(c.firstDueDate || c.startDate);
              const end = new Date(c.endDate);
              const months = getFrequencyMonths(c.paymentFrequency || 'monthly');
              return months === 0 ? '1' : String(Math.max(1, getFrequencyCount(firstDue, end, c.paymentFrequency || 'monthly')));
            })(),
            paymentMethod: c.paymentMethod || '',
            electricityResponsibility: c.electricityResponsibility || 'tenant',
            waterResponsibility: c.waterResponsibility || 'tenant',
            maintenanceResponsibility: c.maintenanceResponsibility || 'owner',
            servicesResponsibility: c.servicesResponsibility || 'shared',
            commitmentTiming: c.commitmentTiming || 'start',
            terms: c.terms || '',
            witnesses: c.witnesses || '',
            notes: c.notes || '',
            status: c.status || 'draft',
          });
          setDues((c.dues || []).map((d: any, i: number) => ({
            number: i + 1,
            dueDate: d.dueDate?.slice(0, 10) || d.transactionDate?.slice(0, 10) || '',
            amount: Number(d.amount) || 0,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, units]);

  function handlePrint() {
    const el = document.getElementById('contract-document');
    if (!el) return;

    const w = window.open('', '_blank');
    if (!w) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((s) => s.outerHTML)
      .join('');

    w.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>طباعة العقد</title>
        ${styles}
        <style>
          body { margin: 0; padding: 0; background: white; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  }

  if (loading) return <LoadingState message="جاري تحميل معاينة العقد..." />;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-ghost text-slate-500">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">رجوع</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-900">معاينة العقد</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary">
              <Printer className="h-4 w-4" /> طباعة
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div id="contract-document" className="mx-auto max-w-7xl px-4 py-6 print:p-0">
        <ContractDocument
          formData={formData}
          setFormData={() => {}}
          errors={errors}
          tenants={tenants}
          buildings={buildings}
          floors={floors}
          units={units}
          mode="preview"
          warnings={warnings}
          dues={dues}
        />
      </div>
    </div>
  );
}
