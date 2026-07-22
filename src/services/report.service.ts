import { prisma } from '@/lib/prisma';

export async function getDuesReport(filters: {
  startDate?: Date;
  endDate?: Date;
  tenantId?: string;
  buildingId?: string;
  unitId?: string;
  contractId?: string;
  dueTypeId?: string;
}) {
  const { startDate, endDate, tenantId, buildingId, unitId, contractId, dueTypeId } = filters;

  const where: any = { status: 'approved' };
  if (startDate) where.transactionDate = { gte: startDate };
  if (endDate) {
    if (where.transactionDate) where.transactionDate.lte = endDate;
    else where.transactionDate = { lte: endDate };
  }
  if (tenantId) where.tenantId = tenantId;
  if (buildingId) where.buildingId = buildingId;
  if (unitId) where.unitId = unitId;
  if (contractId) where.contractId = contractId;
  if (dueTypeId) where.dueTypeId = dueTypeId;

  return prisma.due.findMany({
    where,
    include: {
      tenant: { select: { fullName: true } },
      building: { select: { name: true } },
      unit: { select: { unitNumber: true } },
      contract: { select: { contractNumber: true } },
      dueType: { select: { name: true } },
    },
    orderBy: { transactionDate: 'desc' },
  });
}

export async function getReceiptsReport(filters: {
  startDate?: Date;
  endDate?: Date;
  tenantId?: string;
  buildingId?: string;
  unitId?: string;
  contractId?: string;
}) {
  const { startDate, endDate, tenantId, buildingId, unitId, contractId } = filters;

  const where: any = {};
  if (startDate) where.receiptDate = { gte: startDate };
  if (endDate) {
    if (where.receiptDate) where.receiptDate.lte = endDate;
    else where.receiptDate = { lte: endDate };
  }
  if (tenantId) where.tenantId = tenantId;
  if (buildingId) where.buildingId = buildingId;
  if (unitId) where.unitId = unitId;
  if (contractId) where.contractId = contractId;

  return prisma.receipt.findMany({
    where,
    include: {
      tenant: { select: { fullName: true } },
      building: { select: { name: true } },
      unit: { select: { unitNumber: true } },
      contract: { select: { contractNumber: true } },
    },
    orderBy: { receiptDate: 'desc' },
  });
}

export async function getBalancesReport(
  sortBy: 'balance' | 'name' | 'building' | 'unit' = 'balance',
  order: 'asc' | 'desc' = 'desc'
) {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { building: true, unit: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
      dues: { where: { status: 'approved', dueDate: { lte: new Date() } }, select: { amount: true } },
      receipts: { select: { amount: true } },
    },
  });

  const results = tenants.map((t) => {
    const totalDues = t.dues.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalReceipts = t.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const balance = totalDues - totalReceipts;

    return {
      tenantId: t.id,
      tenantName: t.fullName,
      phone: t.phone,
      building: t.contracts[0]?.building?.name || '-',
      unit: t.contracts[0]?.unit?.unitNumber || '-',
      totalDues,
      totalReceipts,
      balance,
    };
  });

  const sortFn = (a: any, b: any) => {
    let valA: any, valB: any;
    switch (sortBy) {
      case 'balance':
        valA = a.balance;
        valB = b.balance;
        break;
      case 'name':
        valA = a.tenantName;
        valB = b.tenantName;
        break;
      case 'building':
        valA = a.building;
        valB = b.building;
        break;
      case 'unit':
        valA = a.unit;
        valB = b.unit;
        break;
      default:
        valA = a.balance;
        valB = b.balance;
    }
    if (typeof valA === 'string') {
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return order === 'asc' ? valA - valB : valB - valA;
  };

  return results.sort(sortFn);
}

export async function getBuildingIncomeReport(buildingId?: string, period: 'monthly' | 'yearly' = 'monthly') {
  const today = new Date();
  const duesWhere: any = { status: 'approved', dueDate: { lte: today } };
  const receiptsWhere: any = {};
  if (buildingId) {
    duesWhere.buildingId = buildingId;
    receiptsWhere.buildingId = buildingId;
  }

  const [dues, receipts] = await Promise.all([
    prisma.due.groupBy({
      by: ['buildingId'],
      where: duesWhere,
      _sum: { amount: true },
    }),
    prisma.receipt.groupBy({
      by: ['buildingId'],
      where: receiptsWhere,
      _sum: { amount: true },
    }),
  ]);

  const buildings = await prisma.building.findMany({
    include: { units: true },
  });

  return buildings.map((b) => {
    const bDues = dues.find((d) => d.buildingId === b.id)?._sum.amount ?? 0;
    const bReceipts = receipts.find((r) => r.buildingId === b.id)?._sum.amount ?? 0;
    const totalUnits = b.units.length;
    const rentedUnits = b.units.filter((u) => u.status === 'rented').length;
    const emptyUnits = b.units.filter((u) => u.status === 'empty').length;

    return {
      buildingId: b.id,
      buildingName: b.name,
      totalDues: Number(bDues),
      totalReceipts: Number(bReceipts),
      balance: Number(bDues) - Number(bReceipts),
      totalUnits,
      rentedUnits,
      emptyUnits,
    };
  });
}

export async function getVacantUnitsReport() {
  return prisma.unit.findMany({
    where: { status: 'empty' },
    include: {
      building: { select: { name: true } },
      floor: { select: { name: true } },
    },
    orderBy: { unitNumber: 'asc' },
  });
}

export async function getOccupiedUnitsReport() {
  return prisma.unit.findMany({
    where: { status: 'rented' },
    include: {
      building: { select: { name: true } },
      contracts: {
        where: { status: 'active' },
        include: { tenant: { select: { fullName: true } } },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
    orderBy: { unitNumber: 'asc' },
  });
}

export async function getContractsReport(filters: {
  status?: string;
  buildingId?: string;
  tenantId?: string;
}) {
  const { status, buildingId, tenantId } = filters;
  const where: any = {};
  if (status) where.status = status;
  if (buildingId) where.buildingId = buildingId;
  if (tenantId) where.tenantId = tenantId;

  return prisma.leaseContract.findMany({
    where,
    include: {
      tenant: { select: { fullName: true } },
      building: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { startDate: 'desc' },
  });
}
