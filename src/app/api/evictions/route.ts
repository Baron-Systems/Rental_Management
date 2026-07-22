import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { contractId, electricityMeterReading, waterMeterReading, notes } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'العقد مطلوب' }, { status: 400 });
    }

    const evictionDate = new Date();

    const contract = await prisma.leaseContract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    if (!['expired', 'cancelled'].includes(contract.status)) {
      return NextResponse.json({ error: 'لا يمكن إخلاء الوحدة إلا للعقد المنتهي أو الملغي' }, { status: 409 });
    }

    const eviction = await prisma.eviction.create({
      data: {
        contractId,
        tenantId: contract.tenantId,
        unitId: contract.unitId,
        evictionDate: new Date(evictionDate),
        electricityMeterReading: electricityMeterReading ?? null,
        waterMeterReading: waterMeterReading ?? null,
        notes: notes || null,
      },
    });

    await prisma.leaseContract.update({
      where: { id: contractId },
      data: { status: 'evicted' },
    });

    await prisma.unit.update({
      where: { id: contract.unitId },
      data: {
        status: 'empty',
        currentElectricityMeterReading: electricityMeterReading ?? null,
        currentWaterMeterReading: waterMeterReading ?? null,
      },
    });

    await prisma.due.updateMany({
      where: {
        contractId,
        sourceType: 'auto_contract',
        status: 'approved',
        transactionDate: { gt: new Date(evictionDate) },
      },
      data: {
        status: 'cancelled',
        cancellationReason: 'إخلاء الوحدة',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ eviction }, { status: 201 });
  } catch (error: any) {
    console.error('[EVICTION POST] error:', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
