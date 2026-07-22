import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const [buildingsCount, unitsCount, rentedUnitsCount, emptyUnitsCount, tenantsCount, activeContractsCount] = await Promise.all([
      prisma.building.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'rented' } }),
      prisma.unit.count({ where: { status: 'empty' } }),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.leaseContract.count({ where: { status: 'active' } }),
    ]);

    const today = new Date();
    const [duesSum, receiptsSum] = await Promise.all([
      prisma.due.aggregate({ where: { status: 'approved', transactionDate: { lte: today } }, _sum: { amount: true } }),
      prisma.receipt.aggregate({ where: { receiptDate: { lte: today } }, _sum: { amount: true } }),
    ]);

    const totalDues = Number(duesSum._sum.amount ?? 0);
    const totalReceipts = Number(receiptsSum._sum.amount ?? 0);
    const totalBalance = totalDues - totalReceipts;

    const latestDues = await prisma.due.findMany({
      where: { status: 'approved', transactionDate: { lte: today } },
      include: { tenant: { select: { fullName: true } }, dueType: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const latestReceipts = await prisma.receipt.findMany({
      include: { tenant: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const latestContracts = await prisma.leaseContract.findMany({
      where: { status: 'active' },
      include: { tenant: { select: { fullName: true } }, unit: { select: { unitNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const expiredContracts = await prisma.leaseContract.findMany({
      where: { status: 'expired' },
      include: { tenant: { select: { fullName: true } }, unit: { select: { unitNumber: true } } },
      orderBy: { endDate: 'desc' },
      take: 5,
    });

    const tenantsWithBalance = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let tenantsWithBalanceCount = 0;
    for (const t of tenantsWithBalance) {
      const [dues, receipts] = await Promise.all([
        prisma.due.aggregate({ where: { tenantId: t.id, status: 'approved', transactionDate: { lte: today } }, _sum: { amount: true } }),
        prisma.receipt.aggregate({ where: { tenantId: t.id, receiptDate: { lte: today } }, _sum: { amount: true } }),
      ]);
      const balance = Number(dues._sum.amount ?? 0) - Number(receipts._sum.amount ?? 0);
      if (balance > 0) tenantsWithBalanceCount++;
    }

    return NextResponse.json({
      stats: {
        buildingsCount,
        unitsCount,
        rentedUnitsCount,
        emptyUnitsCount,
        occupancyRate: unitsCount > 0 ? Math.round((rentedUnitsCount / unitsCount) * 100) : 0,
        tenantsCount,
        activeContractsCount,
        totalDues,
        totalReceipts,
        totalBalance,
        tenantsWithBalanceCount,
      },
      latestDues,
      latestReceipts,
      latestContracts,
      expiredContracts,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
