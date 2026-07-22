import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { tenantSchema } from '@/lib/validation';
import { getTenantBalance, getTenantStatement } from '@/services/balance.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: { building: true, unit: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!tenant) return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });

    const balance = await getTenantBalance(id);
    const statement = await getTenantStatement(id);

    return NextResponse.json({ tenant, balance, statement });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const body = await req.json();
    const parsed = tenantSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const tenant = await prisma.tenant.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ tenant });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const hasContracts = await prisma.leaseContract.count({ where: { tenantId: id } });
    if (hasContracts > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف مستأجر لديه عقود' }, { status: 409 });
    }

    const hasDues = await prisma.due.count({ where: { tenantId: id } });
    if (hasDues > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف مستأجر لديه حركات مالية' }, { status: 409 });
    }

    const hasReceipts = await prisma.receipt.count({ where: { tenantId: id } });
    if (hasReceipts > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف مستأجر لديه حركات مالية' }, { status: 409 });
    }

    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
