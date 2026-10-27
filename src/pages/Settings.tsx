import { useState } from 'react';
import {
  Settings as SettingsIcon, Workflow, Clock, Bell, Save, RotateCcw,
  Building2, Plus, ShieldAlert, Info,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Button, Field, inputClass, Badge, Modal } from '@/components/ui';
import { DOC_TYPE_LABELS, ROLE_LABELS, STAGE_LABELS, STATES } from '@/lib/constants';
import type { AppSettings, Role, DocumentType } from '@/types';

export function SettingsPage() {
  const { settings, updateSettings, resetData, addInstitution, currentUser } = useStore();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showInstitution, setShowInstitution] = useState(false);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'officer';

  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetData();
    setShowReset(false);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure workflow stages, deadlines, and notification preferences"
        action={
          canEdit ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowReset(true)}><RotateCcw size={14} /> Reset Demo Data</Button>
              <Button size="sm" onClick={handleSave}><Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}</Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workflow Stages */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Workflow size={18} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Approval Workflow Stages</h3>
          </div>
          <div className="space-y-3">
            {draft.workflow.stages.map((stage, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900 text-white text-xs font-bold">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{stage.label}</p>
                  <p className="text-xs text-slate-400">Responsible: {ROLE_LABELS[stage.responsible]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">SLA</label>
                  <input
                    type="number"
                    value={stage.slaDays}
                    disabled={!canEdit}
                    onChange={e => {
                      const stages = [...draft.workflow.stages];
                      stages[i] = { ...stage, slaDays: parseInt(e.target.value) || 0 };
                      setDraft({ ...draft, workflow: { ...draft.workflow, stages } });
                    }}
                    className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-start gap-1.5">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            SLA days define the expected turnaround for each workflow stage. Overdue alerts trigger after the SLA expires.
          </p>
        </Card>

        {/* Deadline Configuration */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-700">Deadline Configuration</h3>
          </div>
          <div className="space-y-4">
            <Field label="Scrutiny Deadline (days)">
              <input type="number" value={draft.workflow.deadlines.scrutinyDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, workflow: { ...draft.workflow, deadlines: { ...draft.workflow.deadlines, scrutinyDays: parseInt(e.target.value) || 0 } } })}
                className={inputClass} min={1} />
            </Field>
            <Field label="EVC Notice Period (days)">
              <input type="number" value={draft.workflow.deadlines.evcNoticeDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, workflow: { ...draft.workflow, deadlines: { ...draft.workflow.deadlines, evcNoticeDays: parseInt(e.target.value) || 0 } } })}
                className={inputClass} min={1} />
            </Field>
            <Field label="Review Period (days)">
              <input type="number" value={draft.workflow.deadlines.reviewDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, workflow: { ...draft.workflow, deadlines: { ...draft.workflow.deadlines, reviewDays: parseInt(e.target.value) || 0 } } })}
                className={inputClass} min={1} />
            </Field>
            <Field label="Document Expiry Warning (days before expiry)">
              <input type="number" value={draft.workflow.deadlines.documentExpiryWarningDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, workflow: { ...draft.workflow, deadlines: { ...draft.workflow.deadlines, documentExpiryWarningDays: parseInt(e.target.value) || 0 } } })}
                className={inputClass} min={1} />
            </Field>
            <Field label="Compliance Check Interval (days)">
              <input type="number" value={draft.workflow.deadlines.complianceCheckIntervalDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, workflow: { ...draft.workflow, deadlines: { ...draft.workflow.deadlines, complianceCheckIntervalDays: parseInt(e.target.value) || 0 } } })}
                className={inputClass} min={1} />
            </Field>
          </div>
        </Card>

        {/* Required Documents */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Required Documents</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map(dt => {
              const checked = draft.workflow.documentRequirements.includes(dt);
              return (
                <label key={dt} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${checked ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-slate-50'} ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!canEdit}
                    onChange={e => {
                      const reqs = e.target.checked
                        ? [...draft.workflow.documentRequirements, dt]
                        : draft.workflow.documentRequirements.filter(d => d !== dt);
                      setDraft({ ...draft, workflow: { ...draft.workflow, documentRequirements: reqs } });
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">{DOC_TYPE_LABELS[dt]}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">Missing required documents trigger automatic critical alerts.</p>
        </Card>

        {/* Notification Settings */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-700">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Email Alerts</p>
                <p className="text-xs text-slate-400">Send email notifications for critical alerts</p>
              </div>
              <input
                type="checkbox"
                checked={draft.notifications.emailAlerts}
                disabled={!canEdit}
                onChange={e => setDraft({ ...draft, notifications: { ...draft.notifications, emailAlerts: e.target.checked } })}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
            </label>
            <Field label="Deadline Warning (days before deadline)">
              <input type="number" value={draft.notifications.deadlineWarningDays} disabled={!canEdit}
                onChange={e => setDraft({ ...draft, notifications: { ...draft.notifications, deadlineWarningDays: parseInt(e.target.value) || 0 } })}
                className={inputClass} min={1} />
            </Field>
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Auto-Escalate Overdue</p>
                <p className="text-xs text-slate-400">Automatically escalate overdue applications to senior officers</p>
              </div>
              <input
                type="checkbox"
                checked={draft.notifications.autoEscalate}
                disabled={!canEdit}
                onChange={e => setDraft({ ...draft, notifications: { ...draft.notifications, autoEscalate: e.target.checked } })}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Institution Registration (admin only) */}
      {currentUser?.role === 'admin' && (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-700">Register New Institution</h3>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowInstitution(true)}><Plus size={14} /> Add Institution</Button>
          </div>
          <p className="text-xs text-slate-400">Register a new institution to enable them to submit applications through the portal.</p>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mt-4 text-sm text-amber-800">
        <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Demo Configuration Notice</p>
          <p className="text-xs mt-1 text-amber-700">
            This is a demonstration system for SIH 2026 (problem statement SIH26262).
            Workflow stages and deadlines shown here are configurable examples for demo purposes.
            Final regulatory decisions are restricted to authorized officer roles.
            This system is not affiliated with or endorsed by official AICTE.
          </p>
        </div>
      </div>

      {/* Reset confirmation */}
      <Modal open={showReset} onClose={() => setShowReset(false)} title="Reset Demo Data" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will reset all applications, documents, compliance items, alerts, and audit entries back to the original demo data. Any changes you made will be lost.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset}><RotateCcw size={16} /> Reset Data</Button>
          </div>
        </div>
      </Modal>

      {/* Institution modal */}
      {showInstitution && <InstitutionModal onClose={() => setShowInstitution(false)} onAdd={addInstitution} />}
    </div>
  );
}

function InstitutionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (inst: Omit<import('@/types').Institution, 'id' | 'code' | 'registeredAt'>) => void }) {
  const [form, setForm] = useState({
    name: '',
    type: 'Engineering' as import('@/types').Institution['type'],
    state: STATES[0],
    city: '',
    established: 2000,
    director: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.director) return;
    onAdd(form);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Register New Institution" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Institution Name">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. St. Xavier Institute of Technology" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as import('@/types').Institution['type'] })} className={inputClass}>
              <option>Engineering</option><option>Management</option><option>Pharmacy</option>
              <option>Architecture</option><option>Polytechnic</option><option>Applied Arts</option>
            </select>
          </Field>
          <Field label="Established Year">
            <input type="number" value={form.established} onChange={e => setForm({ ...form, established: parseInt(e.target.value) || 2000 })} className={inputClass} min={1950} max={2026} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State">
            <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={inputClass}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="City">
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} required />
          </Field>
        </div>
        <Field label="Director Name">
          <input value={form.director} onChange={e => setForm({ ...form, director: e.target.value })} className={inputClass} placeholder="Dr. ..." required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="registrar@institute.edu.in" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 ..." />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Register Institution</Button>
        </div>
      </form>
    </Modal>
  );
}
