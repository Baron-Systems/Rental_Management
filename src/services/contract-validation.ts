import { prisma } from '@/lib/prisma';

export async function checkContractOverlap(
  unitId: string,
  startDate: Date,
  endDate: Date,
  excludeContractId?: string
): Promise<boolean> {
  const where: any = {
    unitId,
    status: { in: ['active', 'draft'] },
    OR: [
      {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    ],
  };

  if (excludeContractId) {
    where.id = { not: excludeContractId };
  }

  const overlapping = await prisma.leaseContract.findFirst({
    where,
  });

  return !!overlapping;
}

export async function validateContractDates(
  startDate: Date,
  endDate: Date
): Promise<string | null> {
  if (startDate >= endDate) {
    return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }
  return null;
}

export async function validateRentAmount(amount: number): Promise<string | null> {
  if (isNaN(amount) || amount <= 0) {
    return 'قيمة الإيجار يجب أن تكون أكبر من صفر';
  }
  return null;
}

export async function validateContractNumber(contractNumber: string, excludeId?: string): Promise<string | null> {
  const where: any = { contractNumber };
  if (excludeId) where.id = { not: excludeId };

  const existing = await prisma.leaseContract.findFirst({ where });
  if (existing) return 'رقم العقد مستخدم مسبقاً';
  return null;
}

export async function getUnitCurrentContract(unitId: string) {
  return prisma.leaseContract.findFirst({
    where: { unitId, status: 'active' },
    orderBy: { startDate: 'desc' },
  });
}

export async function updateUnitStatus(unitId: string, status: string) {
  return prisma.unit.update({
    where: { id: unitId },
    data: { status },
  });
}

export async function expireContracts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredContracts = await prisma.leaseContract.findMany({
    where: {
      status: 'active',
      endDate: { lt: today },
    },
  });

  for (const contract of expiredContracts) {
    await prisma.leaseContract.update({
      where: { id: contract.id },
      data: { status: 'expired' },
    });

    // Revert unit to empty if no other active contract exists for it
    const otherActive = await prisma.leaseContract.findFirst({
      where: {
        unitId: contract.unitId,
        status: 'active',
        id: { not: contract.id },
      },
    });

    if (!otherActive) {
      await prisma.unit.update({
        where: { id: contract.unitId },
        data: { status: 'empty' },
      });
    }
  }

  return expiredContracts.length;
}

export function isHistoricalContract(startDate: Date, endDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return startDate < today && endDate < today;
}
