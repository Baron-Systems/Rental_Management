import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { tenantSchema } from '@/lib/validation';
import { getTenantBalance } from '@/services/balance.service';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        OR: search ? [
          { fullName: { contains: search, mode: 'insensitive' } },
          { nationalId: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      include: {
        contracts: {
          where: { status: 'active' },
          include: { building: true, unit: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withBalances = await Promise.all(
      tenants.map(async (t) => {
        const balance = await getTenantBalance(t.id);
        return {
          ...t,
          totalDues: balance.totalDues,
          totalReceipts: balance.totalReceipts,
          balance: balance.balance,
        };
      })
    );

    return NextResponse.json({ tenants: withBalances });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = tenantSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({ data: parsed.data });
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
