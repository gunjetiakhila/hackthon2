export type Role = 'institution' | 'officer' | 'evc' | 'admin';

export type ApplicationStatus =
  | 'submitted'
  | 'under_scrutiny'
  | 'evc_scheduled'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type WorkflowStage =
  | 'submitted'
  | 'under_scrutiny'
  | 'evc_scheduled'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type DocumentType =
  | 'NOC_Certificate'
  | 'Land_Documents'
  | 'Building_Safety_Certificate'
  | 'Faculty_List'
  | 'Affidavit'
  | 'Financial_Statement'
  | 'EOA_Report'
  | 'ISO_Certificate';

export type DocumentStatus = 'valid' | 'missing' | 'expiring' | 'expired';

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'pending';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'missing_document'
  | 'deadline_approaching'
  | 'overdue'
  | 'evc_scheduled'
  | 'status_change'
  | 'compliance_breach';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionId?: string;
  avatarColor: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: 'Engineering' | 'Management' | 'Pharmacy' | 'Architecture' | 'Polytechnic' | 'Applied Arts';
  state: string;
  city: string;
  established: number;
  director: string;
  email: string;
  phone: string;
  registeredAt: string;
}

export interface DocumentRecord {
  id: string;
  applicationId: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
  expiryDate: string | null;
  status: DocumentStatus;
  sizeKb: number;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  stage: WorkflowStage;
  action: string;
  actor: string;
  actorRole: Role;
  timestamp: string;
  notes: string;
}

export interface Application {
  id: string;
  referenceNo: string;
  institutionId: string;
  institutionName: string;
  courseName: string;
  courseType: string;
  intake: number;
  status: ApplicationStatus;
  currentStage: WorkflowStage;
  submittedAt: string;
  lastUpdated: string;
  scrutinyDeadline: string;
  evcDate: string | null;
  decisionDate: string | null;
  assignedOfficer: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

export interface EVCVisit {
  id: string;
  applicationId: string;
  referenceNo: string;
  institutionName: string;
  date: string;
  time: string;
  venue: string;
  committeeChair: string;
  members: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  report: string | null;
  recommendation: 'approve' | 'reject' | 'conditional' | null;
}

export interface ComplianceItem {
  id: string;
  applicationId: string;
  referenceNo: string;
  institutionName: string;
  category: string;
  requirement: string;
  status: ComplianceStatus;
  deadline: string;
  lastChecked: string;
  responsible: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  applicationId?: string;
  referenceNo?: string;
  createdAt: string;
  read: boolean;
  forRole: Role | 'all';
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: Role;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface WorkflowConfig {
  stages: { key: WorkflowStage; label: string; slaDays: number; responsible: Role }[];
  deadlines: {
    scrutinyDays: number;
    evcNoticeDays: number;
    reviewDays: number;
    documentExpiryWarningDays: number;
    complianceCheckIntervalDays: number;
  };
  documentRequirements: DocumentType[];
}

export interface AppSettings {
  workflow: WorkflowConfig;
  notifications: {
    emailAlerts: boolean;
    deadlineWarningDays: number;
    autoEscalate: boolean;
  };
}
