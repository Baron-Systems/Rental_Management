import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getTenantBalance } from '@/services/balance.service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });

    const balance = await getTenantBalance(id);
    return NextResponse.json(balance);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
