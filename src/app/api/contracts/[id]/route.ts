import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { contractSchema, contractUpdateSchema } from '@/lib/validation';
import { checkContractOverlap } from '@/services/contract-validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const contract = await prisma.leaseContract.findUnique({
      where: { id },
      include: {
        tenant: true,
        building: true,
        unit: true,
        previousContract: { include: { tenant: true, unit: true } },
        renewedContract: { include: { tenant: true, unit: true } },
        dues: {
          include: { dueType: true },
          orderBy: { transactionDate: 'asc' },
        },
        receipts: { orderBy: { receiptDate: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        evictions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    return NextResponse.json({ contract });
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
    const parsed = contractUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const contract = await prisma.leaseContract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    if (contract.status !== 'draft') {
      return NextResponse.json({ error: 'لا يمكن تعديل العقد بعد الاعتماد' }, { status: 409 });
    }

    const updateData: any = { ...parsed.data };
    delete updateData.contractNumber;
    if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.endDate = new Date(parsed.data.endDate);
    if (parsed.data.rentAmount) updateData.rentAmount = parseFloat(parsed.data.rentAmount);
    if (parsed.data.contractDate) updateData.contractDate = new Date(parsed.data.contractDate);
    if (parsed.data.firstDueDate) updateData.firstDueDate = new Date(parsed.data.firstDueDate);

    const updated = await prisma.leaseContract.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ contract: updated });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { id } = params;

    const contract = await prisma.leaseContract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    if (contract.status !== 'draft') {
      return NextResponse.json({ error: 'لا يمكن حذف العقد بعد الاعتماد' }, { status: 409 });
    }

    await prisma.leaseContract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
