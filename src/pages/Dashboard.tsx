import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  CalendarClock, ArrowRight, Bell, Users,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from '@/lib/router';
import { Card, PageHeader, Badge, formatDate, daysUntil } from '@/components/ui';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_DOT, ROLE_LABELS,
} from '@/lib/constants';
import type { ApplicationStatus } from '@/types';

const STATUS_CHART_COLORS: Record<ApplicationStatus, string> = {
  submitted: '#64748b',
  under_scrutiny: '#f59e0b',
  evc_scheduled: '#6366f1',
  under_review: '#a855f7',
  approved: '#10b981',
  rejected: '#f43f5e',
  withdrawn: '#9ca3af',
};

export function DashboardPage() {
  const { applications, alerts, institutions, evcVisits, currentUser } = useStore();
  const { navigate } = useRouter();
  const role = currentUser?.role ?? 'officer';

  const scopedApps = useMemo(() => {
    if (role === 'institution' && currentUser?.institutionId) {
      return applications.filter(a => a.institutionId === currentUser.institutionId);
    }
    return applications;
  }, [applications, role, currentUser?.institutionId]);

  const stats = useMemo(() => {
    const total = scopedApps.length;
    const pending = scopedApps.filter(a => !['approved', 'rejected', 'withdrawn'].includes(a.status)).length;
    const approved = scopedApps.filter(a => a.status === 'approved').length;
    const overdue = scopedApps.filter(a => {
      if (['approved', 'rejected', 'withdrawn'].includes(a.status)) return false;
      return daysUntil(a.scrutinyDeadline) < 0 || (a.evcDate && daysUntil(a.evcDate) < 0);
    }).length;
    return { total, pending, approved, overdue };
  }, [scopedApps]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<ApplicationStatus, number>();
    scopedApps.forEach(a => counts.set(a.status, (counts.get(a.status) || 0) + 1));
    return Array.from(counts.entries()).map(([status, count]) => ({ status, label: STATUS_LABELS[status], count }));
  }, [scopedApps]);

  const monthlyTrend = useMemo(() => {
    const months: { month: string; submitted: number; approved: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toLocaleString('en-IN', { month: 'short' });
      const submitted = scopedApps.filter(a => {
        const ad = new Date(a.submittedAt);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }).length;
      const approved = scopedApps.filter(a => {
        if (!a.decisionDate) return false;
        const ad = new Date(a.decisionDate);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear() && a.status === 'approved';
      }).length;
      months.push({ month: m, submitted, approved });
    }
    return months;
  }, [scopedApps]);

  const stateDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    institutions.forEach(i => counts.set(i.state, (counts.get(i.state) || 0) + 1));
    return Array.from(counts.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [institutions]);

  const recentApps = useMemo(() =>
    [...scopedApps].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 5),
    [scopedApps]);

  const upcomingEVC = useMemo(() =>
    evcVisits.filter(v => v.status === 'scheduled' && daysUntil(v.date) >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4),
    [evcVisits]);

  const unreadAlerts = useMemo(() =>
    alerts.filter(a => !a.read && (a.forRole === 'all' || a.forRole === role))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [alerts, role]);

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-100' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${currentUser?.name?.split(' ').slice(-1)[0]}`}
        subtitle={`${ROLE_LABELS[role]} dashboard · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <Card key={i} className={`p-5 ring-1 ${s.ring} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${s.bg}`}>
                <s.icon size={20} className={s.color} />
              </div>
              <TrendingUp size={16} className="text-slate-300" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Application Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="cSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cApp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="submitted" stroke="#1d4ed8" strokeWidth={2} fill="url(#cSub)" name="Submitted" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fill="url(#cApp)" name="Approved" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusBreakdown.map((s, i) => <Cell key={i} fill={STATUS_CHART_COLORS[s.status]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusBreakdown.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_CHART_COLORS[s.status] }} />
                  <span className="text-slate-600">{s.label}</span>
                </div>
                <span className="font-semibold text-slate-800">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent applications */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Recent Applications</h3>
            <button onClick={() => navigate('applications')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-2 py-2 font-medium">Reference</th>
                  <th className="text-left px-2 py-2 font-medium">Course</th>
                  <th className="text-left px-2 py-2 font-medium">Status</th>
                  <th className="text-left px-2 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map(a => (
                  <tr key={a.id} onClick={() => navigate('applications', a.id)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                        <span className="font-medium text-slate-700">{a.referenceNo}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 truncate max-w-[160px]">{a.courseName}</td>
                    <td className="px-2 py-2.5">
                      <Badge className={STATUS_COLORS[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                    </td>
                    <td className="px-2 py-2.5 text-slate-500 text-xs">{formatDate(a.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Upcoming EVC Visits</h3>
              <CalendarClock size={16} className="text-slate-400" />
            </div>
            {upcomingEVC.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No upcoming visits</p>
            ) : (
              <div className="space-y-3">
                {upcomingEVC.map(v => (
                  <div key={v.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-200">
                      <span className="text-[10px] font-medium text-slate-500 uppercase">{new Date(v.date).toLocaleString('en-IN', { month: 'short' })}</span>
                      <span className="text-lg font-bold text-slate-800 leading-none">{new Date(v.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{v.referenceNo}</p>
                      <p className="text-xs text-slate-500 truncate">{v.institutionName}</p>
                      <p className="text-xs text-indigo-600 mt-0.5">In {daysUntil(v.date)} days</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Active Alerts</h3>
              <Bell size={16} className="text-slate-400" />
            </div>
            {unreadAlerts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No active alerts</p>
            ) : (
              <div className="space-y-2.5">
                {unreadAlerts.map(a => (
                  <div key={a.id} onClick={() => navigate('alerts')} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition">
                    <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      a.severity === 'critical' ? 'bg-rose-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{a.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {role === 'officer' || role === 'admin' ? (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Institutions by State</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stateDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#1d4ed8" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ) : null}
    </div>
  );
}
