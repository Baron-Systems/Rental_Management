import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkContractOverlap } from '@/services/contract-validation';
import { generateContractDues } from '@/services/due-generation.service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const { id } = params;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const generateDues = body.generateDues === true;

    const contract = await prisma.leaseContract.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    if (contract.status !== 'draft') {
      return NextResponse.json({ error: 'العقد ليس مسودة' }, { status: 409 });
    }

    const overlapping = await checkContractOverlap(
      contract.unitId,
      contract.startDate,
      contract.endDate,
      contract.id
    );
    if (overlapping) {
      return NextResponse.json({ error: 'يوجد عقد متداخل مع نفس الوحدة' }, { status: 409 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastContract = contract.endDate < today;
    const newStatus = isPastContract ? 'expired' : 'active';

    const updated = await prisma.leaseContract.update({
      where: { id },
      data: { status: newStatus },
    });

    if (!isPastContract) {
      await prisma.unit.update({
        where: { id: contract.unitId },
        data: { status: 'rented' },
      });
    }

    if (generateDues || !isPastContract) {
      try {
        await generateContractDues(id, user.id);
      } catch (e: any) {
        if (e.message !== 'Dues already generated for this contract') {
          console.error('Due generation error:', e);
        }
      }
    }

    return NextResponse.json({ contract: updated });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
