import { useMemo, useState } from 'react';
import {
  Plus, Search, ArrowLeft, Check, X, Clock,
  ChevronRight, FileText, Calendar, User, AlertCircle, Building2, CheckCircle2, XCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from '@/lib/router';
import {
  Card, PageHeader, Badge, Button, Modal, Field, inputClass,
  formatDate, formatDateTime, daysUntil, downloadCSV, EmptyState,
} from '@/components/ui';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_DOT, STAGE_LABELS,
  PRIORITY_COLORS, ROLE_LABELS,
} from '@/lib/constants';
import type { Application, ApplicationStatus, WorkflowStage } from '@/types';

export function ApplicationsPage() {
  const { applications, institutions, currentUser } = useStore();
  const { param, navigate } = useRouter();

  if (param === 'new') {
    return <NewApplicationModal institutions={institutions} onClose={() => navigate('applications')} />;
  }
  if (param) {
    return <ApplicationDetail appId={param} onBack={() => navigate('applications')} />;
  }
  return <ApplicationList apps={applications} institutions={institutions} role={currentUser?.role ?? 'officer'} institutionId={currentUser?.institutionId} onOpen={(id) => navigate('applications', id)} onNew={() => navigate('applications', 'new')} />;
}

function ApplicationList({ apps, role, institutionId, onOpen, onNew }: {
  apps: Application[]; role: string;
  institutionId?: string; onOpen: (id: string) => void; onNew: () => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = apps;
    if (role === 'institution' && institutionId) list = list.filter(a => a.institutionId === institutionId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.referenceNo.toLowerCase().includes(q) || a.institutionName.toLowerCase().includes(q) || a.courseName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(a => a.priority === priorityFilter);
    return list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [apps, role, institutionId, search, statusFilter, priorityFilter]);

  const handleExport = () => {
    downloadCSV('applications.csv', filtered.map(a => ({
      Reference: a.referenceNo, Institution: a.institutionName, Course: a.courseName,
      Status: STATUS_LABELS[a.status], Priority: a.priority, Submitted: a.submittedAt.slice(0, 10),
      Deadline: a.scrutinyDeadline.slice(0, 10), Officer: a.assignedOfficer, Progress: `${a.progress}%`,
    })));
  };

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={`${filtered.length} application${filtered.length !== 1 ? 's' : ''} ${role === 'institution' ? 'for your institution' : 'across all institutions'}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
            {(role === 'institution' || role === 'admin') && (
              <Button size="sm" onClick={onNew}><Plus size={16} /> New Application</Button>
            )}
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, institution, or course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ApplicationStatus | 'all')} className={`${inputClass} sm:w-44`}>
            <option value="all">All Statuses</option>
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={`${inputClass} sm:w-36`}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No applications found" message="Try adjusting your filters or create a new application." icon={<FileText size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Reference</th>
                  <th className="text-left px-4 py-3 font-medium">Institution</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Course</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Progress</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const overdue = !['approved', 'rejected', 'withdrawn'].includes(a.status) && daysUntil(a.scrutinyDeadline) < 0;
                  return (
                    <tr key={a.id} onClick={() => onOpen(a.id)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[a.status]}`} />
                          <span className="font-medium text-slate-800">{a.referenceNo}</span>
                          {overdue && <AlertCircle size={14} className="text-rose-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">{a.institutionName}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell truncate max-w-[140px]">{a.courseName}</td>
                      <td className="px-4 py-3"><Badge className={STATUS_COLORS[a.status]}>{STATUS_LABELS[a.status]}</Badge></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Badge className={PRIORITY_COLORS[a.priority]}>{a.priority}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        <span className={overdue ? 'text-rose-600 font-medium' : ''}>{formatDate(a.scrutinyDeadline)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${a.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${a.progress}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{a.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right"><ChevronRight size={16} className="text-slate-300" /></td>
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

function NewApplicationModal({ institutions, onClose }: { institutions: { id: string; name: string }[]; onClose: () => void }) {
  const { addApplication, currentUser } = useStore();
  const { navigate } = useRouter();
  const [form, setForm] = useState({
    institutionId: currentUser?.institutionId || institutions[0]?.id || '',
    courseName: '',
    courseType: 'B.Tech',
    intake: 60,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseName || !form.institutionId) return;
    const inst = institutions.find(i => i.id === form.institutionId);
    const app = addApplication({
      institutionId: form.institutionId,
      institutionName: inst?.name || '',
      courseName: form.courseName,
      courseType: form.courseType,
      intake: form.intake,
      priority: form.priority,
      evcDate: null,
      decisionDate: null,
    });
    onClose();
    navigate('applications', app.id);
  };

  return (
    <Modal open onClose={onClose} title="Submit New Application" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Institution">
          <select value={form.institutionId} onChange={e => setForm({ ...form, institutionId: e.target.value })} className={inputClass} required>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
        <Field label="Course Name">
          <input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} className={inputClass} placeholder="e.g. B.Tech Computer Science" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Course Type">
            <select value={form.courseType} onChange={e => setForm({ ...form, courseType: e.target.value })} className={inputClass}>
              <option>B.Tech</option><option>UG</option><option>PG</option><option>Diploma</option>
            </select>
          </Field>
          <Field label="Intake Capacity">
            <input type="number" value={form.intake} onChange={e => setForm({ ...form, intake: parseInt(e.target.value) || 0 })} className={inputClass} min={1} max={500} />
          </Field>
        </div>
        <Field label="Priority">
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' })} className={inputClass}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Submit Application</Button>
        </div>
      </form>
    </Modal>
  );
}

function ApplicationDetail({ appId, onBack }: { appId: string; onBack: () => void }) {
  const { applications, documents, events, evcVisits, currentUser, advanceWorkflow, updateApplicationStatus } = useStore();
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState<'advance' | 'approve' | 'reject' | 'withdraw' | null>(null);
  const [notes, setNotes] = useState('');

  const app = applications.find(a => a.id === appId);
  if (!app) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <EmptyState title="Application not found" message="This application may have been removed." icon={<FileText size={48} />} />
      </div>
    );
  }

  const appDocs = documents.filter(d => d.applicationId === app.id);
  const appEvents = events.filter(e => e.applicationId === app.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const evc = evcVisits.find(v => v.applicationId === app.id);

  const role = currentUser?.role ?? 'officer';
  const canAct = role === 'officer' || role === 'admin';
  const canSubmit = role === 'institution' || role === 'admin';

  const handleAction = () => {
    if (!actionType || !currentUser) return;
    if (actionType === 'advance') advanceWorkflow(app.id, currentUser.name, notes);
    else if (actionType === 'approve') updateApplicationStatus(app.id, 'approved', currentUser.name, notes);
    else if (actionType === 'reject') updateApplicationStatus(app.id, 'rejected', currentUser.name, notes);
    else if (actionType === 'withdraw') updateApplicationStatus(app.id, 'withdrawn', currentUser.name, notes);
    setShowAction(false);
    setActionType(null);
    setNotes('');
  };

  const workflowSteps: WorkflowStage[] = ['submitted', 'under_scrutiny', 'evc_scheduled', 'under_review', 'approved'];
  const currentIdx = workflowSteps.indexOf(app.currentStage);
  const isTerminal = app.status === 'rejected' || app.status === 'withdrawn';

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition">
        <ArrowLeft size={16} /> Back to Applications
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{app.referenceNo}</h1>
            <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
            <Badge className={PRIORITY_COLORS[app.priority]}>{app.priority}</Badge>
          </div>
          <p className="text-sm text-slate-500">{app.institutionName} · {app.courseName} ({app.courseType}) · Intake: {app.intake}</p>
        </div>
        {(canAct && !['approved', 'rejected', 'withdrawn'].includes(app.status)) && (
          <Button size="sm" onClick={() => setShowAction(true)}>Take Action</Button>
        )}
        {canSubmit && app.status === 'submitted' && (
          <Button size="sm" variant="ghost" onClick={() => { updateApplicationStatus(app.id, 'withdrawn', currentUser?.name || '', 'Withdrawn by institution'); }}>Withdraw</Button>
        )}
      </div>

      {/* Workflow tracker */}
      <Card className="p-6 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Approval Workflow</h3>
        <div className="flex items-center overflow-x-auto pb-2">
          {workflowSteps.map((step, i) => {
            const done = i < currentIdx || (i === currentIdx && app.status === 'approved');
            const current = i === currentIdx && !isTerminal;
            return (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    done ? 'bg-emerald-500 border-emerald-500 text-white' :
                    current ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {done ? <Check size={18} /> : <span className="text-sm font-semibold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs mt-2 whitespace-nowrap ${current ? 'text-blue-600 font-medium' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                    {STAGE_LABELS[step]}
                  </span>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className={`w-12 lg:w-20 h-0.5 mx-1 ${i < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
          {isTerminal && (
            <div className="flex flex-col items-center ml-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${app.status === 'rejected' ? 'bg-rose-500 border-rose-500' : 'bg-gray-400 border-gray-400'} text-white`}>
                {app.status === 'rejected' ? <XCircle size={18} /> : <X size={18} />}
              </div>
              <span className="text-xs mt-2 text-slate-600">{STAGE_LABELS[app.status as WorkflowStage]}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: info */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Application Details</h3>
            <div className="space-y-3 text-sm">
              <DetailRow icon={<Building2 size={14} />} label="Institution" value={app.institutionName} />
              <DetailRow icon={<FileText size={14} />} label="Course" value={`${app.courseName} (${app.courseType})`} />
              <DetailRow icon={<User size={14} />} label="Assigned Officer" value={app.assignedOfficer} />
              <DetailRow icon={<Calendar size={14} />} label="Submitted" value={formatDate(app.submittedAt)} />
              <DetailRow icon={<Clock size={14} />} label="Scrutiny Deadline" value={formatDate(app.scrutinyDeadline)} />
              {app.evcDate && <DetailRow icon={<Calendar size={14} />} label="EVC Date" value={formatDate(app.evcDate)} />}
              {app.decisionDate && <DetailRow icon={<CheckCircle2 size={14} />} label="Decision Date" value={formatDate(app.decisionDate)} />}
              <DetailRow icon={<Clock size={14} />} label="Last Updated" value={formatDateTime(app.lastUpdated)} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Documents ({appDocs.length})</h3>
            <div className="space-y-2">
              {appDocs.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-600 truncate flex-1">{d.name}</span>
                  <Badge className={d.status === 'valid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : d.status === 'missing' ? 'bg-rose-100 text-rose-800 border-rose-200' : d.status === 'expired' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>{d.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Activity Timeline</h3>
            <div className="space-y-0">
              {appEvents.map((ev, i) => (
                <div key={ev.id} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      ev.stage === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      ev.stage === 'rejected' ? 'bg-rose-100 text-rose-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {ev.stage === 'approved' ? <Check size={14} /> : ev.stage === 'rejected' ? <X size={14} /> : <Clock size={14} />}
                    </div>
                    {i < appEvents.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{ev.action}</p>
                      <span className="text-xs text-slate-400">{formatDateTime(ev.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">by {ev.actor} · {ROLE_LABELS[ev.actorRole]}</p>
                    {ev.notes && <p className="text-sm text-slate-600 mt-1.5 bg-slate-50 rounded-lg px-3 py-2">{ev.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {evc && (
            <Card className="p-5 mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">EVC Visit</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Date:</span> {formatDate(evc.date)} at {evc.time}</div>
                <div><span className="text-slate-400">Status:</span> <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">{evc.status}</Badge></div>
                <div className="col-span-2"><span className="text-slate-400">Venue:</span> {evc.venue}</div>
                <div className="col-span-2"><span className="text-slate-400">Chair:</span> {evc.committeeChair}</div>
                <div className="col-span-2"><span className="text-slate-400">Members:</span> {evc.members.join(', ')}</div>
                {evc.report && <div className="col-span-2 bg-slate-50 rounded-lg p-3 text-slate-700">{evc.report}</div>}
                {evc.recommendation && <div className="col-span-2"><span className="text-slate-400">Recommendation:</span> <span className="font-medium capitalize">{evc.recommendation}</span></div>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action modal */}
      <Modal open={showAction} onClose={() => setShowAction(false)} title="Application Action" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {!['under_review'].includes(app.status) && app.status !== 'approved' && (
              <button onClick={() => setActionType('advance')} className={`p-3 rounded-lg border-2 text-left transition ${actionType === 'advance' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <ChevronRight size={18} className="text-blue-600 mb-1" />
                <p className="text-sm font-medium">Advance Stage</p>
                <p className="text-xs text-slate-500">Move to next workflow step</p>
              </button>
            )}
            <button onClick={() => setActionType('approve')} className={`p-3 rounded-lg border-2 text-left transition ${actionType === 'approve' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <CheckCircle2 size={18} className="text-emerald-600 mb-1" />
              <p className="text-sm font-medium">Approve</p>
              <p className="text-xs text-slate-500">Final approval decision</p>
            </button>
            <button onClick={() => setActionType('reject')} className={`p-3 rounded-lg border-2 text-left transition ${actionType === 'reject' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <XCircle size={18} className="text-rose-600 mb-1" />
              <p className="text-sm font-medium">Reject</p>
              <p className="text-xs text-slate-500">Final rejection decision</p>
            </button>
          </div>
          {actionType && (
            <>
              <Field label="Notes / Reason">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Add comments or reason for this action..." />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowAction(false)}>Cancel</Button>
                <Button variant={actionType === 'reject' ? 'danger' : actionType === 'approve' ? 'success' : 'primary'} onClick={handleAction}>
                  Confirm {actionType === 'advance' ? 'Advance' : actionType}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
