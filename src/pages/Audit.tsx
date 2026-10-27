import { useMemo, useState } from 'react';
import {
  History, Search, Download, User, FileText, Settings as SettingsIcon,
  CalendarClock, ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Badge, Button, inputClass, formatDateTime, downloadCSV, EmptyState } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/constants';
import type { Role } from '@/types';

const ACTION_ICONS: Record<string, typeof FileText> = {
  'Application Submitted': FileText,
  'Status Updated': FileText,
  'Workflow Advanced': FileText,
  'Document Uploaded': FileText,
  'EVC Scheduled': CalendarClock,
  'EVC Report Submitted': CalendarClock,
  'Compliance Updated': ShieldCheck,
  'Settings Updated': SettingsIcon,
  'Institution Registered': User,
};

const ACTION_COLORS: Record<string, string> = {
  'Application Submitted': 'bg-blue-100 text-blue-700',
  'Status Updated': 'bg-amber-100 text-amber-700',
  'Workflow Advanced': 'bg-indigo-100 text-indigo-700',
  'Document Uploaded': 'bg-slate-100 text-slate-700',
  'EVC Scheduled': 'bg-indigo-100 text-indigo-700',
  'EVC Report Submitted': 'bg-purple-100 text-purple-700',
  'Compliance Updated': 'bg-teal-100 text-teal-700',
  'Settings Updated': 'bg-rose-100 text-rose-700',
  'Institution Registered': 'bg-emerald-100 text-emerald-700',
};

export function AuditPage() {
  const { audit, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const filtered = useMemo(() => {
    let list = audit;
    if (currentUser?.role === 'institution' && currentUser.institutionId) {
      // Institutions see audit entries for their own entities
      list = list.filter(a => a.actorRole === 'institution' || a.entityId.includes('AIC'));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.entityId.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q)
      );
    }
    if (actionFilter !== 'all') list = list.filter(a => a.action === actionFilter);
    if (roleFilter !== 'all') list = list.filter(a => a.actorRole === roleFilter);
    return list;
  }, [audit, currentUser, search, actionFilter, roleFilter]);

  const actions = useMemo(() => Array.from(new Set(audit.map(a => a.action))), [audit]);

  const handleExport = () => {
    downloadCSV('audit-trail.csv', filtered.map(a => ({
      Timestamp: a.timestamp, Actor: a.actor, Role: ROLE_LABELS[a.actorRole],
      Action: a.action, Entity: a.entity, EntityID: a.entityId, Details: a.details, IP: a.ipAddress,
    })));
  };

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Complete log of all user actions and system events"
        action={<Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} /> Export CSV</Button>}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by actor, action, entity, or details..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={`${inputClass} sm:w-48`}>
            <option value="all">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'all')} className={`${inputClass} sm:w-36`}>
            <option value="all">All Roles</option>
            <option value="institution">Institution</option>
            <option value="officer">Officer</option>
            <option value="evc">EVC</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No audit entries" message="No entries match your current filters." icon={<History size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium">Actor</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Entity</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Details</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map(a => {
                  const Icon = ACTION_ICONS[a.action] || FileText;
                  const colorClass = ACTION_COLORS[a.action] || 'bg-slate-100 text-slate-700';
                  return (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(a.timestamp)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 ${colorClass}`}>
                            <Icon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 truncate">{a.actor}</p>
                            <p className="text-xs text-slate-400">{ROLE_LABELS[a.actorRole]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className="bg-slate-100 text-slate-700 border-slate-200">{a.action}</Badge></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-slate-600 font-medium">{a.entity}</p>
                          <p className="text-xs text-slate-400">{a.entityId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell max-w-xs truncate">{a.details}</td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell text-xs font-mono">{a.ipAddress}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Showing {Math.min(filtered.length, 150)} of {filtered.length} entries · Audit trail retains the last 500 actions
      </p>
    </div>
  );
}
