import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const body = await req.json();
    const { floorIds } = body as { floorIds: string[] };

    if (!Array.isArray(floorIds) || floorIds.length === 0) {
      return NextResponse.json({ error: 'قائمة الطوابق مطلوبة' }, { status: 400 });
    }

    for (let i = 0; i < floorIds.length; i++) {
      await prisma.floor.update({
        where: { id: floorIds[i], buildingId: id },
        data: { sortOrder: i },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
