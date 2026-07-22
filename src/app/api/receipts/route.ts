import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { receiptSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        tenant: { select: { fullName: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        contract: { select: { contractNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ receipts });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = receiptSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      console.error('[Receipts API] Validation failed:', messages, 'Body:', body);
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const amount = parseFloat(parsed.data.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('[Receipts API] Invalid amount:', parsed.data.amount);
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 });
    }

    const prefixSetting = await prisma.setting.findUnique({ where: { settingKey: 'receipt_prefix' } });
    const counterSetting = await prisma.setting.findUnique({ where: { settingKey: 'receipt_counter' } });
    const prefix = (typeof prefixSetting?.settingValue === 'object' ? (prefixSetting.settingValue as any).value : prefixSetting?.settingValue) || 'REC';
    let counter = (typeof counterSetting?.settingValue === 'object' ? (counterSetting.settingValue as any).value : counterSetting?.settingValue) || 1;
    counter = Number(counter);

    const receiptNumber = `${prefix}${String(counter).padStart(4, '0')}`;

    await prisma.setting.upsert({
      where: { settingKey: 'receipt_counter' },
      update: { settingValue: { value: counter + 1 } },
      create: { settingKey: 'receipt_counter', settingValue: { value: counter + 1 } },
    });

    const data = {
      ...parsed.data,
      receiptNumber,
      amount,
      receiptDate: new Date(parsed.data.receiptDate),
    };
    if (data.contractId === undefined || data.contractId === '') delete (data as any).contractId;
    if (data.buildingId === undefined || data.buildingId === '') delete (data as any).buildingId;
    if (data.unitId === undefined || data.unitId === '') delete (data as any).unitId;

    const receipt = await prisma.receipt.create({ data });

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Receipts API] Exception:', error);
    return NextResponse.json({ error: 'حدث خطأ', detail: error.message || String(error) }, { status: 500 });
  }
}
