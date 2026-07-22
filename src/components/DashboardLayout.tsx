'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Layers,
  Home,
  Users,
  FileText,
  Receipt,
  Banknote,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  BellRing,
  Calendar,
  FileWarning,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { cn, setCurrency } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: BarChart3 },
  { href: '/buildings', label: 'العقارات', icon: Building2 },
  { href: '/tenants', label: 'المستأجرون', icon: Users },
  { href: '/contracts', label: 'العقود', icon: FileText },
  { href: '/dues', label: 'الالتزامات', icon: Receipt },
  { href: '/receipts', label: 'سندات القبض', icon: Banknote },
  // { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/buildings': 'العقارات',
  '/tenants': 'المستأجرون',
  '/contracts': 'العقود',
  '/dues': 'الالتزامات',
  '/receipts': 'سندات القبض',
  '/evictions': 'الإخلاء',
  // '/reports': 'التقارير',
  '/settings': 'الإعدادات',
};

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    let label = breadcrumbMap[path];
    if (!label) {
      if (segment === 'new') label = 'جديد';
      else if (segment === 'edit') label = 'تعديل';
      else if (segment === 'preview') label = 'معاينة';
      else if (segment === 'evict') label = 'إخلاء';
      else if (segment === 'renew') label = 'تجديد';
      else if (isUUID(segment)) label = 'تفاصيل';
      else label = segment;
    }
    breadcrumbs.push({ href: path, label });
  }
  return breadcrumbs;
}

export function DashboardLayout({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoadingNotifications(true);
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNotificationsCount(data.count || 0);
      } catch {
        setNotifications([]);
        setNotificationsCount(0);
      } finally {
        setLoadingNotifications(false);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLogo = () => {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          const logoS = data.settings?.find((s: any) => s.settingKey === 'company_logo');
          const logo = logoS?.settingValue?.value ?? logoS?.settingValue ?? '';
          setCompanyLogo(logo);
          const nameS = data.settings?.find((s: any) => s.settingKey === 'company_name');
          const name = nameS?.settingValue?.value ?? nameS?.settingValue ?? '';
          setCompanyName(name);
          const currencyS = data.settings?.find((s: any) => s.settingKey === 'currency');
          const currency = currencyS?.settingValue?.value ?? currencyS?.settingValue ?? 'ILS';
          setCurrency(currency);
        })
        .catch(() => {});
    };
    fetchLogo();
    const onSaved = () => fetchLogo();
    window.addEventListener('settings-saved', onSaved);
    return () => window.removeEventListener('settings-saved', onSaved);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const breadcrumbs = getBreadcrumbs(pathname);
  const currentLabel = navItems.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || '';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col border-l border-slate-200 bg-white transition-all duration-300 ease-smooth lg:static lg:h-screen lg:shrink-0 lg:overflow-y-auto print:hidden',
          collapsed ? 'lg:w-20' : 'lg:w-64',
          sidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:translate-x-0',
          collapsed ? 'w-64' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" className={cn('flex items-center gap-2', collapsed && 'lg:hidden')}>
            {companyLogo ? (
              <img src={companyLogo} alt="شعار المؤسسة" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-lg font-bold text-slate-900">{companyName || 'نظام الإيجارات'}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-slate-500" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'sidebar-item group',
                  isActive && 'sidebar-item-active',
                  collapsed && 'lg:justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
                <span className={cn('transition-opacity', collapsed && 'lg:hidden')}>{item.label}</span>
                {isActive && !collapsed && <div className="mr-auto lg:hidden h-1.5 w-1.5 rounded-full bg-blue-600" />}
                {collapsed && (
                  <div className="absolute right-full mr-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 lg:block whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className={cn('mb-3 flex items-center gap-3 px-3', collapsed && 'lg:hidden')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <UserCircle className="h-5 w-5 text-slate-500" />
            </div>
            <div className="overflow-hidden">
              <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50',
              collapsed && 'lg:justify-center'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn('transition-opacity', collapsed && 'lg:hidden')}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md lg:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1 text-sm text-slate-500">
              {breadcrumbs.length > 1 ? (
                breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {i > 0 && <ChevronLeft className="h-3.5 w-3.5 text-slate-300" />}
                    <Link
                      href={crumb.href}
                      className="hover:text-slate-900 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  </span>
                ))
              ) : (
                <span className="font-semibold text-slate-900">{currentLabel}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((o) => !o)}
                className="relative flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">الإشعارات</h3>
                    {notificationsCount > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        {notificationsCount}
                      </span>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                        جاري التحميل...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400">
                        <BellRing className="h-8 w-8" />
                        <p className="text-sm">لا توجد إشعارات</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link}
                            onClick={() => setNotificationsOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              n.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            )}>
                              {n.type === 'upcoming_due' ? (
                                <Calendar className="h-4 w-4" />
                              ) : (
                                <FileWarning className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={cn('flex-1 p-4 lg:p-6', collapsed && 'lg:pr-6')}>{children}</main>
      </div>
    </div>
  );
}
