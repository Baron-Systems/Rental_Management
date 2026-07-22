import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { unitSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const unit = await prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        unitNumber: true,
        unitType: true,
        buildingId: true,
        floorId: true,
        area: true,
        roomsCount: true,
        bathroomsCount: true,
        defaultRent: true,
        electricityMeterNumber: true,
        waterMeterNumber: true,
        currentElectricityMeterReading: true,
        currentWaterMeterReading: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        building: { select: { id: true, name: true } },
        floor: { select: { name: true } },
        contracts: {
          include: { tenant: { select: { id: true, fullName: true } } },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!unit) return NextResponse.json({ error: 'الوحدة غير موجودة' }, { status: 404 });
    return NextResponse.json({ unit });
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
    const parsed = unitSchema.partial().safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const updateData: any = {};
    if (parsed.data.unitNumber !== undefined) updateData.unitNumber = parsed.data.unitNumber;
    if (parsed.data.unitType !== undefined) updateData.unitType = parsed.data.unitType;
    if (parsed.data.floorId !== undefined) updateData.floorId = parsed.data.floorId;
    if (parsed.data.area !== undefined) updateData.area = parsed.data.area ? parseFloat(parsed.data.area) : null;
    if (parsed.data.roomsCount !== undefined) updateData.roomsCount = parsed.data.roomsCount;
    if (parsed.data.bathroomsCount !== undefined) updateData.bathroomsCount = parsed.data.bathroomsCount;
    if (parsed.data.defaultRent !== undefined) updateData.defaultRent = parsed.data.defaultRent ? parseFloat(parsed.data.defaultRent) : null;
    if (parsed.data.electricityMeterNumber !== undefined) updateData.electricityMeterNumber = parsed.data.electricityMeterNumber;
    if (parsed.data.waterMeterNumber !== undefined) updateData.waterMeterNumber = parsed.data.waterMeterNumber;
    if (parsed.data.currentElectricityMeterReading !== undefined) updateData.currentElectricityMeterReading = parsed.data.currentElectricityMeterReading;
    if (parsed.data.currentWaterMeterReading !== undefined) updateData.currentWaterMeterReading = parsed.data.currentWaterMeterReading;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const unit = await prisma.unit.update({ where: { id }, data: updateData });
    return NextResponse.json({ unit });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'الوحدة غير موجودة' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const unit = await prisma.unit.findUnique({ where: { id }, select: { status: true } });
    if (unit?.status === 'rented') {
      return NextResponse.json({ error: 'لا يمكن حذف وحدة مؤجرة' }, { status: 409 });
    }

    const hasContracts = await prisma.leaseContract.count({ where: { unitId: id } });
    if (hasContracts > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف وحدة تحتوي على عقود' }, { status: 409 });
    }

    const hasEvictions = await prisma.eviction.count({ where: { unitId: id } });
    if (hasEvictions > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف وحدة تحتوي على سجلات إخلاء' }, { status: 409 });
    }

    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'الوحدة غير موجودة' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
