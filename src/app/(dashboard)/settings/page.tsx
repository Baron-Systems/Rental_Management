'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, User, FileText, Receipt, Mail,
  Save, LogOut, Lock, Settings as SettingsIcon, Repeat, Upload, X, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialog } from '@/components/ui/DialogProvider';
import { Alert } from '@/components/ui/Alert';
import { EmptyStateMessage } from '@/components/ui/StatusMessage';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingState } from '@/components/ui/StatusMessage';

interface DueType {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

interface PaymentFrequency {
  value: string;
  label: string;
  months: number;
}

interface SettingsData {
  company_name: string;
  company_logo: string;
  currency: string;
  landlord_name: string;
  landlord_id: string;
  landlord_phone: string;
  landlord_address: string;
  default_contract_duration: number;
  default_payment_frequency: string;
  default_payment_method: string;
  contract_alert_days: number;
  auto_approve_contract: boolean;
  contract_prefix: string;
  contract_counter: number;
  receipt_prefix: string;
  receipt_counter: number;
  due_prefix: string;
  due_counter: number;
  print_header: string;
  print_footer: string;
  print_logo: boolean;
  show_due_schedule: boolean;
  default_contract_terms: string;
}

const defaultSettings: SettingsData = {
  company_name: '', company_logo: '', currency: 'ILS',
  landlord_name: '', landlord_id: '', landlord_phone: '', landlord_address: '',
  default_contract_duration: 12, default_payment_frequency: 'monthly', default_payment_method: 'bank',
  contract_alert_days: 30, auto_approve_contract: false,
  contract_prefix: 'CNT', contract_counter: 1, receipt_prefix: 'RCPT', receipt_counter: 1,
  due_prefix: 'DUE', due_counter: 1,
  print_header: '', print_footer: '', print_logo: true, show_due_schedule: true,
  default_contract_terms: '',
};

const currencies = [
  { value: 'ILS', label: 'شيكل (₪)' }, { value: 'USD', label: 'دولار ($)' },
  { value: 'EUR', label: 'يورو (€)' }, { value: 'JOD', label: 'دينار أردني (JD)' },
];
const defaultPaymentFrequencies: PaymentFrequency[] = [
  { value: 'monthly', label: 'شهري', months: 1 },
  { value: 'bimonthly', label: 'كل شهرين', months: 2 },
  { value: 'quarterly', label: 'ربع سنوي', months: 3 },
  { value: 'semiannual', label: 'نصف سنوي', months: 6 },
  { value: 'annual', label: 'سنوي', months: 12 },
  { value: 'one_time', label: 'مرة واحدة', months: 0 },
];
const paymentMethods = [
  { value: 'cash', label: 'نقدي' }, { value: 'bank', label: 'تحويل بنكي' }, { value: 'check', label: 'شيك' },
];

const sectionTabs = [
  { id: 'general', label: 'الإعدادات العامة', icon: SettingsIcon },
  { id: 'landlord', label: 'بيانات المؤجر', icon: User },
  { id: 'contracts', label: 'إعدادات العقود', icon: FileText },
  { id: 'payment_frequencies', label: 'دوريات الدفع', icon: Repeat },
  { id: 'due_types', label: 'أنواع الالتزامات', icon: Receipt },
  { id: 'account', label: 'الحساب', icon: Lock },
];

export default function SettingsPage() {
  const router = useRouter();
  const { confirm } = useDialog();
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [paymentFrequencies, setPaymentFrequencies] = useState<PaymentFrequency[]>(defaultPaymentFrequencies);
  const [newFreq, setNewFreq] = useState<PaymentFrequency>({ value: '', label: '', months: 1 });
  const [newTypeName, setNewTypeName] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changePassword, setChangePassword] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changeEmail, setChangeEmail] = useState({ newEmail: '', password: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() { await Promise.all([loadSettings(), loadDueTypes(), loadPaymentFrequencies()]); setLoading(false); }

  async function loadPaymentFrequencies() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const raw = data.settings?.find((s: any) => s.settingKey === 'payment_frequencies')?.settingValue;
    const arr = Array.isArray(raw) ? raw : (raw?.value ? raw.value : null);
    if (arr && Array.isArray(arr) && arr.length > 0) {
      setPaymentFrequencies(arr);
    }
  }

  async function loadSettings() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const s: Partial<SettingsData> = {};
    for (const setting of data.settings || []) {
      const v = setting.settingValue?.value ?? setting.settingValue;
      s[setting.settingKey as keyof SettingsData] = v as any;
    }
    setSettings((prev) => ({ ...prev, ...s }));
  }

  async function loadDueTypes() {
    const res = await fetch('/api/settings/due-types');
    const data = await res.json();
    setDueTypes(data.dueTypes || []);
  }

  const updateSetting = useCallback((key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function saveSettings() {
    setSaving(true);
    const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
    payload.push({ key: 'payment_frequencies', value: paymentFrequencies });
    const res = await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: payload }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); window.dispatchEvent(new CustomEvent('settings-saved')); }
  }

  function addPaymentFrequency() {
    if (!newFreq.label.trim() || newFreq.months < 0) return;
    const generatedValue = newFreq.label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\u0600-\u06FF]/g, '') || `freq_${Date.now()}`;
    setPaymentFrequencies((prev) => [...prev, { value: generatedValue, label: newFreq.label, months: newFreq.months }]);
    setNewFreq({ value: '', label: '', months: 1 });
  }

  function updatePaymentFrequency(index: number, field: keyof PaymentFrequency, value: string | number) {
    setPaymentFrequencies((prev) => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  }

  async function deletePaymentFrequency(index: number) {
    const confirmed = await confirm({
      title: 'حذف دورية الدفع',
      description: 'هل أنت متأكد من حذف هذه الدورية؟',
      variant: 'warning',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    setPaymentFrequencies((prev) => prev.filter((_, i) => i !== index));
  }

  async function addDueType() {
    if (!newTypeName.trim()) return;
    const res = await fetch('/api/settings/due-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTypeName }),
    });
    if (res.ok) { setNewTypeName(''); loadDueTypes(); }
  }

  async function toggleDueType(id: string, isActive: boolean) {
    await fetch(`/api/settings/due-types/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }),
    });
    loadDueTypes();
  }

  async function deleteDueType(id: string) {
    const confirmed = await confirm({
      title: 'حذف نوع الالتزام',
      description: 'هل أنت متأكد من حذف هذا النوع؟',
      variant: 'warning',
      confirmLabel: 'حذف',
    });
    if (!confirmed) return;
    const res = await fetch(`/api/settings/due-types/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'فشل حذف نوع الالتزام');
      return;
    }
    loadDueTypes();
  }

  async function handleChangePassword() {
    setPasswordError(''); setPasswordSuccess('');
    if (!changePassword.current || !changePassword.new || !changePassword.confirm) { setPasswordError('جميع الحقول مطلوبة'); return; }
    if (changePassword.new !== changePassword.confirm) { setPasswordError('كلمات المرور غير متطابقة'); return; }
    if (changePassword.new.length < 6) { setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: changePassword.current, newPassword: changePassword.new }),
    });
    if (res.ok) { setPasswordSuccess('تم تغيير كلمة المرور بنجاح'); setChangePassword({ current: '', new: '', confirm: '' }); }
    else { const data = await res.json().catch(() => ({})); setPasswordError(data.error || 'فشل تغيير كلمة المرور'); }
  }

  async function handleChangeEmail() {
    setEmailError(''); setEmailSuccess('');
    if (!changeEmail.newEmail || !changeEmail.password) { setEmailError('جميع الحقول مطلوبة'); return; }
    const res = await fetch('/api/auth/change-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail: changeEmail.newEmail, password: changeEmail.password }),
    });
    if (res.ok) { setEmailSuccess('تم تغيير البريد الإلكتروني بنجاح'); setChangeEmail({ newEmail: '', password: '' }); }
    else { const data = await res.json().catch(() => ({})); setEmailError(data.error || 'فشل تغيير البريد الإلكتروني'); }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) return <LoadingState message="جاري تحميل الإعدادات..." />;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500">إدارة إعدادات النظام والمؤسسة</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden flex flex-row lg:flex-col overflow-x-auto">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id ? "bg-blue-50 text-blue-700 border-b-2 lg:border-b-0 lg:border-r-2 border-blue-600" : "text-slate-600 hover:bg-slate-50")}>
                  <Icon className="h-4 w-4 shrink-0" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab !== 'account' && activeTab !== 'due_types' && (
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="text-sm text-slate-600">
                {saved ? <span className="text-emerald-600 font-medium">تم الحفظ بنجاح!</span> : 'قم بإجراء التعديلات ثم اضغط حفظ'}
              </div>
              <button onClick={saveSettings} disabled={saving} className="btn-primary inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><Building2 className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">الإعدادات العامة</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="اسم المؤسسة" value={settings.company_name} onChange={(v: string) => updateSetting('company_name', v)} placeholder="اسم المؤسسة أو الشركة" />
                  <SelectField label="العملة الافتراضية" value={settings.currency} onChange={(v: string) => updateSetting('currency', v)} options={currencies} />
                  <div className="md:col-span-2">
                    <ImageUploadField label="شعار المؤسسة" value={settings.company_logo} onChange={(v: string) => updateSetting('company_logo', v)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'landlord' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><User className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">بيانات المؤجر</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="اسم المؤجر" value={settings.landlord_name} onChange={(v: string) => updateSetting('landlord_name', v)} placeholder="الاسم الكامل للمؤجر" required />
                  <Field label="رقم الهوية / السجل التجاري" value={settings.landlord_id} onChange={(v: string) => updateSetting('landlord_id', v)} placeholder="رقم الهوية أو السجل التجاري" required />
                  <Field label="هاتف المؤجر" value={settings.landlord_phone} onChange={(v: string) => updateSetting('landlord_phone', v)} placeholder="رقم الهاتف" />
                  <Field label="عنوان المؤجر" value={settings.landlord_address} onChange={(v: string) => updateSetting('landlord_address', v)} placeholder="العنوان الكامل" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><FileText className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">إعدادات العقود</h3></div>
                <div className="grid grid-cols-1 gap-4">
                  <NumberField label="عدد الأيام للتنبيه قبل انتهاء العقد" value={settings.contract_alert_days} onChange={(v: number) => updateSetting('contract_alert_days', v)} placeholder="30" />
                  <TextAreaField label="الشروط والأحكام الافتراضية للعقد" value={settings.default_contract_terms} onChange={(v: string) => updateSetting('default_contract_terms', v)} placeholder="اكتب هنا الشروط والأحكام الافتراضية التي ستظهر في العقود..." rows={8} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment_frequencies' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><Repeat className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">دوريات الدفع</h3></div>
                <p className="text-sm text-slate-500 mb-4">حدد دوريات الدفع المتاحة مع عدد الأشهر لكل دورية. سيتم استخدام هذه القيم في حساب مواعيد الالتزام ونهاية العقد.</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  <input value={newFreq.label} onChange={(e) => setNewFreq((p) => ({ ...p, label: e.target.value }))} placeholder="الاسم (مثال: ربع سنوي)" className="input-premium flex-1 min-w-[150px]" />
                  <input type="number" min="0" value={newFreq.months} onChange={(e) => setNewFreq((p) => ({ ...p, months: Number(e.target.value) }))} placeholder="الأشهر" className="input-premium w-24" />
                  <button onClick={addPaymentFrequency} className="btn-primary">إضافة</button>
                </div>
                <div className="space-y-2">
                  {paymentFrequencies.map((f, idx) => (
                    <div key={f.value + idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <input value={f.label} onChange={(e) => updatePaymentFrequency(idx, 'label', e.target.value)} className="input-premium flex-1 min-w-[150px] text-sm w-full sm:w-auto" placeholder="الاسم" />
                      <input type="number" min="0" value={f.months} onChange={(e) => updatePaymentFrequency(idx, 'months', Number(e.target.value))} className="input-premium w-full sm:w-20 text-sm" placeholder="أشهر" />
                      <button onClick={() => deletePaymentFrequency(idx)} className="text-xs px-2 py-1 rounded-md font-medium text-red-600 hover:bg-red-50">حذف</button>
                    </div>
                  ))}
                </div>
                {paymentFrequencies.length === 0 && <EmptyStateMessage className="py-8" title="لا توجد دوريات محددة" description="لم يتم إضافة أي دوريات دفع." />}
              </div>
            </div>
          )}

          {activeTab === 'due_types' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><Receipt className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">أنواع الالتزامات</h3></div>
                <div className="mb-4 flex gap-2">
                  <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="اسم نوع الالتزام الجديد" className="input-premium flex-1" onKeyDown={(e) => e.key === 'Enter' && addDueType()} />
                  <button onClick={addDueType} className="btn-primary">إضافة</button>
                </div>
                <div className="space-y-2">
                  {dueTypes.map((dt) => (
                    <div key={dt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{dt.name}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", dt.isSystem ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600')}>{dt.isSystem ? 'نظامي' : 'مخصص'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleDueType(dt.id, dt.isActive)} className={cn("text-xs px-2 py-1 rounded-md font-medium transition-colors", dt.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{dt.isActive ? 'نشط' : 'معطل'}</button>
                        <button onClick={() => deleteDueType(dt.id)} className="flex items-center justify-center h-7 w-7 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="حذف">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {dueTypes.length === 0 && <EmptyStateMessage className="py-8" title="لا توجد أنواع التزامات" description="لم يتم إضافة أي أنواع التزامات." />}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><Mail className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">تغيير البريد الإلكتروني</h3></div>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <Field label="البريد الإلكتروني الجديد" type="email" value={changeEmail.newEmail} onChange={(v: string) => setChangeEmail((p) => ({ ...p, newEmail: v }))} placeholder="example@email.com" />
                  <Field label="كلمة المرور" type="password" value={changeEmail.password} onChange={(v: string) => setChangeEmail((p) => ({ ...p, password: v }))} placeholder="********" />
                  {emailError && <Alert title="تعذر تغيير البريد الإلكتروني">{emailError}</Alert>}
                  {emailSuccess && <Alert variant="success" title="تم بنجاح">{emailSuccess}</Alert>}
                  <button onClick={handleChangeEmail} className="btn-primary">تغيير البريد الإلكتروني</button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4"><Lock className="h-5 w-5 text-blue-600"/><h3 className="text-lg font-semibold text-slate-900">تغيير كلمة المرور</h3></div>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <Field label="كلمة المرور الحالية" type="password" value={changePassword.current} onChange={(v: string) => setChangePassword((p) => ({ ...p, current: v }))} placeholder="********" />
                  <Field label="كلمة المرور الجديدة" type="password" value={changePassword.new} onChange={(v: string) => setChangePassword((p) => ({ ...p, new: v }))} placeholder="********" />
                  <Field label="تأكيد كلمة المرور الجديدة" type="password" value={changePassword.confirm} onChange={(v: string) => setChangePassword((p) => ({ ...p, confirm: v }))} placeholder="********" />
                  {passwordError && <Alert title="تعذر تغيير كلمة المرور">{passwordError}</Alert>}
                  {passwordSuccess && <Alert variant="success" title="تم بنجاح">{passwordSuccess}</Alert>}
                  <button onClick={handleChangePassword} className="btn-primary">تغيير كلمة المرور</button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">تسجيل الخروج من النظام</p>
                    <p className="text-xs text-slate-500">سيتم إعادة توجيهك إلى صفحة تسجيل الدخول</p>
                  </div>
                  <button onClick={handleLogout} className="btn-danger inline-flex items-center gap-2"><LogOut className="h-4 w-4"/> تسجيل الخروج</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Field Components ---- */
function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 mr-1">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-premium w-full" />
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder={placeholder} className="input-premium w-full" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-premium w-full">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-premium w-full resize-y" />
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <button onClick={() => onChange(!value)} className={cn("relative h-6 w-11 rounded-full transition-colors", value ? "bg-blue-600" : "bg-slate-200")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", value ? "right-1" : "left-1")} />
      </button>
    </div>
  );
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange((ev.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {value ? (
        <div className="relative block h-32 w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img src={value} alt="شعار المؤسسة" className="h-full w-full object-contain" />
          <button
            onClick={() => onChange('')}
            className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
          <Upload className="h-4 w-4" />
          <span>اضغط لرفع صورة الشعار</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
