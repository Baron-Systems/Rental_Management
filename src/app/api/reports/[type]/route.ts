import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getDuesReport, getReceiptsReport, getBalancesReport, getBuildingIncomeReport, getVacantUnitsReport, getOccupiedUnitsReport, getContractsReport } from '@/services/report.service';

export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  try {
    await requireAuth();
    const { type } = params;
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const tenantId = searchParams.get('tenantId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const unitId = searchParams.get('unitId') || undefined;
    const contractId = searchParams.get('contractId') || undefined;
    const dueTypeId = searchParams.get('dueTypeId') || undefined;
    const status = searchParams.get('status') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'balance';
    const period = (searchParams.get('period') as any) || 'monthly';

    let data: any;

    switch (type) {
      case 'dues':
        data = await getDuesReport({ startDate, endDate, tenantId, buildingId, unitId, contractId, dueTypeId });
        break;
      case 'receipts':
        data = await getReceiptsReport({ startDate, endDate, tenantId, buildingId, unitId, contractId });
        break;
      case 'balances':
        data = await getBalancesReport(sortBy);
        break;
      case 'buildings-income':
        data = await getBuildingIncomeReport(buildingId, period);
        break;
      case 'vacant-units':
        data = await getVacantUnitsReport();
        break;
      case 'occupied-units':
        data = await getOccupiedUnitsReport();
        break;
      case 'contracts':
        data = await getContractsReport({ status, buildingId, tenantId });
        break;
      default:
        return NextResponse.json({ error: 'نوع التقرير غير معروف' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
