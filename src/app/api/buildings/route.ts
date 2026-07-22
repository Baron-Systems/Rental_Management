import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildingSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireAuth();
    const buildings = await prisma.building.findMany({
      include: {
        _count: { select: { floors: true, units: true } },
        units: { where: { status: 'rented' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const buildingIds = buildings.map((b: any) => b.id);
    const today = new Date().toISOString().split('T')[0];
    const duesSums = await prisma.$queryRawUnsafe<{ building_id: string; total: any }[]>(
      `SELECT "building_id", COALESCE(SUM("amount"), 0) as total FROM "dues" WHERE "building_id" IN (${buildingIds.map((_: any, i: number) => `'${buildingIds[i]}'`).join(',')}) AND "status" = 'approved' AND "cancelled_at" IS NULL AND "due_date" <= '${today}' GROUP BY "building_id"`
    );
    const receiptsSums = await prisma.$queryRawUnsafe<{ building_id: string; total: any }[]>(
      `SELECT "building_id", COALESCE(SUM("amount"), 0) as total FROM "receipts" WHERE "building_id" IN (${buildingIds.map((_: any, i: number) => `'${buildingIds[i]}'`).join(',')}) GROUP BY "building_id"`
    );

    const duesMap = new Map(duesSums.map((d: any) => [d.building_id, Number(d.total)]));
    const receiptsMap = new Map(receiptsSums.map((r: any) => [r.building_id, Number(r.total)]));

    return NextResponse.json({
      buildings: buildings.map((b: any) => {
        const totalDues = duesMap.get(b.id) || 0;
        const totalReceipts = receiptsMap.get(b.id) || 0;
        return {
          ...b,
          floorsCount: b._count.floors,
          unitsCount: b._count.units,
          rentedUnits: b.units.length,
          emptyUnits: b._count.units - b.units.length,
          totalDues,
          totalReceipts,
          balanceDue: Number(totalDues) - Number(totalReceipts),
        };
      }),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = buildingSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const data = parsed.data;
    const building = await prisma.building.create({
      data: {
        name: data.name,
        ownerName: data.ownerName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        floorsCount: data.floorsCount ?? undefined,
        unitsCount: data.unitsCount ?? undefined,
      },
    });
    return NextResponse.json({ building }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'اسم العمارة مستخدم مسبقاً' }, { status: 409 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
