import { useMemo } from 'react';
import {
  Bell, AlertTriangle, AlertCircle, Info, Check, Clock,
  FileWarning, CalendarClock, FileText, ShieldAlert, RefreshCw, CheckCheck,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from '@/lib/router';
import { Card, PageHeader, Badge, Button, EmptyState, formatDateTime } from '@/components/ui';
import { SEVERITY_COLORS, SEVERITY_DOT } from '@/lib/constants';
import type { AlertType, AlertSeverity } from '@/types';

const ALERT_ICONS: Record<AlertType, typeof Bell> = {
  missing_document: FileWarning,
  deadline_approaching: CalendarClock,
  overdue: AlertCircle,
  evc_scheduled: CalendarClock,
  status_change: FileText,
  compliance_breach: ShieldAlert,
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Info', warning: 'Warning', critical: 'Critical',
};

export function AlertsPage() {
  const { alerts, currentUser, markAlertRead, markAllAlertsRead, regenerateAlerts } = useStore();
  const { navigate } = useRouter();
  const role = currentUser?.role ?? 'officer';

  const scoped = useMemo(() => {
    return alerts.filter(a => a.forRole === 'all' || a.forRole === role)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, role]);

  const unread = scoped.filter(a => !a.read);
  const counts = useMemo(() => ({
    critical: scoped.filter(a => a.severity === 'critical' && !a.read).length,
    warning: scoped.filter(a => a.severity === 'warning' && !a.read).length,
    info: scoped.filter(a => a.severity === 'info' && !a.read).length,
  }), [scoped]);

  return (
    <div>
      <PageHeader
        title="Alerts & Notifications"
        subtitle={`${unread.length} unread alert${unread.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={regenerateAlerts}><RefreshCw size={14} /> Refresh</Button>
            {unread.length > 0 && <Button size="sm" onClick={markAllAlertsRead}><CheckCheck size={14} /> Mark all read</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Critical', value: counts.critical, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Warning', value: counts.warning, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Info', value: counts.info, icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`inline-flex p-1.5 rounded-lg ${s.bg}`}><s.icon size={14} className={s.color} /></div>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        {scoped.length === 0 ? (
          <EmptyState title="No alerts" message="You're all caught up. New alerts will appear here." icon={<Bell size={48} />} />
        ) : (
          <div className="divide-y divide-slate-100">
            {scoped.slice(0, 50).map(a => {
              const Icon = ALERT_ICONS[a.type];
              return (
                <div
                  key={a.id}
                  onClick={() => { markAlertRead(a.id); if (a.applicationId) navigate('applications', a.applicationId); }}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition ${!a.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                    a.severity === 'critical' ? 'bg-rose-100 text-rose-600' :
                    a.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm ${!a.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{a.title}</p>
                      {!a.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500">{a.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={SEVERITY_COLORS[a.severity]}>{SEVERITY_LABELS[a.severity]}</Badge>
                      {a.referenceNo && <span className="text-xs text-slate-400">{a.referenceNo}</span>}
                      <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                  {!a.read && <button onClick={(e) => { e.stopPropagation(); markAlertRead(a.id); }} className="text-slate-300 hover:text-slate-500"><Check size={16} /></button>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
