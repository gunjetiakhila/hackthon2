import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, FileText, FolderCheck, ShieldCheck, CalendarClock,
  Bell, BarChart3, History, Settings, LogOut, Menu, X, ChevronDown, Search,
  Building2, ShieldAlert,
} from 'lucide-react';
import { useRouter, type PageKey } from '@/lib/router';
import { useStore } from '@/lib/store';
import { ROLE_LABELS } from '@/lib/constants';
import type { Role } from '@/types';

const NAV: { key: PageKey; label: string; icon: ReactNode; roles?: Role[] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'applications', label: 'Applications', icon: <FileText size={20} /> },
  { key: 'documents', label: 'Documents', icon: <FolderCheck size={20} /> },
  { key: 'compliance', label: 'Compliance', icon: <ShieldCheck size={20} /> },
  { key: 'evc', label: 'EVC Scheduling', icon: <CalendarClock size={20} /> },
  { key: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
  { key: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { key: 'audit', label: 'Audit Trail', icon: <History size={20} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={20} />, roles: ['admin', 'officer'] },
];

const ROLE_ACCENT: Record<Role, string> = {
  institution: 'bg-blue-500',
  officer: 'bg-teal-500',
  evc: 'bg-amber-500',
  admin: 'bg-rose-500',
};

export function Layout({ children }: { children: ReactNode }) {
  const { page, navigate } = useRouter();
  const { currentUser, logout, alerts, institutions } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  if (!currentUser) {
    navigate('login');
    return null;
  }

  const navItems = NAV.filter(n => !n.roles || n.roles.includes(currentUser.role));
  const unread = alerts.filter(a => !a.read && (a.forRole === 'all' || a.forRole === currentUser.role)).length;
  const inst = institutions.find(i => i.id === currentUser.institutionId);

  const handleNav = (key: PageKey) => {
    navigate(key);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0a1e3c] text-slate-300 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm shadow-lg">
            A
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">AICTE SmartFlow</p>
            <p className="text-[10px] text-blue-300 leading-tight">SIH 2026 · SIH26262</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                  active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'alerts' && unread > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${ROLE_ACCENT[currentUser.role]}`}>
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-blue-300 truncate">{ROLE_LABELS[currentUser.role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-600">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search applications, institutions..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    navigate('applications');
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          <button onClick={() => navigate('alerts')} className="relative p-2 rounded-lg hover:bg-slate-100 transition">
            <Bell size={20} className="text-slate-600" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread}</span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-lg hover:bg-slate-100 px-2 py-1.5 transition">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${ROLE_ACCENT[currentUser.role]}`}>
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{inst?.name || ROLE_LABELS[currentUser.role]}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-xl py-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">{currentUser.email}</p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">{ROLE_LABELS[currentUser.role]}</p>
                  </div>
                  <button onClick={() => { navigate('settings'); setUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <Settings size={16} /> Settings
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>

        <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <Building2 size={12} /> AICTE SmartFlow — Demo system for SIH 2026 (SIH26262). Not affiliated with official AICTE.
            <ShieldAlert size={12} className="ml-2" />
          </div>
        </footer>
      </div>
    </div>
  );
}
