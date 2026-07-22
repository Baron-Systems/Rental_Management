import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { floorSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    const floors = await prisma.floor.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: { building: { select: { name: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ floors });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = floorSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const floor = await prisma.floor.create({ data: parsed.data });
    return NextResponse.json({ floor }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'اسم الطابق مستخدم مسبقاً في هذه العمارة' }, { status: 409 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
