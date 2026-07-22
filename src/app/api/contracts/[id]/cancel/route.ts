import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const body = await req.json();

    const contract = await prisma.leaseContract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: 'العقد ملغي مسبقاً' }, { status: 409 });
    }

    const updated = await prisma.leaseContract.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    await prisma.due.updateMany({
      where: {
        contractId: id,
        status: 'approved',
        sourceType: 'auto_contract',
        transactionDate: { gt: new Date() },
      },
      data: {
        status: 'cancelled',
        cancellationReason: body.reason || 'إلغاء العقد',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ contract: updated });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
