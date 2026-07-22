import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const attachments = await prisma.contractAttachment.findMany({
      where: { contractId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ attachments });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;
    const body = await req.json();

    if (!Array.isArray(body.attachments)) {
      return NextResponse.json({ error: 'المرفقات يجب أن تكون مصفوفة' }, { status: 400 });
    }

    const created = await prisma.$transaction(
      body.attachments.map((a: any) =>
        prisma.contractAttachment.create({
          data: {
            contractId: id,
            fileName: a.fileName || 'صورة',
            fileType: a.fileType || 'image',
            fileData: a.fileData,
          },
        })
      )
    );

    return NextResponse.json({ attachments: created }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
