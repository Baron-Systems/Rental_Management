import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { unitSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const floorId = searchParams.get('floorId') || undefined;
    const status = searchParams.get('status') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (floorId) where.floorId = floorId;
    if (status) where.status = status;
    if (tenantId) where.contracts = { some: { tenantId, status: 'active' } };

    const units = await prisma.unit.findMany({
      where,
      select: {
        id: true,
        unitNumber: true,
        buildingId: true,
        floorId: true,
        status: true,
        unitType: true,
        area: true,
        defaultRent: true,
        electricityMeterNumber: true,
        waterMeterNumber: true,
        building: { select: { name: true } },
        floor: { select: { name: true } },
        currentWaterMeterReading: true,
        currentElectricityMeterReading: true,
        contracts: {
          where: { status: 'active' },
          include: { tenant: { select: { fullName: true } } },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { unitNumber: 'asc' },
    });

    return NextResponse.json({ units });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = unitSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (parsed.data.area) data.area = parseFloat(parsed.data.area);
    if (parsed.data.defaultRent) data.defaultRent = parseFloat(parsed.data.defaultRent);

    const unit = await prisma.unit.create({ data });
    return NextResponse.json({ unit }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'رقم الوحدة مستخدم مسبقاً في هذه العمارة' }, { status: 409 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
