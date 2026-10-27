import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Download, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Button, downloadCSV } from '@/components/ui';
import { STATUS_LABELS } from '@/lib/constants';
import type { ApplicationStatus } from '@/types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: '#64748b', under_scrutiny: '#f59e0b', evc_scheduled: '#6366f1',
  under_review: '#a855f7', approved: '#10b981', rejected: '#f43f5e', withdrawn: '#9ca3af',
};

export function ReportsPage() {
  const { applications, institutions, documents, compliance, evcVisits, currentUser } = useStore();
  const [period, setPeriod] = useState<'6m' | '12m' | 'all'>('6m');

  const scoped = useMemo(() => {
    if (currentUser?.role === 'institution' && currentUser.institutionId) {
      return applications.filter(a => a.institutionId === currentUser.institutionId);
    }
    return applications;
  }, [applications, currentUser]);

  const filtered = useMemo(() => {
    if (period === 'all') return scoped;
    const months = period === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return scoped.filter(a => new Date(a.submittedAt) >= cutoff);
  }, [scoped, period]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<ApplicationStatus, number>();
    filtered.forEach(a => counts.set(a.status, (counts.get(a.status) || 0) + 1));
    return Array.from(counts.entries()).map(([s, c]) => ({ label: STATUS_LABELS[s], value: c, status: s }));
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const months: { month: string; submitted: number; approved: number; rejected: number }[] = [];
    const now = new Date();
    const span = period === '6m' ? 6 : 12;
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toLocaleString('en-IN', { month: 'short' });
      const inMonth = filtered.filter(a => {
        const ad = new Date(a.submittedAt);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      });
      months.push({
        month: m,
        submitted: inMonth.length,
        approved: inMonth.filter(a => a.status === 'approved').length,
        rejected: inMonth.filter(a => a.status === 'rejected').length,
      });
    }
    return months;
  }, [filtered, period]);

  const officerWorkload = useMemo(() => {
    const counts = new Map<string, { total: number; pending: number; approved: number }>();
    filtered.forEach(a => {
      const o = a.assignedOfficer;
      const cur = counts.get(o) || { total: 0, pending: 0, approved: 0 };
      cur.total++;
      if (!['approved', 'rejected', 'withdrawn'].includes(a.status)) cur.pending++;
      if (a.status === 'approved') cur.approved++;
      counts.set(o, cur);
    });
    return Array.from(counts.entries()).map(([officer, v]) => ({ officer, ...v }));
  }, [filtered]);

  const institutionTypeDist = useMemo(() => {
    const counts = new Map<string, number>();
    institutions.forEach(i => counts.set(i.type, (counts.get(i.type) || 0) + 1));
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [institutions]);

  const avgProcessingDays = useMemo(() => {
    const decided = filtered.filter(a => a.decisionDate);
    if (!decided.length) return 0;
    const total = decided.reduce((sum, a) => sum + (new Date(a.decisionDate!).getTime() - new Date(a.submittedAt).getTime()) / 86400000, 0);
    return Math.round(total / decided.length);
  }, [filtered]);

  const approvalRate = filtered.length ? Math.round((filtered.filter(a => a.status === 'approved').length / filtered.length) * 100) : 0;

  const handleExport = () => {
    downloadCSV('applications-report.csv', filtered.map(a => ({
      Reference: a.referenceNo, Institution: a.institutionName, Course: a.courseName,
      Status: STATUS_LABELS[a.status], Priority: a.priority, Submitted: a.submittedAt.slice(0, 10),
      Decision: a.decisionDate?.slice(0, 10) || 'Pending', Officer: a.assignedOfficer, Progress: `${a.progress}%`,
    })));
  };

  const summaryCards = [
    { label: 'Total Processed', value: filtered.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approval Rate', value: `${approvalRate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Processing', value: `${avgProcessingDays}d`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Rejected', value: filtered.filter(a => a.status === 'rejected').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Comprehensive insights into application processing and compliance"
        action={
          <div className="flex gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value as '6m' | '12m' | 'all')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} /> Export CSV</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((s, i) => (
          <Card key={i} className="p-5">
            <div className={`inline-flex p-2.5 rounded-lg ${s.bg} mb-2`}><s.icon size={18} className={s.color} /></div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Application Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="submitted" stroke="#1d4ed8" strokeWidth={2.5} name="Submitted" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2.5} name="Approved" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rejected" stroke="#f43f5e" strokeWidth={2.5} name="Rejected" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {statusBreakdown.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.status]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {statusBreakdown.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                  <span className="text-slate-600">{s.label}</span>
                </div>
                <span className="font-semibold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Officer Workload</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={officerWorkload}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="officer" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="approved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={28} />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Institutions by Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={institutionTypeDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#1d4ed8" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5 mt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick Stats Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs">Institutions</p><p className="text-lg font-bold text-slate-800">{institutions.length}</p></div>
          <div><p className="text-slate-400 text-xs">EVC Visits</p><p className="text-lg font-bold text-slate-800">{evcVisits.length}</p></div>
          <div><p className="text-slate-400 text-xs">Documents</p><p className="text-lg font-bold text-slate-800">{documents.length}</p></div>
          <div><p className="text-slate-400 text-xs">Compliance Checks</p><p className="text-lg font-bold text-slate-800">{compliance.length}</p></div>
        </div>
      </Card>
    </div>
  );
}
