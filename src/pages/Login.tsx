import { useState } from 'react';
import { Building2, ShieldCheck, FileCheck2, Users, ArrowRight, Lock, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from '@/lib/router';
import { ROLE_LABELS } from '@/lib/constants';
import type { Role } from '@/types';

const ROLE_DESC: Record<Role, { desc: string; icon: typeof Building2 }> = {
  institution: { desc: 'Submit and track applications, upload documents', icon: Building2 },
  officer: { desc: 'Review applications, schedule EVC, make decisions', icon: ShieldCheck },
  evc: { desc: 'Conduct visits, submit committee reports', icon: FileCheck2 },
  admin: { desc: 'Full system access, configure workflow and settings', icon: Users },
};

const ROLE_ACCENT: Record<Role, string> = {
  institution: 'from-blue-500 to-blue-700',
  officer: 'from-teal-500 to-teal-700',
  evc: 'from-amber-500 to-amber-700',
  admin: 'from-rose-500 to-rose-700',
};

export function LoginPage() {
  const { users, login } = useStore();
  const { navigate } = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSelect = (role: Role) => {
    setSelected(role);
    const u = users.find(u => u.role === role);
    if (u) setEmail(u.email);
    setPassword('demo1234');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const u = users.find(u => u.role === selected);
    if (u) {
      login(u.id);
      navigate('dashboard');
    }
  };

  const handleDemo = (role: Role) => {
    const u = users.find(u => u.role === role);
    if (u) {
      login(u.id);
      navigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left brand panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#0a1e3c] via-[#102a5c] to-[#1e3a8a] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 shadow-lg">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">AICTE SmartFlow</h1>
              <p className="text-xs text-blue-300">Approval Workflow & Compliance System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Integrated Approval Workflow Automation
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed mb-8">
              A unified platform for AICTE approval workflows, compliance monitoring,
              Expert Visiting Committee scheduling, and real-time alert management.
            </p>

            <div className="space-y-3">
              {[
                { icon: FileCheck2, text: 'Multi-stage approval workflow with EVC visits' },
                { icon: ShieldCheck, text: 'Automated compliance monitoring & deadline tracking' },
                { icon: Users, text: 'Role-based dashboards for all stakeholders' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                    <f.icon size={16} />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-300 mt-8">
          <p>Demo system for SIH 2026 — Problem Statement SIH26262</p>
          <p className="mt-1">Not affiliated with or endorsed by official AICTE.</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">Select a role to access the demo dashboard</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.keys(ROLE_DESC) as Role[]).map(role => {
              const Icon = ROLE_DESC[role].icon;
              const active = selected === role;
              return (
                <button
                  key={role}
                  onClick={() => handleSelect(role)}
                  className={`text-left p-4 rounded-xl border-2 transition group ${
                    active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${ROLE_ACCENT[role]} text-white mb-2 shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5">{ROLE_DESC[role].desc}</p>
                </button>
              );
            })}
          </div>

          {selected && (
            <form onSubmit={handleLogin} className="space-y-4 animate-[fadeIn_0.2s_ease-in]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white py-2.5 text-sm font-semibold shadow-md transition"
              >
                Sign in as {ROLE_LABELS[selected]} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center mb-3">Quick demo access — no password needed</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_DESC) as Role[]).map(role => (
                <button
                  key={role}
                  onClick={() => handleDemo(role)}
                  className="rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-2 text-xs font-medium text-slate-600 transition"
                >
                  Try {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
