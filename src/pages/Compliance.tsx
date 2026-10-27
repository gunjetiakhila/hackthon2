import { useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock, Search, Download, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Badge, Button, inputClass, formatDate, daysUntil, downloadCSV, EmptyState } from '@/components/ui';
import { COMPLIANCE_LABELS, COMPLIANCE_COLORS } from '@/lib/constants';
import type { ComplianceStatus } from '@/types';

export function CompliancePage() {
  const { compliance, applications, currentUser, updateCompliance } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = compliance;
    if (currentUser?.role === 'institution' && currentUser.institutionId) {
      const appIds = new Set(applications.filter(a => a.institutionId === currentUser.institutionId).map(a => a.id));
      list = list.filter(c => appIds.has(c.applicationId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.referenceNo.toLowerCase().includes(q) || c.institutionName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    return list;
  }, [compliance, applications, currentUser, search, statusFilter]);

  const stats = useMemo(() => ({
    total: filtered.length,
    compliant: filtered.filter(c => c.status === 'compliant').length,
    warning: filtered.filter(c => c.status === 'warning').length,
    nonCompliant: filtered.filter(c => c.status === 'non_compliant').length,
    pending: filtered.filter(c => c.status === 'pending').length,
  }), [filtered]);

  const overdue = filtered.filter(c => daysUntil(c.deadline) < 0 && c.status !== 'compliant').length;

  const canUpdate = currentUser?.role === 'officer' || currentUser?.role === 'admin';

  const handleExport = () => {
    downloadCSV('compliance.csv', filtered.map(c => ({
      Reference: c.referenceNo, Institution: c.institutionName, Category: c.category,
      Requirement: c.requirement, Status: COMPLIANCE_LABELS[c.status], Deadline: c.deadline.slice(0, 10),
      LastChecked: c.lastChecked.slice(0, 10), Responsible: c.responsible,
    })));
  };

  return (
    <div>
      <PageHeader
        title="Compliance Monitoring"
        subtitle="Track regulatory requirements, deadlines, and compliance status"
        action={<Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} /> Export CSV</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Checks', value: stats.total, icon: ShieldCheck, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Compliant', value: stats.compliant, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Warning', value: stats.warning, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Non-Compliant', value: stats.nonCompliant, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}><s.icon size={16} className={s.color} /></div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 mb-4 text-sm text-rose-700">
          <ShieldAlert size={16} /> {overdue} compliance item{overdue !== 1 ? 's' : ''} past deadline — require immediate attention.
        </div>
      )}

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by reference, institution, or category..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ComplianceStatus | 'all')} className={`${inputClass} sm:w-44`}>
            <option value="all">All Statuses</option>
            <option value="compliant">Compliant</option>
            <option value="warning">Warning</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No compliance items" message="No items match your current filters." icon={<ShieldCheck size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Reference</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Institution</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Requirement</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Deadline</th>
                  {canUpdate && <th className="text-left px-4 py-3 font-medium">Update</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map(c => {
                  const isOverdue = daysUntil(c.deadline) < 0 && c.status !== 'compliant';
                  return (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-700">{c.referenceNo}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell truncate max-w-[160px]">{c.institutionName}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{c.category}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell truncate max-w-[200px]">{c.requirement}</td>
                      <td className="px-4 py-3"><Badge className={COMPLIANCE_COLORS[c.status]}>{COMPLIANCE_LABELS[c.status]}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        <span className={isOverdue ? 'text-rose-600 font-medium' : ''}>{formatDate(c.deadline)}</span>
                      </td>
                      {canUpdate && (
                        <td className="px-4 py-3">
                          <select
                            value={c.status}
                            onChange={e => updateCompliance(c.id, e.target.value as ComplianceStatus)}
                            className="text-xs rounded-md border border-slate-200 px-2 py-1 focus:border-blue-400 focus:outline-none bg-white"
                          >
                            <option value="compliant">Compliant</option>
                            <option value="warning">Warning</option>
                            <option value="non_compliant">Non-Compliant</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
