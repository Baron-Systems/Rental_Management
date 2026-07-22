import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildingSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        floors: { orderBy: { sortOrder: 'asc' } },
        units: {
          include: {
            floor: true,
            contracts: {
              include: { tenant: true },
              orderBy: { startDate: 'desc' },
            },
            dues: {
              where: { status: 'approved', cancelledAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            receipts: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { unitNumber: 'asc' },
        },
        contracts: {
          include: { tenant: true, unit: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!building) return NextResponse.json({ error: 'العمارة غير موجودة' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];
    const totalDuesResult = await prisma.$queryRawUnsafe<{ total: any }[]>(
      `SELECT COALESCE(SUM("amount"), 0) as total FROM "dues" WHERE "building_id" = '${id}' AND "status" = 'approved' AND "cancelled_at" IS NULL AND "due_date" <= '${today}'`
    );
    const totalReceiptsResult = await prisma.$queryRawUnsafe<{ total: any }[]>(
      `SELECT COALESCE(SUM("amount"), 0) as total FROM "receipts" WHERE "building_id" = '${id}'`
    );

    const totalDues = Number(totalDuesResult[0]?.total || 0);
    const totalReceipts = Number(totalReceiptsResult[0]?.total || 0);

    const tenantsInBuilding = await prisma.tenant.findMany({
      where: {
        contracts: {
          some: { buildingId: id },
        },
      },
      include: {
        contracts: {
          where: { buildingId: id },
          include: { unit: true },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      building: {
        ...building,
        totalDues,
        totalReceipts,
        balanceDue: totalDues - totalReceipts,
        tenants: tenantsInBuilding,
      },
    });
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
    const parsed = buildingSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const data = parsed.data;
    const building = await prisma.building.update({
      where: { id },
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

    return NextResponse.json({ building });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'اسم العمارة مستخدم مسبقاً' }, { status: 409 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'العمارة غير موجودة' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const rentedUnits = await prisma.unit.count({ where: { buildingId: id, status: 'rented' } });
    if (rentedUnits > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف عمارة تحتوي على وحدات مؤجرة' }, { status: 409 });
    }

    const hasContracts = await prisma.leaseContract.count({ where: { buildingId: id } });
    if (hasContracts > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف عمارة تحتوي على عقود' }, { status: 409 });
    }

    const hasUnits = await prisma.unit.count({ where: { buildingId: id } });
    if (hasUnits > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف عمارة تحتوي على وحدات' }, { status: 409 });
    }

    await prisma.building.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'العمارة غير موجودة' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
