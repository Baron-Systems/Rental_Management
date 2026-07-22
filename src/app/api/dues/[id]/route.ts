import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { dueUpdateSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const due = await prisma.due.findUnique({
      where: { id: params.id },
      include: {
        dueType: true,
        tenant: true,
        building: true,
        unit: true,
        contract: true,
      },
    });
    if (!due) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ due });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = dueUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const existing = await prisma.due.findUnique({ where: { id: params.id }, include: { dueType: true } });
    if (!existing) return NextResponse.json({ error: 'الالتزام غير موجود' }, { status: 404 });
    if (existing.sourceType !== 'manual') return NextResponse.json({ error: 'لا يمكن تعديل الالتزامات الناتجة من العقود' }, { status: 403 });
    if (existing.status !== 'approved') return NextResponse.json({ error: 'لا يمكن تعديل الالتزام غير المعتمد' }, { status: 403 });

    const isMeterDue = existing.dueType && (existing.dueType.name === 'مياه' || existing.dueType.name === 'كهرباء');
    const meterField = existing.dueType?.name === 'مياه' ? 'currentWaterMeterReading' : 'currentElectricityMeterReading';

    if (isMeterDue && existing.unitId && (parsed.data.currentMeterReading || parsed.data.unitPrice)) {
      const newerDue = await prisma.due.findFirst({
        where: {
          unitId: existing.unitId,
          dueTypeId: existing.dueTypeId,
          id: { not: params.id },
          currentMeterReading: { not: null },
          status: 'approved',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (newerDue && newerDue.createdAt > existing.createdAt) {
        return NextResponse.json({ error: 'لا يمكن تعديل قراءات الالتزام لوجود التزامات أحدث مسجلة لهذا العداد' }, { status: 403 });
      }
    }

    if (isMeterDue && parsed.data.currentMeterReading) {
      const prevReading = parseFloat((parsed.data.previousMeterReading as string) || existing.previousMeterReading || '0');
      const currReading = parseFloat(parsed.data.currentMeterReading);
      if (isNaN(currReading) || currReading < prevReading) {
        return NextResponse.json({ error: 'القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة' }, { status: 400 });
      }
    }

    let buildingId = undefined;
    if (parsed.data.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: parsed.data.unitId }, select: { buildingId: true } });
      buildingId = unit?.buildingId || undefined;
    }

    const data: any = {};
    if (parsed.data.dueTypeId) data.dueTypeId = parsed.data.dueTypeId;
    if (parsed.data.unitId) { data.unitId = parsed.data.unitId; data.buildingId = buildingId; }
    if (parsed.data.dueDate) { data.dueDate = new Date(parsed.data.dueDate); data.transactionDate = new Date(parsed.data.dueDate); }
    if (parsed.data.amount) data.amount = parseFloat(parsed.data.amount);
    if (parsed.data.description !== undefined) data.description = parsed.data.description;

    if (isMeterDue) {
      if (parsed.data.previousMeterReading !== undefined) data.previousMeterReading = parsed.data.previousMeterReading;
      if (parsed.data.currentMeterReading !== undefined) data.currentMeterReading = parsed.data.currentMeterReading;
      if (parsed.data.meterConsumption !== undefined) data.meterConsumption = parsed.data.meterConsumption;
      if (parsed.data.unitPrice !== undefined) data.unitPrice = parseFloat(parsed.data.unitPrice || '0');
    }

    const due = await prisma.due.update({
      where: { id: params.id },
      data,
      include: {
        dueType: true,
        tenant: true,
        building: true,
        unit: true,
        contract: true,
      },
    });

    if (isMeterDue && existing.unitId && parsed.data.currentMeterReading) {
      const unit = await prisma.unit.findUnique({ where: { id: existing.unitId }, select: { [meterField]: true } as any });
      if (unit && (unit as any)[meterField] === existing.currentMeterReading) {
        await prisma.unit.update({
          where: { id: existing.unitId },
          data: { [meterField]: parsed.data.currentMeterReading },
        });
      }
    }

    return NextResponse.json({ due });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const existing = await prisma.due.findUnique({ where: { id: params.id }, include: { dueType: true } });
    if (!existing) return NextResponse.json({ error: 'الالتزام غير موجود' }, { status: 404 });
    if (existing.status !== 'cancelled') return NextResponse.json({ error: 'يجب إلغاء الالتزام قبل الحذف' }, { status: 403 });

    const isMeterDue = existing.dueType && (existing.dueType.name === 'مياه' || existing.dueType.name === 'كهرباء');
    const meterField = existing.dueType?.name === 'مياه' ? 'currentWaterMeterReading' : 'currentElectricityMeterReading';

    if (isMeterDue && existing.unitId && existing.currentMeterReading) {
      const newerDue = await prisma.due.findFirst({
        where: {
          unitId: existing.unitId,
          dueTypeId: existing.dueTypeId,
          id: { not: params.id },
          currentMeterReading: { not: null },
          status: 'approved',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!newerDue || newerDue.createdAt < existing.createdAt) {
        const unit = await prisma.unit.findUnique({ where: { id: existing.unitId }, select: { [meterField]: true } as any });
        if (unit && (unit as any)[meterField] === existing.currentMeterReading) {
          await prisma.unit.update({
            where: { id: existing.unitId },
            data: { [meterField]: existing.previousMeterReading || '0' },
          });
        }
      }
    }

    await prisma.due.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
