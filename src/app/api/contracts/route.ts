import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { contractSchema } from '@/lib/validation';
import { checkContractOverlap } from '@/services/contract-validation';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const unitId = searchParams.get('unitId') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;
    if (tenantId) where.tenantId = tenantId;

    const contracts = await prisma.leaseContract.findMany({
      where,
      include: {
        tenant: { select: { fullName: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        renewedContract: { select: { id: true, contractNumber: true } },
        _count: { select: { dues: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contracts });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = contractSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' }, { status: 400 });
    }

    const rentAmount = parseFloat(parsed.data.rentAmount);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      return NextResponse.json({ error: 'قيمة الإيجار يجب أن تكون أكبر من صفر' }, { status: 400 });
    }

    const prefixSetting = await prisma.setting.findUnique({ where: { settingKey: 'contract_prefix' } });
    const counterSetting = await prisma.setting.findUnique({ where: { settingKey: 'contract_counter' } });
    const prefix = (typeof prefixSetting?.settingValue === 'object' ? (prefixSetting.settingValue as any).value : prefixSetting?.settingValue) || 'CNT';
    let counter = (typeof counterSetting?.settingValue === 'object' ? (counterSetting.settingValue as any).value : counterSetting?.settingValue) || 1;
    counter = Number(counter);

    const contractNumber = `${prefix}-${String(counter).padStart(4, '0')}`;

    await prisma.setting.upsert({
      where: { settingKey: 'contract_counter' },
      update: { settingValue: { value: counter + 1 } },
      create: { settingKey: 'contract_counter', settingValue: { value: counter + 1 } },
    });

    if (parsed.data.previousContractId) {
      const prevContract = await prisma.leaseContract.findUnique({
        where: { id: parsed.data.previousContractId },
      });
      if (!prevContract) {
        return NextResponse.json({ error: 'العقد السابق غير موجود' }, { status: 404 });
      }
      if (prevContract.status !== 'expired') {
        return NextResponse.json({ error: 'يسمح بالتجديد فقط إذا كانت حالة العقد منتهي' }, { status: 400 });
      }
      const prevEndDate = new Date(prevContract.endDate);
      if (startDate <= prevEndDate) {
        return NextResponse.json({ error: 'يجب أن يكون تاريخ بداية العقد الجديد أكبر من تاريخ نهاية العقد السابق' }, { status: 400 });
      }
    }

    if (parsed.data.status === 'active') {
      const overlapping = await checkContractOverlap(parsed.data.unitId, startDate, endDate);
      if (overlapping) {
        return NextResponse.json({ error: 'يوجد عقد متداخل مع نفس الوحدة' }, { status: 409 });
      }
    }

    const contractData: any = {
      ...parsed.data,
      contractNumber,
      startDate,
      endDate,
      rentAmount,
      contractDate: parsed.data.contractDate ? new Date(parsed.data.contractDate) : null,
      firstDueDate: parsed.data.firstDueDate ? new Date(parsed.data.firstDueDate) : null,
    };
    if (parsed.data.previousContractId) {
      contractData.previousContractId = parsed.data.previousContractId;
    }

    const contract = await prisma.leaseContract.create({
      data: contractData,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastContract = endDate < today;

    return NextResponse.json({ contract, requiresDuesChoice: isPastContract }, { status: 201 });
  } catch (error: any) {
    console.log('[CREATE_CONTRACT_ERROR]', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
