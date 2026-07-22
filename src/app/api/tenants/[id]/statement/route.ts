import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getTenantStatement } from '@/services/balance.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const unitId = searchParams.get('unitId') || undefined;
    const contractId = searchParams.get('contractId') || undefined;
    const dueTypeId = searchParams.get('dueTypeId') || undefined;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });

    const statement = await getTenantStatement(id, { startDate, endDate, buildingId, unitId, contractId, dueTypeId });
    return NextResponse.json(statement);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
