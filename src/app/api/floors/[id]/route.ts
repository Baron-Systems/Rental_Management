import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { floorSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        building: { select: { name: true } },
        units: { orderBy: { unitNumber: 'asc' } },
      },
    });

    if (!floor) return NextResponse.json({ error: 'الطابق غير موجود' }, { status: 404 });
    return NextResponse.json({ floor });
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
    const parsed = floorSchema.partial().safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const floor = await prisma.floor.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ floor });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'الطابق غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const rentedUnits = await prisma.unit.count({ where: { floorId: id, status: 'rented' } });
    if (rentedUnits > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف طابق يحتوي على وحدات مؤجرة' }, { status: 409 });
    }

    const hasContracts = await prisma.leaseContract.count({ where: { unit: { floorId: id } } });
    if (hasContracts > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف طابق يحتوي على وحدات مؤجرة' }, { status: 409 });
    }

    const hasUnits = await prisma.unit.count({ where: { floorId: id } });
    if (hasUnits > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف طابق يحتوي على وحدات' }, { status: 409 });
    }

    await prisma.floor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'الطابق غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
