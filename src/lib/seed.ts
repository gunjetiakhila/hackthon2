import type {
  Application, ApplicationStatus, Institution, DocumentRecord, EVCVisit,
  ComplianceItem, Alert, AuditEntry, User, AppSettings, WorkflowConfig,
  DocumentType, WorkflowStage, ApplicationEvent,
} from '@/types';
import { OFFICERS, EVC_CHAIRS, DOC_TYPE_LABELS } from './constants';

const INSTITUTION_NAMES = [
  ['St. Xavier Institute of Technology', 'Mumbai', 'Maharashtra', 'Engineering'],
  ['Bharat College of Management Studies', 'Pune', 'Maharashtra', 'Management'],
  ['Nalanda Pharmacy College', 'Bengaluru', 'Karnataka', 'Pharmacy'],
  ['Heritage School of Architecture', 'Chennai', 'Tamil Nadu', 'Architecture'],
  ['Sabarmati Polytechnic', 'Ahmedabad', 'Gujarat', 'Polytechnic'],
  ['Saraswati College of Engineering', 'Nagpur', 'Maharashtra', 'Engineering'],
  ['Indraprastha Institute of Management', 'New Delhi', 'Delhi', 'Management'],
  ['Coimbatore Institute of Pharmacy', 'Coimbatore', 'Tamil Nadu', 'Pharmacy'],
  ['Rajasthan School of Planning', 'Jaipur', 'Rajasthan', 'Architecture'],
  ['Ganga Polytechnic Institute', 'Lucknow', 'Uttar Pradesh', 'Polytechnic'],
  ['Sunrise Institute of Applied Arts', 'Kolkata', 'West Bengal', 'Applied Arts'],
  ['Deccan College of Engineering', 'Hyderabad', 'Telangana', 'Engineering'],
] as const;

const COURSES: [string, string, number][] = [
  ['B.Tech Computer Science', 'B.Tech', 120],
  ['MBA Finance', 'PG', 60],
  ['B.Pharm', 'UG', 100],
  ['B.Arch', 'UG', 40],
  ['Diploma Mechanical', 'Diploma', 60],
  ['B.Tech Electronics', 'B.Tech', 90],
  ['MBA HR', 'PG', 60],
  ['M.Pharm', 'PG', 30],
  ['M.Plan Urban Planning', 'PG', 20],
  ['Diploma Civil', 'Diploma', 60],
  ['BFA Applied Arts', 'UG', 40],
  ['B.Tech Information Technology', 'B.Tech', 120],
];

const STATUSES: ApplicationStatus[] = [
  'approved', 'approved', 'approved', 'approved', 'approved',
  'under_review', 'under_review', 'under_review', 'under_review',
  'evc_scheduled', 'evc_scheduled', 'evc_scheduled',
  'under_scrutiny', 'under_scrutiny', 'under_scrutiny',
  'submitted', 'submitted', 'submitted',
  'rejected', 'rejected',
  'approved',
  'under_review',
  'evc_scheduled',
  'under_scrutiny',
  'submitted',
];

const ALL_DOC_TYPES: DocumentType[] = [
  'NOC_Certificate', 'Land_Documents', 'Building_Safety_Certificate',
  'Faculty_List', 'Affidavit', 'Financial_Statement', 'EOA_Report', 'ISO_Certificate',
];

const COMPLIANCE_CATEGORIES = [
  ['Faculty', 'Minimum 1:15 faculty-student ratio'],
  ['Infrastructure', 'Minimum 2.5 acres campus area'],
  ['Library', 'Minimum 3000 reference books'],
  ['Laboratory', 'Equipment as per norms'],
  ['Finance', 'Audited financial statements'],
  ['Governance', 'Governing body constitution'],
  ['Anti-Ragging', 'Anti-ragging committee established'],
  ['Safety', 'Fire safety compliance certificate'],
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

function rand(seed: { i: number; s: number }): number {
  seed.s = (seed.s * 9301 + 49297 + seed.i * 7) % 233280;
  return seed.s / 233280;
}

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

export function generateSeed(): {
  institutions: Institution[];
  applications: Application[];
  documents: DocumentRecord[];
  evcVisits: EVCVisit[];
  compliance: ComplianceItem[];
  alerts: Alert[];
  audit: AuditEntry[];
  events: ApplicationEvent[];
} {
  const institutions: Institution[] = [];
  const applications: Application[] = [];
  const documents: DocumentRecord[] = [];
  const evcVisits: EVCVisit[] = [];
  const compliance: ComplianceItem[] = [];
  const audit: AuditEntry[] = [];
  const events: ApplicationEvent[] = [];

  const seed = { i: 0, s: 12345 };
  const next = () => { seed.i++; return rand(seed); };

  INSTITUTION_NAMES.forEach((info, i) => {
    const [name, city, state, type] = info;
    institutions.push({
      id: `inst-${i + 1}`,
      name,
      code: `AIC-${String(i + 1).padStart(4, '0')}`,
      type: type as Institution['type'],
      state,
      city,
      established: 1990 + Math.floor(next() * 30),
      director: `Dr. ${pick(['A. Desai', 'B. Mehta', 'C. Rao', 'D. Joshi', 'E. Pillai'], next())}`,
      email: `registrar@${name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}edu.in`,
      phone: `+91 ${Math.floor(next() * 900 + 100)} ${Math.floor(next() * 9000 + 1000)} ${Math.floor(next() * 9000 + 1000)}`,
      registeredAt: daysAgo(Math.floor(next() * 180 + 30)),
    });
  });

  const appStartDates = [85, 78, 70, 65, 60, 55, 48, 42, 38, 35, 32, 28, 24, 20, 18, 14, 12, 10, 50, 30, 22, 16, 8, 6, 4];

  for (let i = 0; i < 25; i++) {
    const instIdx = i % 12;
    const inst = institutions[instIdx];
    const course = COURSES[i % COURSES.length];
    const status = STATUSES[i];
    const submittedDays = appStartDates[i];
    const submittedAt = daysAgo(submittedDays);

    const currentStage: WorkflowStage = status;
    let evcDate: string | null = null;
    let decisionDate: string | null = null;
    let progress = 25;
    let lastUpdated = daysAgo(submittedDays);
    const scrutinyDeadline = daysAgo(submittedDays - 21);
    const assignedOfficer = pick(OFFICERS, next());
    const priority = next() > 0.7 ? 'high' : next() > 0.4 ? 'medium' : 'low';

    switch (status) {
      case 'submitted': progress = 10; lastUpdated = daysAgo(submittedDays); break;
      case 'under_scrutiny': progress = 30; lastUpdated = daysAgo(Math.max(1, submittedDays - 5)); break;
      case 'evc_scheduled':
        progress = 55;
        evcDate = daysFromNow(Math.floor(next() * 14 + 2));
        lastUpdated = daysAgo(Math.max(1, submittedDays - 10));
        break;
      case 'under_review': progress = 75; lastUpdated = daysAgo(Math.max(1, submittedDays - 15)); break;
      case 'approved': progress = 100; decisionDate = daysAgo(Math.floor(next() * 10)); lastUpdated = decisionDate; break;
      case 'rejected': progress = 100; decisionDate = daysAgo(Math.floor(next() * 10)); lastUpdated = decisionDate; break;
    }

    const refNo = `AICTE/${new Date().getFullYear()}/${String(1000 + i)}`;
    applications.push({
      id: `app-${i + 1}`,
      referenceNo: refNo,
      institutionId: inst.id,
      institutionName: inst.name,
      courseName: course[0],
      courseType: course[1],
      intake: course[2] as number,
      status,
      currentStage,
      submittedAt,
      lastUpdated,
      scrutinyDeadline,
      evcDate,
      decisionDate,
      assignedOfficer,
      priority,
      progress,
    });

    events.push({
      id: `ev-${i}-0`, applicationId: `app-${i + 1}`, stage: 'submitted',
      action: 'Application submitted', actor: inst.director, actorRole: 'institution',
      timestamp: submittedAt, notes: 'Initial submission by institution',
    });
    if (status !== 'submitted' && status !== 'withdrawn') {
      events.push({
        id: `ev-${i}-1`, applicationId: `app-${i + 1}`, stage: 'under_scrutiny',
        action: 'Moved to scrutiny', actor: assignedOfficer, actorRole: 'officer',
        timestamp: daysAgo(submittedDays - 3), notes: 'Documents under verification',
      });
    }
    if (status === 'evc_scheduled' || status === 'under_review' || status === 'approved' || status === 'rejected') {
      events.push({
        id: `ev-${i}-2`, applicationId: `app-${i + 1}`, stage: 'evc_scheduled',
        action: 'EVC visit scheduled', actor: assignedOfficer, actorRole: 'officer',
        timestamp: daysAgo(submittedDays - 8), notes: 'Expert visiting committee assigned',
      });
    }
    if (status === 'under_review' || status === 'approved' || status === 'rejected') {
      events.push({
        id: `ev-${i}-3`, applicationId: `app-${i + 1}`, stage: 'under_review',
        action: 'EVC report submitted', actor: pick(EVC_CHAIRS, next()), actorRole: 'evc',
        timestamp: daysAgo(submittedDays - 14), notes: 'Committee report received',
      });
    }
    if (status === 'approved') {
      events.push({
        id: `ev-${i}-4`, applicationId: `app-${i + 1}`, stage: 'approved',
        action: 'Application approved', actor: assignedOfficer, actorRole: 'officer',
        timestamp: decisionDate!, notes: 'Final approval granted',
      });
    }
    if (status === 'rejected') {
      events.push({
        id: `ev-${i}-4`, applicationId: `app-${i + 1}`, stage: 'rejected',
        action: 'Application rejected', actor: assignedOfficer, actorRole: 'officer',
        timestamp: decisionDate!, notes: 'Application does not meet norms',
      });
    }

    ALL_DOC_TYPES.forEach((dt, di) => {
      const r = next();
      let docStatus: DocumentRecord['status'];
      let expiryDate: string | null = null;
      const uploadedDays = submittedDays - Math.floor(next() * 3);
      if (i % 5 === 0 && di === 0) {
        docStatus = 'missing';
      } else if (di === 7 && i % 4 === 0) {
        docStatus = 'expired';
        expiryDate = daysAgo(15);
      } else if (di === 2 && i % 3 === 0) {
        docStatus = 'expiring';
        expiryDate = daysFromNow(20);
      } else if (r > 0.9) {
        docStatus = 'missing';
      } else {
        docStatus = 'valid';
        if (['NOC_Certificate', 'Building_Safety_Certificate', 'ISO_Certificate'].includes(dt)) {
          expiryDate = daysFromNow(Math.floor(r * 300 + 60));
        }
      }
      documents.push({
        id: `doc-${i}-${di}`,
        applicationId: `app-${i + 1}`,
        type: dt,
        name: `${DOC_TYPE_LABELS[dt]}.pdf`,
        uploadedAt: daysAgo(uploadedDays),
        expiryDate,
        status: docStatus,
        sizeKb: Math.floor(r * 2000 + 100),
      });
    });

    if (['evc_scheduled', 'under_review', 'approved', 'rejected'].includes(status)) {
      evcVisits.push({
        id: `evc-${i + 1}`,
        applicationId: `app-${i + 1}`,
        referenceNo: refNo,
        institutionName: inst.name,
        date: evcDate ?? daysAgo(submittedDays - 12),
        time: '10:30',
        venue: `${inst.name} Campus, ${inst.city}`,
        committeeChair: pick(EVC_CHAIRS, next()),
        members: [pick(EVC_CHAIRS, next()), pick(OFFICERS, next()), `Dr. ${pick(['K. Reddy', 'N. Bhat', 'R. Das', 'M. Khan', 'S. Bose'], next())}`],
        status: status === 'evc_scheduled' ? 'scheduled' : 'completed',
        report: status === 'evc_scheduled' ? null : `Committee inspected campus on ${daysAgo(submittedDays - 12).slice(0, 10)}. ${pick(['All requirements met', 'Minor deficiencies noted', 'Compliance satisfactory'], next())}.`,
        recommendation: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status === 'under_review' ? 'conditional' : null,
      });
    }

    COMPLIANCE_CATEGORIES.forEach((cat, ci) => {
      const r = next();
      let cStatus: ComplianceItem['status'];
      if (status === 'approved') cStatus = r > 0.1 ? 'compliant' : 'warning';
      else if (status === 'rejected') cStatus = r > 0.3 ? 'non_compliant' : 'warning';
      else if (['under_review', 'evc_scheduled'].includes(status)) cStatus = r > 0.5 ? 'compliant' : r > 0.2 ? 'warning' : 'pending';
      else cStatus = r > 0.6 ? 'pending' : r > 0.3 ? 'warning' : 'compliant';

      compliance.push({
        id: `comp-${i}-${ci}`,
        applicationId: `app-${i + 1}`,
        referenceNo: refNo,
        institutionName: inst.name,
        category: cat[0],
        requirement: cat[1],
        status: cStatus,
        deadline: daysAgo(submittedDays - 21 + ci * 3),
        lastChecked: daysAgo(Math.floor(next() * 10)),
        responsible: assignedOfficer,
      });
    });
  }

  const alerts: Alert[] = [];
  applications.forEach((app, i) => {
    const appDocs = documents.filter(d => d.applicationId === app.id);
    const missing = appDocs.filter(d => d.status === 'missing');
    const expired = appDocs.filter(d => d.status === 'expired');
    const expiring = appDocs.filter(d => d.status === 'expiring');

    missing.forEach((m, mi) => {
      alerts.push({
        id: `al-missing-${i}-${mi}`, type: 'missing_document', severity: 'critical',
        title: 'Missing Document', message: `${DOC_TYPE_LABELS[m.type]} is missing for ${app.referenceNo}`,
        applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(5 - mi), read: false, forRole: 'all',
      });
    });
    expired.forEach((m, mi) => {
      alerts.push({
        id: `al-expired-${i}-${mi}`, type: 'missing_document', severity: 'critical',
        title: 'Expired Document', message: `${DOC_TYPE_LABELS[m.type]} expired on ${m.expiryDate?.slice(0, 10)} for ${app.referenceNo}`,
        applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(3 - mi), read: false, forRole: 'all',
      });
    });
    expiring.forEach((m, mi) => {
      alerts.push({
        id: `al-expiring-${i}-${mi}`, type: 'deadline_approaching', severity: 'warning',
        title: 'Document Expiring Soon', message: `${DOC_TYPE_LABELS[m.type]} expires on ${m.expiryDate?.slice(0, 10)} for ${app.referenceNo}`,
        applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(2 - mi), read: false, forRole: 'all',
      });
    });

    if (['submitted', 'under_scrutiny'].includes(app.status)) {
      const deadline = new Date(app.scrutinyDeadline);
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        alerts.push({
          id: `al-overdue-${i}`, type: 'overdue', severity: 'critical',
          title: 'Scrutiny Overdue', message: `Scrutiny deadline passed for ${app.referenceNo} (${app.institutionName})`,
          applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(Math.abs(daysLeft)), read: false, forRole: 'officer',
        });
      } else if (daysLeft <= 7) {
        alerts.push({
          id: `al-dl-${i}`, type: 'deadline_approaching', severity: 'warning',
          title: 'Scrutiny Deadline Approaching', message: `Scrutiny for ${app.referenceNo} due in ${daysLeft} days`,
          applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(3), read: false, forRole: 'officer',
        });
      }
    }

    if (app.status === 'evc_scheduled' && app.evcDate) {
      const daysLeft = Math.ceil((new Date(app.evcDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `al-evc-${i}`, type: 'evc_scheduled', severity: 'info',
        title: 'EVC Visit Scheduled', message: `EVC visit for ${app.referenceNo} scheduled in ${daysLeft} days at ${app.institutionName}`,
        applicationId: app.id, referenceNo: app.referenceNo, createdAt: daysAgo(5), read: false, forRole: 'all',
      });
    }
  });

  applications.forEach((app, i) => {
    audit.push({
      id: `au-${i}-0`, timestamp: app.submittedAt, actor: institutions.find(inst => inst.id === app.institutionId)?.director || app.institutionName,
      actorRole: 'institution', action: 'Application Submitted', entity: 'Application', entityId: app.referenceNo,
      details: `New application for ${app.courseName}`, ipAddress: `192.168.${i % 255}.10`,
    });
    if (app.status !== 'submitted' && app.status !== 'withdrawn') {
      audit.push({
        id: `au-${i}-1`, timestamp: daysAgo(appStartDates[i] - 3), actor: app.assignedOfficer, actorRole: 'officer',
        action: 'Status Updated', entity: 'Application', entityId: app.referenceNo,
        details: `Status changed to "Under Scrutiny"`, ipAddress: `10.0.${i % 255}.5`,
      });
    }
    if (['under_review', 'approved', 'rejected'].includes(app.status)) {
      audit.push({
        id: `au-${i}-2`, timestamp: daysAgo(appStartDates[i] - 14), actor: pick(EVC_CHAIRS, next()), actorRole: 'evc',
        action: 'EVC Report Uploaded', entity: 'EVC Visit', entityId: `evc-${i + 1}`,
        details: `Committee report submitted for ${app.referenceNo}`, ipAddress: `10.0.${i % 255}.8`,
      });
    }
    if (app.status === 'approved' || app.status === 'rejected') {
      audit.push({
        id: `au-${i}-3`, timestamp: app.decisionDate!, actor: app.assignedOfficer, actorRole: 'officer',
        action: 'Final Decision', entity: 'Application', entityId: app.referenceNo,
        details: `Application ${app.status}`, ipAddress: `10.0.${i % 255}.5`,
      });
    }
  });

  audit.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { institutions, applications, documents, evcVisits, compliance, alerts, audit, events };
}

export const DEFAULT_WORKFLOW: WorkflowConfig = {
  stages: [
    { key: 'submitted', label: 'Submitted', slaDays: 1, responsible: 'institution' },
    { key: 'under_scrutiny', label: 'Scrutiny', slaDays: 21, responsible: 'officer' },
    { key: 'evc_scheduled', label: 'EVC Visit', slaDays: 30, responsible: 'evc' },
    { key: 'under_review', label: 'Review', slaDays: 14, responsible: 'officer' },
    { key: 'approved', label: 'Decision', slaDays: 7, responsible: 'officer' },
  ],
  deadlines: {
    scrutinyDays: 21,
    evcNoticeDays: 7,
    reviewDays: 14,
    documentExpiryWarningDays: 30,
    complianceCheckIntervalDays: 90,
  },
  documentRequirements: ALL_DOC_TYPES,
};

export const DEFAULT_SETTINGS: AppSettings = {
  workflow: DEFAULT_WORKFLOW,
  notifications: {
    emailAlerts: true,
    deadlineWarningDays: 7,
    autoEscalate: true,
  },
};

export const DEMO_USERS: User[] = [
  { id: 'u-inst', name: 'Dr. Anil Desai', email: 'institution@aicte.in', role: 'institution', institutionId: 'inst-1', avatarColor: '#2563eb' },
  { id: 'u-off', name: 'Dr. R. Sharma', email: 'officer@aicte.in', role: 'officer', avatarColor: '#0f766e' },
  { id: 'u-evc', name: 'Prof. M. Krishnan', email: 'evc@aicte.in', role: 'evc', avatarColor: '#b45309' },
  { id: 'u-adm', name: 'Admin Portal', email: 'admin@aicte.in', role: 'admin', avatarColor: '#be123c' },
];
