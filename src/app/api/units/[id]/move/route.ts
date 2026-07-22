import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const body = await req.json();
    const { floorId } = body as { floorId: string };

    if (!floorId) {
      return NextResponse.json({ error: 'معرف الطابق مطلوب' }, { status: 400 });
    }

    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) return NextResponse.json({ error: 'الوحدة غير موجودة' }, { status: 404 });

    const floor = await prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) return NextResponse.json({ error: 'الطابق غير موجود' }, { status: 404 });

    if (floor.buildingId !== unit.buildingId) {
      return NextResponse.json({ error: 'لا يمكن نقل الوحدة إلى عمارة مختلفة' }, { status: 400 });
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: { floorId },
    });

    return NextResponse.json({ unit: updated });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
