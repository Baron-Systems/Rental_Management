import { prisma } from '@/lib/prisma';

export interface TenantBalance {
  tenantId: string;
  totalDues: number;
  totalReceipts: number;
  balance: number;
}

export async function getTenantBalance(tenantId: string): Promise<TenantBalance> {
  const today = new Date();
  const [duesResult, receiptsResult] = await Promise.all([
    prisma.due.aggregate({
      where: {
        tenantId,
        status: 'approved',
        dueDate: { lte: today },
      },
      _sum: { amount: true },
    }),
    prisma.receipt.aggregate({
      where: { tenantId },
      _sum: { amount: true },
    }),
  ]);

  const totalDues = Number(duesResult._sum.amount ?? 0);
  const totalReceipts = Number(receiptsResult._sum.amount ?? 0);
  const balance = totalDues - totalReceipts;

  return {
    tenantId,
    totalDues,
    totalReceipts,
    balance,
  };
}

export async function getTenantStatement(
  tenantId: string,
  options?: { startDate?: Date; endDate?: Date; buildingId?: string; unitId?: string; contractId?: string; dueTypeId?: string }
) {
  const { startDate, endDate, buildingId, unitId, contractId, dueTypeId } = options ?? {};

  const today = new Date();
  const duesWhere: any = {
    tenantId,
    status: 'approved',
  };

  const receiptsWhere: any = {
    tenantId,
  };

  if (startDate) {
    duesWhere.transactionDate = { gte: startDate };
    receiptsWhere.receiptDate = { gte: startDate };
  }
  if (endDate) {
    if (duesWhere.transactionDate) duesWhere.transactionDate.lte = endDate;
    else duesWhere.transactionDate = { lte: endDate };
    if (receiptsWhere.receiptDate) receiptsWhere.receiptDate.lte = endDate;
    else receiptsWhere.receiptDate = { lte: endDate };
  } else {
    duesWhere.transactionDate = { lte: today };
    receiptsWhere.receiptDate = { lte: today };
  }
  if (buildingId) {
    duesWhere.buildingId = buildingId;
    receiptsWhere.buildingId = buildingId;
  }
  if (unitId) {
    duesWhere.unitId = unitId;
    receiptsWhere.unitId = unitId;
  }
  if (contractId) {
    duesWhere.contractId = contractId;
    receiptsWhere.contractId = contractId;
  }
  if (dueTypeId) {
    duesWhere.dueTypeId = dueTypeId;
  }

  const [dues, receipts] = await Promise.all([
    prisma.due.findMany({
      where: duesWhere,
      include: { dueType: true, building: true, unit: true, contract: true },
      orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.receipt.findMany({
      where: receiptsWhere,
      include: { building: true, unit: true, contract: true },
      orderBy: [{ receiptDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);

  const allTransactions = [
    ...dues.map((d) => {
      const dateStr = d.transactionDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
      return {
        id: d.id,
        date: d.transactionDate,
        createdAt: d.createdAt,
        type: 'due' as const,
        typeName: d.dueType.name,
        description: d.sourceType === 'auto_contract' ? `${d.dueType.name} - ${dateStr}` : (d.description || d.dueType.name),
        reference: d.referenceNumber || d.dueNumber,
        debit: Number(d.amount),
        credit: 0,
        building: d.building?.name,
        unit: d.unit?.unitNumber,
      };
    }),
    ...receipts.map((r) => ({
      id: r.id,
      date: r.receiptDate,
      createdAt: r.createdAt,
      type: 'receipt' as const,
      typeName: 'سند قبض',
      description: 'دفعة من المستأجر',
      reference: r.receiptNumber,
      debit: 0,
      credit: Number(r.amount),
      building: r.building?.name,
      unit: r.unit?.unitNumber,
    })),
  ];

  allTransactions.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (createdDiff !== 0) return createdDiff;
    return a.id.localeCompare(b.id);
  });

  let runningBalance = 0;
  const lines = allTransactions.map((t) => {
    runningBalance += t.debit - t.credit;
    return { ...t, balance: runningBalance };
  });

  return {
    lines,
    openingBalance: 0,
    totalDues: lines.reduce((sum, l) => sum + l.debit, 0),
    totalReceipts: lines.reduce((sum, l) => sum + l.credit, 0),
    closingBalance: runningBalance,
  };
}

export async function getAllTenantBalances() {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const balances = await Promise.all(
    tenants.map((t) => getTenantBalance(t.id))
  );

  return balances;
}

export async function getBuildingBalance(buildingId: string) {
  const today = new Date();
  const [duesResult, receiptsResult] = await Promise.all([
    prisma.due.aggregate({
      where: { buildingId, status: 'approved', dueDate: { lte: today } },
      _sum: { amount: true },
    }),
    prisma.receipt.aggregate({
      where: { buildingId },
      _sum: { amount: true },
    }),
  ]);

  const totalDues = Number(duesResult._sum.amount ?? 0);
  const totalReceipts = Number(receiptsResult._sum.amount ?? 0);
  return { totalDues, totalReceipts, balance: totalDues - totalReceipts };
}
