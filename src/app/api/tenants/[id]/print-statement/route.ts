import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getTenantStatement } from '@/services/balance.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });

    const activeContract = await prisma.leaseContract.findFirst({
      where: { tenantId: id, status: 'active' },
      include: { building: true, unit: true },
      orderBy: { startDate: 'desc' },
    });

    const latestContract = activeContract || await prisma.leaseContract.findFirst({
      where: { tenantId: id },
      include: { building: true, unit: true },
      orderBy: { startDate: 'desc' },
    });

    const statement = await getTenantStatement(id);

    return NextResponse.json({
      tenant,
      contract: latestContract,
      statement,
      reportDate: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
