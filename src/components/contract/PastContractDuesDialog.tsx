'use client';

import { useState } from 'react';
import { AlertTriangle, FileText, X } from 'lucide-react';

interface PastContractDuesDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (generateDues: boolean) => void;
  onCancel: () => void;
}

export function PastContractDuesDialog({ isOpen, isLoading, onConfirm, onCancel }: PastContractDuesDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div className="absolute inset-0 bg-slate-900/50" onClick={() => !isLoading && onCancel()} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">عقد بتاريخ سابق</h3>
            <p className="text-sm text-slate-500">تم إدخال عقد انتهت مدته قبل تاريخ اليوم.</p>
          </div>
        </div>

        <p className="mb-4 text-sm font-medium text-slate-700">اختر طريقة التعامل مع المستحقات:</p>

        <div className="space-y-3">
          <button
            onClick={() => onConfirm(true)}
            disabled={isLoading}
            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-right transition hover:bg-slate-100 hover:border-slate-300 disabled:opacity-60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">إنشاء جميع المستحقات</p>
              <p className="text-xs text-slate-500">إنشاء جميع المستحقات المستحقة خلال فترة العقد، وتكون حالتها مستحقة.</p>
            </div>
          </button>

          <button
            onClick={() => onConfirm(false)}
            disabled={isLoading}
            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-right transition hover:bg-slate-100 hover:border-slate-300 disabled:opacity-60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
              <X className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">عدم إنشاء المستحقات</p>
              <p className="text-xs text-slate-500">عدم إنشاء أي التزامات أو مطالبات مالية، ويعتبر العقد للأرشفة فقط.</p>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          disabled={isLoading}
          className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isLoading ? 'جاري المعالجة...' : 'إلغاء'}
        </button>
      </div>
    </div>
  );
}
