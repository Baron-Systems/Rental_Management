import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { dueSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const contractId = searchParams.get('contractId') || undefined;
    const status = searchParams.get('status') || undefined;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (contractId) where.contractId = contractId;
    if (status) where.status = status;

    const dues = await prisma.due.findMany({
      where,
      select: {
        id: true,
        dueNumber: true,
        tenantId: true,
        contractId: true,
        buildingId: true,
        unitId: true,
        dueTypeId: true,
        transactionDate: true,
        dueDate: true,
        periodLabel: true,
        description: true,
        amount: true,
        sourceType: true,
        referenceNumber: true,
        status: true,
        cancellationReason: true,
        cancelledBy: true,
        cancelledAt: true,
        notes: true,
        previousMeterReading: true,
        currentMeterReading: true,
        meterConsumption: true,
        unitPrice: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { fullName: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        contract: { select: { contractNumber: true } },
        dueType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ dues });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = dueSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const dueType = await prisma.dueType.findUnique({ where: { id: parsed.data.dueTypeId } });
    const isMeterDue = dueType && (dueType.name === 'مياه' || dueType.name === 'كهرباء');

    let amount = 0;
    let meterFields: { prevReading: string; currReading: string; consumption: string; unitPrice: number; unit: any } | null = null;

    if (isMeterDue) {
      if (!parsed.data.currentMeterReading || parsed.data.currentMeterReading.trim() === '') {
        return NextResponse.json({ error: 'القراءة الحالية مطلوبة للالتزامات المترية' }, { status: 400 });
      }
      if (!parsed.data.unitPrice || parsed.data.unitPrice.trim() === '') {
        return NextResponse.json({ error: 'سعر الوحدة مطلوب للالتزامات المترية' }, { status: 400 });
      }

      const unit = parsed.data.unitId ? await prisma.unit.findUnique({ where: { id: parsed.data.unitId }, select: { buildingId: true, currentWaterMeterReading: true, currentElectricityMeterReading: true } }) : null;
      const unitReading = dueType?.name === 'مياه' ? unit?.currentWaterMeterReading : unit?.currentElectricityMeterReading;
      const prevReading = parseFloat(parsed.data.previousMeterReading || unitReading || '0');
      const currReading = parseFloat(parsed.data.currentMeterReading);
      const unitPrice = parseFloat(parsed.data.unitPrice);

      if (isNaN(currReading) || currReading < prevReading) {
        return NextResponse.json({ error: 'القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة' }, { status: 400 });
      }
      if (isNaN(unitPrice) || unitPrice <= 0) {
        return NextResponse.json({ error: 'سعر الوحدة يجب أن يكون أكبر من صفر' }, { status: 400 });
      }

      const consumption = currReading - prevReading;
      amount = consumption * unitPrice;
      meterFields = { prevReading: String(prevReading), currReading: String(currReading), consumption: String(consumption), unitPrice, unit };
    } else {
      amount = parseFloat(parsed.data.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 });
      }
    }

    const prefixSetting = await prisma.setting.findUnique({ where: { settingKey: 'due_prefix' } });
    const counterSetting = await prisma.setting.findUnique({ where: { settingKey: 'due_counter' } });
    const prefix = (typeof prefixSetting?.settingValue === 'object' ? (prefixSetting.settingValue as any).value : prefixSetting?.settingValue) || 'DUE';
    let counter = (typeof counterSetting?.settingValue === 'object' ? (counterSetting.settingValue as any).value : counterSetting?.settingValue) || 1;
    counter = Number(counter);

    const dueNumber = `${prefix}${String(counter).padStart(4, '0')}`;

    await prisma.setting.upsert({
      where: { settingKey: 'due_counter' },
      update: { settingValue: { value: counter + 1 } },
      create: { settingKey: 'due_counter', settingValue: { value: counter + 1 } },
    });

    const unit = parsed.data.unitId ? await prisma.unit.findUnique({ where: { id: parsed.data.unitId }, select: { buildingId: true } }) : null;

    const createData: any = {
      tenantId: parsed.data.tenantId,
      unitId: parsed.data.unitId,
      buildingId: unit?.buildingId || null,
      dueTypeId: parsed.data.dueTypeId,
      dueDate: new Date(parsed.data.dueDate),
      transactionDate: new Date(parsed.data.dueDate),
      amount,
      description: parsed.data.description,
      sourceType: 'manual',
      status: 'approved',
      dueNumber,
    };

    if (meterFields) {
      createData.previousMeterReading = meterFields.prevReading;
      createData.currentMeterReading = meterFields.currReading;
      createData.meterConsumption = meterFields.consumption;
      createData.unitPrice = meterFields.unitPrice;
    }

    const due = await prisma.due.create({ data: createData });

    if (meterFields && parsed.data.unitId) {
      const meterField = dueType?.name === 'مياه' ? 'currentWaterMeterReading' : 'currentElectricityMeterReading';
      await prisma.unit.update({
        where: { id: parsed.data.unitId },
        data: { [meterField]: meterFields.currReading },
      });
    }

    return NextResponse.json({ due }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
