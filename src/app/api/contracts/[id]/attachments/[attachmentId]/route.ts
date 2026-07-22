import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; attachmentId: string } }) {
  try {
    await requireAuth();
    const { attachmentId } = params;

    await prisma.contractAttachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'المرفق غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
