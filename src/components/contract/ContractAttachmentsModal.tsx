'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ImagePlus, Trash2, Loader2, XCircle, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState, EmptyStateMessage } from '@/components/ui/StatusMessage';

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileData: string;
  createdAt: string;
}

interface Props {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractAttachmentsModal({ contractId, isOpen, onClose }: Props) {
  const { confirm } = useDialog();
  const toast = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Attachment | null>(null);

  const load = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/attachments`);
      const data = await res.json();
      setAttachments(data.attachments || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [contractId, isOpen]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const items: { fileName: string; fileType: string; fileData: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      items.push({ fileName: file.name, fileType: file.type, fileData: base64 });
    }

    if (items.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments: items }),
      });
      if (res.ok) load();
      else toast.error('حدث خطأ أثناء رفع الصور');
    } catch {
      toast.error('حدث خطأ أثناء رفع الصور');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'حذف الصورة',
      description: 'هل أنت متأكد من حذف هذه الصورة المرفقة؟',
      variant: 'warning',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/contracts/${contractId}/attachments/${id}`, { method: 'DELETE' });
      if (res.ok) load();
      else toast.error('حدث خطأ أثناء حذف الصورة');
    } catch {
      toast.error('حدث خطأ أثناء حذف الصورة');
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">صور العقد</h3>
          <button onClick={onClose} className="btn-ghost text-slate-500">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className={cn('btn-secondary cursor-pointer', uploading && 'opacity-60 pointer-events-none')}>
              <ImagePlus className="h-4 w-4" />
              <span>{uploading ? 'جاري الرفع...' : 'إضافة صور'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
            </label>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>

          {loading ? (
            <LoadingState className="py-12" message="جاري تحميل الصور..." />
          ) : attachments.length === 0 ? (
            <EmptyStateMessage className="py-12" title="لا توجد صور مرفقة" description="لم يتم إرفاق أي صور بهذا العقد بعد." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((a) => (
                <div key={a.id} className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <img src={a.fileData} alt={a.fileName} className="h-40 w-full object-cover" />
                  <button
                    onClick={() => setPreview(a)}
                    className="absolute top-2 left-18 p-1.5 rounded-md bg-white/90 text-slate-700 hover:bg-slate-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="معاينة"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={a.fileData}
                    download={a.fileName}
                    className="absolute top-2 left-10 p-1.5 rounded-md bg-white/90 text-slate-700 hover:bg-slate-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="تنزيل"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="absolute top-2 left-2 p-1.5 rounded-md bg-white/90 text-red-600 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف"
                  >
                    {deletingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="px-2 py-1 text-xs text-slate-500 truncate" title={a.fileName}>
                    {a.fileName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={preview.fileData}
              alt={preview.fileName}
              className="max-h-[80vh] w-auto rounded-lg shadow-xl"
              onClick={(e: React.MouseEvent<HTMLImageElement>) => e.stopPropagation()}
            />
            <p className="mt-3 text-sm text-white/80">{preview.fileName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
