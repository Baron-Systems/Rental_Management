'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ContractData {
  contract: {
    contractNumber: string;
    tenant: { fullName: string; nationalId: string | null; phone: string | null; address: string | null };
    building: { name: string; address: string | null };
    unit: { unitNumber: string; unitType: string; area: number | null };
    startDate: string;
    endDate: string;
    rentAmount: number;
    paymentFrequency: string;
    paymentMethod: string | null;
    electricityResponsibility: string | null;
    waterResponsibility: string | null;
    terms: string | null;
    witnesses: string | null;
    status: string;
    dues: { dueDate: string; transactionDate: string; amount: number }[];
  };
}

export default function PrintContractPage() {
  const { id } = useParams();
  const [data, setData] = useState<ContractData | null>(null);
  const [freqLabels, setFreqLabels] = useState<Record<string, string>>({
    monthly: 'شهري', bimonthly: 'شهريين', quarterly: 'ربع سنوي',
    semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'دفعة واحدة',
  });

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((res) => res.json())
      .then((json) => { setData(json); });
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.settings?.find((s: any) => s.settingKey === 'payment_frequencies')?.settingValue;
        const arr = Array.isArray(raw) ? raw : (raw?.value ? raw.value : null);
        if (arr && Array.isArray(arr)) {
          const map: Record<string, string> = { monthly: 'شهري', bimonthly: 'شهريين', quarterly: 'ربع سنوي', semiannual: 'نصف سنوي', annual: 'سنوي', one_time: 'دفعة واحدة' };
          for (const f of arr) { if (f.value && f.label) map[f.value] = f.label; }
          setFreqLabels(map);
        }
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (data) setTimeout(() => window.print(), 500);
  }, [data]);

  if (!data?.contract) return <div className="p-8 text-center">جاري التحميل...</div>;

  const c = data.contract;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 border-b-2 border-gray-800 pb-4 text-center">
        <h1 className="text-2xl font-bold">عقد إيجار</h1>
        <p className="mt-2 text-lg">رقم العقد: {c.contractNumber}</p>
      </div>

      <div className="mb-6 space-y-2 text-sm">
        <p><strong>الطرف الأول (المؤجر):</strong> _________________________</p>
        <p><strong>الطرف الثاني (المستأجر):</strong> {c.tenant.fullName}</p>
        {c.tenant.nationalId && <p><strong>رقم الهوية:</strong> {c.tenant.nationalId}</p>}
        {c.tenant.phone && <p><strong>رقم الهاتف:</strong> {c.tenant.phone}</p>}
        {c.tenant.address && <p><strong>العنوان:</strong> {c.tenant.address}</p>}
      </div>

      <div className="mb-6 space-y-2 text-sm">
        <p><strong>العقار:</strong> {c.building.name}{c.building.address ? ` - ${c.building.address}` : ''}</p>
        <p><strong>الوحدة:</strong> {c.unit.unitNumber} ({c.unit.unitType}){c.unit.area ? ` - مساحة: ${c.unit.area} م²` : ''}</p>
      </div>

      <div className="mb-6 space-y-2 text-sm">
        <p><strong>فترة العقد:</strong> من {new Date(c.startDate).toLocaleDateString('en-GB')} إلى {new Date(c.endDate).toLocaleDateString('en-GB')}</p>
        <p><strong>قيمة الإيجار:</strong> {Number(c.rentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} شيكل</p>
        <p><strong>طريقة الدفع:</strong> {freqLabels[c.paymentFrequency] || c.paymentFrequency}{c.paymentMethod ? ` - ${c.paymentMethod}` : ''}</p>
      </div>

      {(c.electricityResponsibility || c.waterResponsibility) && (
        <div className="mb-6 space-y-2 text-sm">
          {c.electricityResponsibility && <p><strong>مسؤولية الكهرباء:</strong> {c.electricityResponsibility}</p>}
          {c.waterResponsibility && <p><strong>مسؤولية المياه:</strong> {c.waterResponsibility}</p>}
        </div>
      )}

      {c.terms && (
        <div className="mb-6">
          <p className="mb-2 font-bold text-sm">الشروط والأحكام:</p>
          <p className="whitespace-pre-wrap text-sm">{c.terms}</p>
        </div>
      )}

      {c.witnesses && (
        <div className="mb-6 text-sm">
          <p><strong>الشهود:</strong> {c.witnesses}</p>
        </div>
      )}

      {c.dues && c.dues.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 font-bold text-sm">جدول الالتزامات:</p>
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-right">#</th>
                <th className="border border-gray-300 px-2 py-1 text-right">تاريخ الالتزام</th>
                <th className="border border-gray-300 px-2 py-1 text-right">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {c.dues.map((d, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{new Date(d.dueDate || d.transactionDate).toLocaleDateString('en-GB')}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} شيكل</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
        <div>
          <p className="mb-8">توقيع المؤجر</p>
          <p>_________________________</p>
        </div>
        <div>
          <p className="mb-8">توقيع المستأجر</p>
          <p>_________________________</p>
        </div>
      </div>
    </div>
  );
}
