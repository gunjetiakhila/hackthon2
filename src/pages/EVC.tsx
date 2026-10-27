import { useMemo, useState } from 'react';
import { CalendarClock, Plus, MapPin, Users, CheckCircle2, Calendar as CalIcon, FileText } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Badge, Button, Modal, Field, inputClass, formatDate, daysUntil, EmptyState } from '@/components/ui';
import { EVC_CHAIRS, OFFICERS } from '@/lib/constants';
import type { EVCVisit } from '@/types';

export function EVCPage() {
  const { evcVisits, applications, currentUser, scheduleEVC, completeEVC } = useStore();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReport, setShowReport] = useState<EVCVisit | null>(null);

  const canSchedule = currentUser?.role === 'officer' || currentUser?.role === 'admin';
  const canReport = currentUser?.role === 'evc' || currentUser?.role === 'admin';

  const eligibleApps = useMemo(() =>
    applications.filter(a => a.status === 'under_scrutiny' || a.status === 'under_review').filter(a => {
      if (currentUser?.role === 'institution' && currentUser.institutionId) return a.institutionId === currentUser.institutionId;
      return true;
    }),
    [applications, currentUser]);

  const sorted = useMemo(() =>
    [...evcVisits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [evcVisits]);

  const upcoming = sorted.filter(v => v.status === 'scheduled' && daysUntil(v.date) >= 0);
  const past = sorted.filter(v => v.status === 'completed');

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { day: number; date: string; visits: EVCVisit[] }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ day: 0, date: '', visits: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toISOString();
      const dayVisits = evcVisits.filter(v => {
        const vd = new Date(v.date);
        return vd.getDate() === d && vd.getMonth() === month && vd.getFullYear() === year;
      });
      cells.push({ day: d, date: dateStr, visits: dayVisits });
    }
    return cells;
  }, [evcVisits]);

  return (
    <div>
      <PageHeader
        title="EVC Scheduling"
        subtitle="Expert Visiting Committee — schedule visits and review reports"
        action={
          canSchedule ? (
            <Button size="sm" onClick={() => setShowSchedule(true)}><Plus size={16} /> Schedule EVC</Button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'list' ? 'bg-blue-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>List View</button>
        <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'calendar' ? 'bg-blue-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><CalIcon size={14} className="inline mr-1" /> Calendar</button>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><CalendarClock size={16} /> Upcoming Visits ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <Card className="p-6"><EmptyState title="No upcoming visits" message="Schedule an EVC visit from an eligible application." icon={<CalendarClock size={40} />} /></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(v => (
                  <Card key={v.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">{v.referenceNo}</p>
                        <p className="text-xs text-slate-500">{v.institutionName}</p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Scheduled</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600"><CalendarClock size={14} className="text-slate-400" /> {formatDate(v.date)} at {v.time} <span className="text-indigo-600 font-medium">({daysUntil(v.date)} days)</span></div>
                      <div className="flex items-start gap-2 text-slate-600"><MapPin size={14} className="text-slate-400 mt-0.5" /> {v.venue}</div>
                      <div className="flex items-center gap-2 text-slate-600"><Users size={14} className="text-slate-400" /> Chair: {v.committeeChair}</div>
                    </div>
                    {canReport && (
                      <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setShowReport(v)}>
                        <FileText size={14} /> Submit Report
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><CheckCircle2 size={16} /> Completed Visits ({past.length})</h3>
            {past.length === 0 ? (
              <Card className="p-6"><EmptyState title="No completed visits" message="Completed EVC reports will appear here." icon={<CheckCircle2 size={40} />} /></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(v => (
                  <Card key={v.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">{v.referenceNo}</p>
                        <p className="text-xs text-slate-500">{v.institutionName}</p>
                      </div>
                      <Badge className={`border ${v.recommendation === 'approve' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : v.recommendation === 'reject' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                        {v.recommendation}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-600"><CalendarClock size={14} className="text-slate-400" /> {formatDate(v.date)}</div>
                      <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} className="text-slate-400" /> {v.venue}</div>
                      {v.report && <div className="bg-slate-50 rounded-lg p-2.5 text-slate-600 text-xs mt-2">{v.report}</div>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => (
              <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 ${cell.day === 0 ? 'border-transparent' : 'border-slate-100 hover:border-slate-200'} ${cell.day === new Date().getDate() ? 'bg-blue-50 border-blue-200' : ''}`}>
                {cell.day > 0 && (
                  <>
                    <p className="text-xs font-medium text-slate-600 mb-1">{cell.day}</p>
                    {cell.visits.map(v => (
                      <div key={v.id} className={`text-[10px] rounded px-1 py-0.5 mb-0.5 truncate ${
                        v.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`} title={`${v.referenceNo} - ${v.institutionName}`}>
                        {v.referenceNo.split('/')[2]}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {showSchedule && (
        <ScheduleModal apps={eligibleApps} onClose={() => setShowSchedule(false)} onSchedule={scheduleEVC} />
      )}
      {showReport && (
        <ReportModal visit={showReport} onClose={() => setShowReport(null)} onComplete={(report, rec) => { completeEVC(showReport.id, report, rec); setShowReport(null); }} />
      )}
    </div>
  );
}

function ScheduleModal({ apps, onClose, onSchedule }: {
  apps: { id: string; referenceNo: string; institutionName: string }[];
  onClose: () => void;
  onSchedule: (v: Omit<EVCVisit, 'id' | 'status' | 'report' | 'recommendation'>) => void;
}) {
  const [form, setForm] = useState({
    applicationId: apps[0]?.id || '',
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    time: '10:30',
    venue: '',
    committeeChair: EVC_CHAIRS[0],
    members: [EVC_CHAIRS[1], OFFICERS[0]],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const app = apps.find(a => a.id === form.applicationId);
    if (!app) return;
    onSchedule({
      applicationId: form.applicationId,
      referenceNo: app.referenceNo,
      institutionName: app.institutionName,
      date: new Date(form.date + 'T' + form.time).toISOString(),
      time: form.time,
      venue: form.venue || `${app.institutionName} Campus`,
      committeeChair: form.committeeChair,
      members: form.members,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Schedule EVC Visit" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Application">
          <select value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })} className={inputClass} required>
            {apps.map(a => <option key={a.id} value={a.id}>{a.referenceNo} — {a.institutionName}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Visit Date">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} required />
          </Field>
          <Field label="Visit Time">
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={inputClass} required />
          </Field>
        </div>
        <Field label="Venue">
          <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className={inputClass} placeholder="Institution campus address" />
        </Field>
        <Field label="Committee Chair">
          <select value={form.committeeChair} onChange={e => setForm({ ...form, committeeChair: e.target.value })} className={inputClass}>
            {EVC_CHAIRS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Committee Members (comma-separated)">
          <input value={form.members.join(', ')} onChange={e => setForm({ ...form, members: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputClass} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Schedule Visit</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReportModal({ visit, onClose, onComplete }: {
  visit: EVCVisit;
  onClose: () => void;
  onComplete: (report: string, recommendation: EVCVisit['recommendation']) => void;
}) {
  const [report, setReport] = useState('');
  const [rec, setRec] = useState<EVCVisit['recommendation']>('approve');

  return (
    <Modal open onClose={onClose} title={`EVC Report — ${visit.referenceNo}`} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-400">Institution:</span> <span className="font-medium text-slate-700">{visit.institutionName}</span></div>
          <div><span className="text-slate-400">Date:</span> <span className="font-medium text-slate-700">{formatDate(visit.date)}</span></div>
          <div><span className="text-slate-400">Chair:</span> <span className="font-medium text-slate-700">{visit.committeeChair}</span></div>
          <div><span className="text-slate-400">Venue:</span> <span className="font-medium text-slate-700">{visit.venue}</span></div>
        </div>
        <Field label="Committee Report">
          <textarea value={report} onChange={e => setReport(e.target.value)} className={`${inputClass} h-32 resize-none`} placeholder="Describe findings, observations, and recommendations..." />
        </Field>
        <Field label="Recommendation">
          <select value={rec || ''} onChange={e => setRec(e.target.value as EVCVisit['recommendation'])} className={inputClass}>
            <option value="approve">Recommend Approval</option>
            <option value="conditional">Conditional Approval</option>
            <option value="reject">Recommend Rejection</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" onClick={() => onComplete(report, rec)}><CheckCircle2 size={16} /> Submit Report</Button>
        </div>
      </div>
    </Modal>
  );
}
