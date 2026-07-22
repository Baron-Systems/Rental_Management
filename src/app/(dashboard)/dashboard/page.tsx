'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Home,
  Users,
  FileText,
  Receipt,
  Banknote,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileSignature,
  Wallet,
  Calendar,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageSkeleton } from '@/components/ui/SkeletonCard';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  buildingsCount: number;
  unitsCount: number;
  rentedUnitsCount: number;
  emptyUnitsCount: number;
  occupancyRate: number;
  tenantsCount: number;
  activeContractsCount: number;
  totalDues: number;
  totalReceipts: number;
  totalBalance: number;
  tenantsWithBalanceCount: number;
}

function KPICard({
  label,
  value,
  icon: Icon,
  href,
  color,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  return (
    <Link href={href} className="kpi-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1 text-xs">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
              ) : null}
              <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!stats) return <div className="py-20 text-center text-slate-500">حدث خطأ أثناء تحميل البيانات</div>;

  const kpiCards = [
    {
      label: 'إجمالي المستحقات',
      value: formatCurrency(stats.totalDues) || '0.00',
      icon: Receipt,
      href: '/dues',
      color: 'bg-red-50 text-red-600',
      trend: 'up' as const,
      trendLabel: 'حتى اليوم',
    },
    {
      label: 'إجمالي التحصيلات',
      value: formatCurrency(stats.totalReceipts) || '0.00',
      icon: Banknote,
      href: '/receipts',
      color: 'bg-emerald-50 text-emerald-600',
      trend: 'up' as const,
      trendLabel: 'حتى اليوم',
    },
    {
      label: 'الرصيد المستحق',
      value: formatCurrency(stats.totalBalance) || '0.00',
      icon: AlertCircle,
      href: '/reports/balances',
      color: 'bg-amber-50 text-amber-600',
      trend: 'down' as const,
      trendLabel: 'المتبقي للتحصيل',
    },
    {
      label: 'نسبة الإشغال',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      href: '/units',
      color: 'bg-blue-50 text-blue-600',
      trend: 'neutral' as const,
      trendLabel: `${stats.rentedUnitsCount} من ${stats.unitsCount} وحدات`,
    },
  ];

  const occupancyData = [
    { name: 'مؤجرة', value: stats.rentedUnitsCount, fill: '#10b981' },
    { name: 'فارغة', value: stats.emptyUnitsCount, fill: '#f59e0b' },
  ];

  const financialData = [
    { name: 'المستحقات', value: stats.totalDues, fill: '#3b82f6' },
    { name: 'التحصيلات', value: stats.totalReceipts, fill: '#10b981' },
    { name: 'الرصيد المستحق', value: stats.totalBalance, fill: '#ef4444' },
  ];

  const trendData = [
    { name: 'يناير', dues: 4000, receipts: 3500 },
    { name: 'فبراير', dues: 4200, receipts: 3800 },
    { name: 'مارس', dues: 4500, receipts: 4100 },
    { name: 'أبريل', dues: 4300, receipts: 3900 },
    { name: 'مايو', dues: 4800, receipts: 4500 },
    { name: 'يونيو', dues: 5000, receipts: 4700 },
  ];

  const quickActions = [
    { label: 'مستأجر جديد', href: '/tenants/new', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'عقد جديد', href: '/contracts/new', icon: FileSignature, color: 'bg-slate-800 hover:bg-slate-900' },
    { label: 'مستحق جديد', href: '/dues', icon: Wallet, color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'تسجيل دفعة', href: '/receipts', icon: Banknote, color: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-slate-500">نظرة عامة على أداء العمارات والمستأجرين</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-all active:scale-[0.98] ${action.color}`}
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'العمارات', value: stats.buildingsCount, icon: Building2, href: '/buildings', color: 'text-sky-600' },
          { label: 'الوحدات', value: stats.unitsCount, icon: Home, href: '/units', color: 'text-violet-600' },
          { label: 'المستأجرون', value: stats.tenantsCount, icon: Users, href: '/tenants', color: 'text-indigo-600' },
          { label: 'العقود النشطة', value: stats.activeContractsCount, icon: FileText, href: '/contracts', color: 'text-teal-600' },
          { label: 'وحدات فارغة', value: stats.emptyUnitsCount, icon: Home, href: '/units', color: 'text-amber-600' },
          { label: 'مستأجرون عليهم رصيد', value: stats.tenantsWithBalanceCount, icon: AlertCircle, href: '/reports/balances', color: 'text-red-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-all hover:shadow-soft-md hover:border-slate-300"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ${card.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="text-lg font-bold text-slate-900">{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">التدفقات المالية</h2>
            <p className="text-sm text-slate-500">المستحقات مقابل التحصيلات (آخر 6 أشهر)</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="duesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="receiptsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Area type="monotone" dataKey="dues" stroke="#3b82f6" strokeWidth={2} fill="url(#duesGradient)" name="المستحقات" />
              <Area type="monotone" dataKey="receipts" stroke="#10b981" strokeWidth={2} fill="url(#receiptsGradient)" name="التحصيلات" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">حالة الوحدات</h2>
            <p className="text-sm text-slate-500">نسبة الوحدات المؤجرة والفارغة</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6">
            {occupancyData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-sm text-slate-600">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">الملخص المالي</h2>
          <p className="text-sm text-slate-500">إجمالي المستحقات والتحصيلات والرصيد المستحق</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={financialData} barSize={80}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {financialData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
