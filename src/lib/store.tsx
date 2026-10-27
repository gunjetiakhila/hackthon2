import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Application, Institution, DocumentRecord, EVCVisit, ComplianceItem, Alert,
  AuditEntry, User, AppSettings, WorkflowStage, ApplicationEvent, ApplicationStatus,
} from '@/types';
import { generateSeed, DEFAULT_SETTINGS, DEMO_USERS } from './seed';
import { STATUS_LABELS } from './constants';

const KEY = 'aicte-smartflow-v1';

interface StoreState {
  institutions: Institution[];
  applications: Application[];
  documents: DocumentRecord[];
  evcVisits: EVCVisit[];
  compliance: ComplianceItem[];
  alerts: Alert[];
  audit: AuditEntry[];
  events: ApplicationEvent[];
  settings: AppSettings;
  currentUser: User | null;
}

interface StoreContextValue extends StoreState {
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  addApplication: (app: Omit<Application, 'id' | 'referenceNo' | 'submittedAt' | 'lastUpdated' | 'scrutinyDeadline' | 'progress' | 'status' | 'currentStage' | 'assignedOfficer'>) => Application;
  updateApplicationStatus: (id: string, status: ApplicationStatus, actor: string, notes: string) => void;
  advanceWorkflow: (id: string, actor: string, notes: string) => void;
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'uploadedAt' | 'status'> & { status?: DocumentRecord['status'] }) => void;
  updateDocumentStatus: (id: string, status: DocumentRecord['status']) => void;
  scheduleEVC: (visit: Omit<EVCVisit, 'id' | 'status' | 'report' | 'recommendation'>) => void;
  completeEVC: (id: string, report: string, recommendation: EVCVisit['recommendation']) => void;
  updateCompliance: (id: string, status: ComplianceItem['status']) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  updateSettings: (settings: AppSettings) => void;
  addInstitution: (inst: Omit<Institution, 'id' | 'code' | 'registeredAt'>) => void;
  regenerateAlerts: () => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed.applications?.length) return parsed;
    }
  } catch { /* ignore */ }
  const seed = generateSeed();
  return { ...seed, settings: DEFAULT_SETTINGS, currentUser: null };
}

function saveState(state: StoreState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const login = useCallback((userId: string) => {
    const user = DEMO_USERS.find(u => u.id === userId) || null;
    setState(s => ({ ...s, currentUser: user }));
  }, []);

  const logout = useCallback(() => {
    setState(s => ({ ...s, currentUser: null }));
  }, []);

  const addAudit = useCallback((actor: string, actorRole: string, action: string, entity: string, entityId: string, details: string) => {
    setState(s => ({
      ...s,
      audit: [
        { id: uid('au'), timestamp: new Date().toISOString(), actor, actorRole: actorRole as AuditEntry['actorRole'], action, entity, entityId, details, ipAddress: '10.0.0.1' },
        ...s.audit,
      ].slice(0, 500),
    }));
  }, []);

  const addEvent = useCallback((applicationId: string, stage: WorkflowStage, action: string, actor: string, actorRole: string, notes: string) => {
    setState(s => ({
      ...s,
      events: [...s.events, { id: uid('ev'), applicationId, stage, action, actor, actorRole: actorRole as ApplicationEvent['actorRole'], timestamp: new Date().toISOString(), notes }],
    }));
  }, []);

  const addApplication: StoreContextValue['addApplication'] = useCallback((data) => {
    const now = new Date().toISOString();
    const scrutinyDeadline = new Date();
    scrutinyDeadline.setDate(scrutinyDeadline.getDate() + DEFAULT_SETTINGS.workflow.deadlines.scrutinyDays);
    const refNo = `AICTE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const app: Application = {
      ...data,
      id: uid('app'),
      referenceNo: refNo,
      status: 'submitted',
      currentStage: 'submitted',
      submittedAt: now,
      lastUpdated: now,
      scrutinyDeadline: scrutinyDeadline.toISOString(),
      progress: 10,
      assignedOfficer: 'Unassigned',
    };
    setState(s => {
      const newState = { ...s, applications: [app, ...s.applications] };
      addAudit(data.institutionName, 'institution', 'Application Submitted', 'Application', refNo, `New application for ${data.courseName}`);
      addEvent(app.id, 'submitted', 'Application submitted', data.institutionName, 'institution', 'Initial submission');
      return newState;
    });
    return app;
  }, [addAudit, addEvent]);

  const updateApplicationStatus: StoreContextValue['updateApplicationStatus'] = useCallback((id, status, actor, notes) => {
    setState(s => {
      const app = s.applications.find(a => a.id === id);
      if (!app) return s;
      const now = new Date().toISOString();
      const isTerminal = status === 'approved' || status === 'rejected';
      const updated = s.applications.map(a =>
        a.id === id ? { ...a, status, currentStage: status, lastUpdated: now, decisionDate: isTerminal ? now : a.decisionDate, progress: isTerminal ? 100 : a.progress } : a
      );
      addAudit(actor, s.currentUser?.role ?? 'officer', 'Status Updated', 'Application', app.referenceNo, `Status changed to "${STATUS_LABELS[status]}"${notes ? ` — ${notes}` : ''}`);
      addEvent(id, status, `Status changed to ${STATUS_LABELS[status]}`, actor, s.currentUser?.role ?? 'officer', notes);
      const newAlert: Alert = {
        id: uid('al'), type: 'status_change', severity: status === 'approved' || status === 'rejected' ? 'critical' : 'info',
        title: 'Application Status Updated', message: `${app.referenceNo} is now "${STATUS_LABELS[status]}"${notes ? ` — ${notes}` : ''}`,
        applicationId: id, referenceNo: app.referenceNo, createdAt: now, read: false, forRole: 'all',
      };
      return { ...s, applications: updated, alerts: [newAlert, ...s.alerts] };
    });
  }, [addAudit, addEvent]);

  const advanceWorkflow: StoreContextValue['advanceWorkflow'] = useCallback((id, actor, notes) => {
    setState(s => {
      const app = s.applications.find(a => a.id === id);
      if (!app) return s;
      const order: WorkflowStage[] = ['submitted', 'under_scrutiny', 'evc_scheduled', 'under_review', 'approved'];
      const idx = order.indexOf(app.currentStage);
      if (idx < 0 || idx >= order.length - 1) return s;
      const nextStage = order[idx + 1];
      const now = new Date().toISOString();
      const isTerminal = nextStage === 'approved';
      const updated = s.applications.map(a =>
        a.id === id ? { ...a, status: nextStage as ApplicationStatus, currentStage: nextStage, lastUpdated: now, progress: isTerminal ? 100 : (idx + 2) * 20, decisionDate: isTerminal ? now : a.decisionDate } : a
      );
      addAudit(actor, s.currentUser?.role ?? 'officer', 'Workflow Advanced', 'Application', app.referenceNo, `Advanced to "${STATUS_LABELS[nextStage as ApplicationStatus]}"${notes ? ` — ${notes}` : ''}`);
      addEvent(id, nextStage, `Advanced to ${STATUS_LABELS[nextStage as ApplicationStatus]}`, actor, s.currentUser?.role ?? 'officer', notes);
      return { ...s, applications: updated };
    });
  }, [addAudit, addEvent]);

  const addDocument: StoreContextValue['addDocument'] = useCallback((data) => {
    setState(s => {
      const doc: DocumentRecord = {
        ...data,
        id: uid('doc'),
        uploadedAt: new Date().toISOString(),
        status: data.status ?? 'valid',
      };
      addAudit(s.currentUser?.name ?? 'System', s.currentUser?.role ?? 'institution', 'Document Uploaded', 'Document', doc.type, `Uploaded ${doc.name} for application ${doc.applicationId}`);
      return { ...s, documents: [doc, ...s.documents] };
    });
  }, [addAudit]);

  const updateDocumentStatus: StoreContextValue['updateDocumentStatus'] = useCallback((id, status) => {
    setState(s => ({ ...s, documents: s.documents.map(d => d.id === id ? { ...d, status } : d) }));
  }, []);

  const scheduleEVC: StoreContextValue['scheduleEVC'] = useCallback((data) => {
    setState(s => {
      const visit: EVCVisit = { ...data, id: uid('evc'), status: 'scheduled', report: null, recommendation: null };
      const updatedApps = s.applications.map(a =>
        a.id === data.applicationId ? { ...a, status: 'evc_scheduled' as ApplicationStatus, currentStage: 'evc_scheduled' as WorkflowStage, evcDate: data.date, lastUpdated: new Date().toISOString(), progress: 55 } : a
      );
      addAudit(s.currentUser?.name ?? 'Officer', s.currentUser?.role ?? 'officer', 'EVC Scheduled', 'EVC Visit', data.referenceNo, `Visit scheduled for ${data.date.slice(0, 10)}`);
      addEvent(data.applicationId, 'evc_scheduled', 'EVC visit scheduled', s.currentUser?.name ?? 'Officer', s.currentUser?.role ?? 'officer', `Visit on ${data.date.slice(0, 10)} at ${data.venue}`);
      const alert: Alert = {
        id: uid('al'), type: 'evc_scheduled', severity: 'info', title: 'EVC Visit Scheduled',
        message: `EVC visit for ${data.referenceNo} on ${data.date.slice(0, 10)} at ${data.venue}`,
        applicationId: data.applicationId, referenceNo: data.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'all',
      };
      return { ...s, evcVisits: [visit, ...s.evcVisits], applications: updatedApps, alerts: [alert, ...s.alerts] };
    });
  }, [addAudit, addEvent]);

  const completeEVC: StoreContextValue['completeEVC'] = useCallback((id, report, recommendation) => {
    setState(s => {
      const visit = s.evcVisits.find(v => v.id === id);
      if (!visit) return s;
      const updated = s.evcVisits.map(v => v.id === id ? { ...v, status: 'completed' as const, report, recommendation } : v);
      const updatedApps = s.applications.map(a =>
        a.id === visit.applicationId ? { ...a, status: 'under_review' as ApplicationStatus, currentStage: 'under_review' as WorkflowStage, lastUpdated: new Date().toISOString(), progress: 75 } : a
      );
      addAudit(s.currentUser?.name ?? 'EVC Chair', s.currentUser?.role ?? 'evc', 'EVC Report Submitted', 'EVC Visit', visit.referenceNo, `Recommendation: ${recommendation}`);
      addEvent(visit.applicationId, 'under_review', 'EVC report submitted', s.currentUser?.name ?? 'EVC Chair', s.currentUser?.role ?? 'evc', report.slice(0, 100));
      return { ...s, evcVisits: updated, applications: updatedApps };
    });
  }, [addAudit, addEvent]);

  const updateCompliance: StoreContextValue['updateCompliance'] = useCallback((id, status) => {
    setState(s => {
      const item = s.compliance.find(c => c.id === id);
      if (item) addAudit(s.currentUser?.name ?? 'Officer', s.currentUser?.role ?? 'officer', 'Compliance Updated', 'Compliance', item.referenceNo, `${item.category}: ${status}`);
      return { ...s, compliance: s.compliance.map(c => c.id === id ? { ...c, status, lastChecked: new Date().toISOString() } : c) };
    });
  }, [addAudit]);

  const markAlertRead = useCallback((id: string) => {
    setState(s => ({ ...s, alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) }));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setState(s => ({ ...s, alerts: s.alerts.map(a => ({ ...a, read: true })) }));
  }, []);

  const updateSettings = useCallback((settings: AppSettings) => {
    setState(s => {
      addAudit(s.currentUser?.name ?? 'Admin', s.currentUser?.role ?? 'admin', 'Settings Updated', 'Settings', 'global', 'Workflow/notification settings changed');
      return { ...s, settings };
    });
  }, [addAudit]);

  const addInstitution = useCallback((data: Omit<Institution, 'id' | 'code' | 'registeredAt'>) => {
    setState(s => {
      const inst: Institution = { ...data, id: uid('inst'), code: `AIC-${String(s.institutions.length + 1).padStart(4, '0')}`, registeredAt: new Date().toISOString() };
      addAudit(data.director, 'institution', 'Institution Registered', 'Institution', inst.code, `Registered ${inst.name}`);
      return { ...s, institutions: [inst, ...s.institutions] };
    });
  }, [addAudit]);

  const regenerateAlerts = useCallback(() => {
    setState(s => {
      const alerts: Alert[] = [];
      const now = Date.now();
      s.applications.forEach(app => {
        const appDocs = s.documents.filter(d => d.applicationId === app.id);
        appDocs.filter(d => d.status === 'missing').forEach(m => {
          alerts.push({ id: uid('al'), type: 'missing_document', severity: 'critical', title: 'Missing Document', message: `${m.name} missing for ${app.referenceNo}`, applicationId: app.id, referenceNo: app.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'all' });
        });
        appDocs.filter(d => d.status === 'expired').forEach(m => {
          alerts.push({ id: uid('al'), type: 'missing_document', severity: 'critical', title: 'Expired Document', message: `${m.name} expired for ${app.referenceNo}`, applicationId: app.id, referenceNo: app.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'all' });
        });
        if (['submitted', 'under_scrutiny'].includes(app.status)) {
          const daysLeft = Math.ceil((new Date(app.scrutinyDeadline).getTime() - now) / 86400000);
          if (daysLeft < 0) alerts.push({ id: uid('al'), type: 'overdue', severity: 'critical', title: 'Scrutiny Overdue', message: `${app.referenceNo} past scrutiny deadline`, applicationId: app.id, referenceNo: app.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'officer' });
          else if (daysLeft <= 7) alerts.push({ id: uid('al'), type: 'deadline_approaching', severity: 'warning', title: 'Deadline Approaching', message: `${app.referenceNo} scrutiny in ${daysLeft} days`, applicationId: app.id, referenceNo: app.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'officer' });
        }
        if (app.status === 'evc_scheduled' && app.evcDate) {
          const daysLeft = Math.ceil((new Date(app.evcDate).getTime() - now) / 86400000);
          alerts.push({ id: uid('al'), type: 'evc_scheduled', severity: 'info', title: 'EVC Scheduled', message: `${app.referenceNo} visit in ${daysLeft} days`, applicationId: app.id, referenceNo: app.referenceNo, createdAt: new Date().toISOString(), read: false, forRole: 'all' });
        }
      });
      return { ...s, alerts: [...alerts, ...s.alerts.filter(a => a.read)] };
    });
  }, []);

  const resetData = useCallback(() => {
    const seed = generateSeed();
    setState({ ...seed, settings: DEFAULT_SETTINGS, currentUser: null });
  }, []);

  const value = useMemo<StoreContextValue>(() => ({
    ...state,
    users: DEMO_USERS,
    login, logout, addApplication, updateApplicationStatus, advanceWorkflow,
    addDocument, updateDocumentStatus, scheduleEVC, completeEVC,
    updateCompliance, markAlertRead, markAllAlertsRead, updateSettings,
    addInstitution, regenerateAlerts, resetData,
  }), [state, login, logout, addApplication, updateApplicationStatus, advanceWorkflow, addDocument, updateDocumentStatus, scheduleEVC, completeEVC, updateCompliance, markAlertRead, markAllAlertsRead, updateSettings, addInstitution, regenerateAlerts, resetData]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
