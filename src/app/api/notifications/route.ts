import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function getSettingValue(settings: any[], key: string, defaultValue: any) {
  const s = settings.find((x) => x.settingKey === key);
  if (!s || s.settingValue == null) return defaultValue;
  const v = s.settingValue?.value ?? s.settingValue;
  return v ?? defaultValue;
}

export async function GET() {
  try {
    await requireAuth();

    const allSettings = await prisma.setting.findMany();
    const alertDays = Number(getSettingValue(allSettings, 'contract_alert_days', 30));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertDate = new Date(today);
    alertDate.setDate(today.getDate() + alertDays);

    const upcomingDueDate = new Date(today);
    upcomingDueDate.setDate(today.getDate() + 7);

    // Contracts nearing expiry (active and ending within alertDays)
    const nearingExpiryContracts = await prisma.leaseContract.findMany({
      where: {
        status: 'active',
        endDate: { lte: alertDate, gte: today },
      },
      include: {
        tenant: { select: { fullName: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 20,
    });

    // Expired contracts still marked active (system should auto-update, but show alert)
    const expiredActiveContracts = await prisma.leaseContract.findMany({
      where: {
        status: 'active',
        endDate: { lt: today },
      },
      include: {
        tenant: { select: { fullName: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    });

    // Upcoming dues within next 7 days
    const upcomingDues = await prisma.due.findMany({
      where: {
        status: 'approved',
        dueDate: { gte: today, lte: upcomingDueDate },
      },
      include: {
        tenant: { select: { fullName: true } },
        dueType: { select: { name: true } },
        building: { select: { name: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    const notifications: any[] = [];

    for (const c of expiredActiveContracts) {
      const diff = Math.ceil((today.getTime() - new Date(c.endDate).getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `expired-contract-${c.id}`,
        type: 'expired_contract',
        title: 'عقد منتهٍ',
        message: `عقد ${c.tenant.fullName} في ${c.building?.name ?? ''} - ${c.unit?.unitNumber ?? ''} انتهى منذ ${diff} يوم`,
        link: `/contracts/${c.id}`,
        createdAt: c.endDate,
        priority: 'high',
      });
    }

    for (const c of nearingExpiryContracts) {
      const diff = Math.ceil((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `nearing-contract-${c.id}`,
        type: 'nearing_contract',
        title: 'عقد على وشك الانتهاء',
        message: `عقد ${c.tenant.fullName} في ${c.building?.name ?? ''} - ${c.unit?.unitNumber ?? ''} ينتهي خلال ${diff} يوم`,
        link: `/contracts/${c.id}`,
        createdAt: c.endDate,
        priority: diff <= 7 ? 'high' : 'medium',
      });
    }

    for (const d of upcomingDues) {
      const diff = Math.ceil((new Date(d.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `upcoming-due-${d.id}`,
        type: 'upcoming_due',
        title: 'استحقاق قادم',
        message: `${d.dueType.name} - ${d.tenant.fullName} بمبلغ ${d.amount} مستحق خلال ${diff} يوم`,
        link: `/dues`,
        createdAt: d.dueDate,
        priority: diff <= 1 ? 'high' : 'medium',
      });
    }

    notifications.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      count: notifications.length,
      notifications: notifications.slice(0, 25),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
