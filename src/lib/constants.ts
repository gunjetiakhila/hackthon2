import type { ApplicationStatus, DocumentStatus, ComplianceStatus, Role, WorkflowStage, DocumentType } from '@/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  under_scrutiny: 'Under Scrutiny',
  evc_scheduled: 'EVC Scheduled',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  under_scrutiny: 'bg-amber-100 text-amber-800 border-amber-200',
  evc_scheduled: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  under_review: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const STATUS_DOT: Record<ApplicationStatus, string> = {
  submitted: 'bg-slate-400',
  under_scrutiny: 'bg-amber-500',
  evc_scheduled: 'bg-indigo-500',
  under_review: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  withdrawn: 'bg-gray-400',
};

export const STAGE_ORDER: WorkflowStage[] = [
  'submitted',
  'under_scrutiny',
  'evc_scheduled',
  'under_review',
  'approved',
];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  submitted: 'Submitted',
  under_scrutiny: 'Scrutiny',
  evc_scheduled: 'EVC Visit',
  under_review: 'Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  valid: 'Valid',
  missing: 'Missing',
  expiring: 'Expiring Soon',
  expired: 'Expired',
};

export const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  missing: 'bg-rose-100 text-rose-800 border-rose-200',
  expiring: 'bg-amber-100 text-amber-800 border-amber-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
};

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  NOC_Certificate: 'NOC Certificate',
  Land_Documents: 'Land Documents',
  Building_Safety_Certificate: 'Building Safety Certificate',
  Faculty_List: 'Faculty List',
  Affidavit: 'Affidavit',
  Financial_Statement: 'Financial Statement',
  EOA_Report: 'EOA Report',
  ISO_Certificate: 'ISO Certificate',
};

export const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  compliant: 'Compliant',
  warning: 'Warning',
  non_compliant: 'Non-Compliant',
  pending: 'Pending Review',
};

export const COMPLIANCE_COLORS: Record<ComplianceStatus, string> = {
  compliant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  non_compliant: 'bg-rose-100 text-rose-800 border-rose-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const ROLE_LABELS: Record<Role, string> = {
  institution: 'Institution',
  officer: 'AICTE Officer',
  evc: 'EVC Member',
  admin: 'Administrator',
};

export const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat',
  'Uttar Pradesh', 'West Bengal', 'Telangana', 'Rajasthan', 'Kerala',
  'Punjab', 'Haryana',
];

export const OFFICERS = [
  'Dr. R. Sharma',
  'Dr. P. Verma',
  'Ms. A. Iyer',
  'Mr. S. Nair',
];

export const EVC_CHAIRS = [
  'Prof. M. Krishnan',
  'Dr. S. Banerjee',
  'Dr. L. Fernandes',
];
