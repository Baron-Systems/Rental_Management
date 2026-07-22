import { prisma } from '@/lib/prisma';
import { getFrequencyCount, calculateContractDueSchedule } from '@/lib/utils';

async function getFrequencyConfig() {
  const setting = await prisma.setting.findUnique({
    where: { settingKey: 'payment_frequencies' },
  });
  if (!setting) return undefined;
  const raw = setting.settingValue as any;
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.value) ? raw.value : null);
  if (!Array.isArray(arr)) return undefined;
  const config: Record<string, number> = {};
  for (const item of arr) {
    if (item && typeof item.value === 'string' && typeof item.months === 'number') {
      config[item.value] = item.months;
    }
  }
  return Object.keys(config).length > 0 ? config : undefined;
}

export async function generateContractDues(contractId: string, userId?: string) {
  const contract = await prisma.leaseContract.findUnique({
    where: { id: contractId },
    include: { unit: true, tenant: true },
  });

  if (!contract) throw new Error('Contract not found');
  if (contract.status !== 'active' && contract.status !== 'expired') throw new Error('Contract must be active or expired');

  const existingDues = await prisma.due.findMany({
    where: { contractId, sourceType: 'auto_contract' },
  });

  if (existingDues.length > 0) {
    throw new Error('Dues already generated for this contract');
  }

  const freqConfig = await getFrequencyConfig();
  const baseDate = contract.firstDueDate || contract.startDate;
  const count = getFrequencyCount(baseDate, contract.endDate, contract.paymentFrequency, freqConfig);
  const dueType = await prisma.dueType.findFirst({
    where: { name: 'إيجار', isActive: true },
  });

  if (!dueType) throw new Error('Rent due type not found');

  const prefixSetting = await prisma.setting.findUnique({ where: { settingKey: 'due_prefix' } });
  const counterSetting = await prisma.setting.findUnique({ where: { settingKey: 'due_counter' } });
  const prefix = (typeof prefixSetting?.settingValue === 'object' ? (prefixSetting.settingValue as any).value : prefixSetting?.settingValue) || 'DUE';
  let counter = (typeof counterSetting?.settingValue === 'object' ? (counterSetting.settingValue as any).value : counterSetting?.settingValue) || 1;
  counter = Number(counter);

  const schedule = calculateContractDueSchedule(
    baseDate,
    contract.endDate,
    Number(contract.rentAmount),
    contract.paymentFrequency,
    count,
    (contract as any).commitmentTiming,
    freqConfig
  );

  const dues = [];
  for (const item of schedule) {
    const dueNumber = `${prefix}${String(counter).padStart(4, '0')}`;
    counter++;

    const due = await prisma.due.create({
      data: {
        dueNumber,
        tenantId: contract.tenantId,
        contractId: contract.id,
        buildingId: contract.buildingId,
        unitId: contract.unitId,
        dueTypeId: dueType.id,
        transactionDate: item.dueDate,
        dueDate: item.dueDate,
        periodLabel: item.periodLabel,
        description: `إيجار ${item.periodLabel}`,
        amount: item.amount,
        sourceType: 'auto_contract',
        referenceNumber: contract.contractNumber,
        status: 'approved',
      },
    });
    dues.push(due);
  }

  await prisma.setting.upsert({
    where: { settingKey: 'due_counter' },
    update: { settingValue: { value: counter } },
    create: { settingKey: 'due_counter', settingValue: { value: counter } },
  });

  return dues;
}

export async function regenerateFutureDues(
  contractId: string,
  newRentAmount: number,
  fromDate: Date,
  userId?: string
) {
  const contract = await prisma.leaseContract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new Error('Contract not found');

  const futureDues = await prisma.due.findMany({
    where: {
      contractId,
      sourceType: 'auto_contract',
      status: 'approved',
      transactionDate: { gte: fromDate }
    },
  });

  if (futureDues.length === 0) return [];

  const updated = [];
  for (const due of futureDues) {
    const updatedDue = await prisma.due.update({
      where: { id: due.id },
      data: {
        amount: newRentAmount,
        description: `${due.description} (تعديل قيمة الإيجار)`,
      },
    });
    updated.push(updatedDue);
  }

  return updated;
}

export async function cancelFutureDues(contractId: string, fromDate: Date, reason: string, cancelledBy: string) {
  const futureDues = await prisma.due.findMany({
    where: {
      contractId,
      sourceType: 'auto_contract',
      status: 'approved',
      transactionDate: { gte: fromDate }
    },
  });

  for (const due of futureDues) {
    await prisma.due.update({
      where: { id: due.id },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: new Date(),
      },
    });
  }

  return futureDues.length;
}
