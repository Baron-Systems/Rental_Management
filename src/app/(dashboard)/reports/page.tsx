'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Receipt, Users, Building2, Home, FileCheck } from 'lucide-react';

const reports = [
  { id: 'dues', label: 'تقرير الالتزامات', description: 'عرض جميع الالتزامات مع الفلترة حسب التاريخ والمستأجر', icon: FileText, color: 'bg-blue-50 text-blue-600', href: '/reports/dues' },
  { id: 'receipts', label: 'تقرير الدفعات', description: 'عرض جميع سندات القبض مع التفاصيل المالية', icon: Receipt, color: 'bg-emerald-50 text-emerald-600', href: '/reports/receipts' },
  { id: 'balances', label: 'تقرير أرصدة المستأجرين', description: 'ملخص الأرصدة المالية لكل مستأجر', icon: Users, color: 'bg-amber-50 text-amber-600', href: '/reports/balances' },
  { id: 'buildings-income', label: 'تقرير دخل العمارات', description: 'إحصائيات الدخل والإشغال لكل عمارة', icon: Building2, color: 'bg-violet-50 text-violet-600', href: '/reports/buildings-income' },
  { id: 'vacant-units', label: 'تقرير الوحدات الفارغة', description: 'قائمة الوحدات المتاحة للإيجار', icon: Home, color: 'bg-sky-50 text-sky-600', href: '/reports/vacant-units' },
  { id: 'occupied-units', label: 'تقرير الوحدات المؤجرة', description: 'قائمة الوحدات المؤجرة حالياً', icon: Home, color: 'bg-teal-50 text-teal-600', href: '/reports/occupied-units' },
  { id: 'contracts', label: 'تقرير العقود', description: 'ملخص العقود الإيجارية والتجديدات', icon: FileCheck, color: 'bg-indigo-50 text-indigo-600', href: '/reports/contracts' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">التقارير</h1>
        <p className="mt-1 text-sm text-slate-500">تقارير وتحليلات مفصلة لجميع أجزاء النظام</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.id}
              href={report.href}
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:shadow-soft-md hover:border-slate-300"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${report.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{report.label}</div>
                <div className="mt-1 text-xs text-slate-500 leading-relaxed">{report.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
