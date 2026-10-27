import { useMemo, useState } from 'react';
import {
  Search, Upload, FileWarning, FileCheck2, FileX2, Clock, Download,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, Badge, Button, Modal, Field, inputClass, formatDate, daysUntil, downloadCSV, EmptyState } from '@/components/ui';
import { DOC_TYPE_LABELS, DOC_STATUS_LABELS, DOC_STATUS_COLORS } from '@/lib/constants';
import type { DocumentType, DocumentStatus, DocumentRecord } from '@/types';

const DOC_TYPES = Object.keys(DOC_TYPE_LABELS) as DocumentType[];

export function DocumentsPage() {
  const { documents, applications, currentUser, addDocument } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = useMemo(() => {
    let list = documents;
    if (currentUser?.role === 'institution' && currentUser.institutionId) {
      const appIds = new Set(applications.filter(a => a.institutionId === currentUser.institutionId).map(a => a.id));
      list = list.filter(d => appIds.has(d.applicationId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || DOC_TYPE_LABELS[d.type].toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(d => d.status === statusFilter);
    return list;
  }, [documents, applications, currentUser, search, statusFilter]);

  const stats = useMemo(() => ({
    total: filtered.length,
    valid: filtered.filter(d => d.status === 'valid').length,
    missing: filtered.filter(d => d.status === 'missing').length,
    expiring: filtered.filter(d => d.status === 'expiring').length,
    expired: filtered.filter(d => d.status === 'expired').length,
  }), [filtered]);

  const handleExport = () => {
    downloadCSV('documents.csv', filtered.map(d => {
      const app = applications.find(a => a.id === d.applicationId);
      return {
        Document: d.name, Type: DOC_TYPE_LABELS[d.type], Status: DOC_STATUS_LABELS[d.status],
        Application: app?.referenceNo || d.applicationId, Institution: app?.institutionName || '',
        Uploaded: d.uploadedAt.slice(0, 10), Expiry: d.expiryDate?.slice(0, 10) || 'N/A',
      };
    }));
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Track document uploads, validation status, and expiry"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} /> Export</Button>
            <Button size="sm" onClick={() => setShowUpload(true)}><Upload size={16} /> Upload Document</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, icon: FileCheck2, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Valid', value: stats.valid, icon: FileCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Missing', value: stats.missing, icon: FileX2, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Expiring', value: stats.expiring, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Expired', value: stats.expired, icon: FileWarning, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}><s.icon size={16} className={s.color} /></div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DocumentStatus | 'all')} className={`${inputClass} sm:w-44`}>
            <option value="all">All Statuses</option>
            <option value="valid">Valid</option>
            <option value="missing">Missing</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No documents found" message="Upload documents or adjust your filters." icon={<FileCheck2 size={48} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Document</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Application</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Uploaded</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Expiry</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map(d => {
                  const app = applications.find(a => a.id === d.applicationId);
                  const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
                  return (
                    <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileCheck2 size={16} className="text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-700">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{DOC_TYPE_LABELS[d.type]}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{app?.referenceNo || '—'}</td>
                      <td className="px-4 py-3"><Badge className={DOC_STATUS_COLORS[d.status]}>{DOC_STATUS_LABELS[d.status]}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(d.uploadedAt)}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                        {d.expiryDate ? (
                          <span className={days !== null && days < 0 ? 'text-rose-600' : days !== null && days < 30 ? 'text-amber-600' : ''}>
                            {formatDate(d.expiryDate)}{days !== null && days >= 0 ? ` (${days}d)` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3"><Download size={14} className="text-slate-300 cursor-pointer hover:text-blue-500" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={addDocument} applications={applications} />}
    </div>
  );
}

function UploadModal({ onClose, onUpload, applications }: {
  onClose: () => void;
  onUpload: (doc: Omit<DocumentRecord, 'id' | 'uploadedAt' | 'status'> & { status?: DocumentStatus }) => void;
  applications: { id: string; referenceNo: string; institutionName: string }[];
}) {
  const [form, setForm] = useState({
    applicationId: applications[0]?.id || '',
    type: DOC_TYPES[0] as DocumentType,
    name: '',
    expiryDate: '',
    sizeKb: 500,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicationId || !form.name) return;
    onUpload({
      applicationId: form.applicationId,
      type: form.type,
      name: form.name,
      expiryDate: form.expiryDate || null,
      sizeKb: form.sizeKb,
      status: 'valid',
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Upload Document" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Application">
          <select value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })} className={inputClass} required>
            {applications.map(a => <option key={a.id} value={a.id}>{a.referenceNo} — {a.institutionName}</option>)}
          </select>
        </Field>
        <Field label="Document Type">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DocumentType, name: DOC_TYPE_LABELS[e.target.value as DocumentType] + '.pdf' })} className={inputClass}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="File Name">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. NOC_Certificate.pdf" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry Date (optional)">
            <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Size (KB)">
            <input type="number" value={form.sizeKb} onChange={e => setForm({ ...form, sizeKb: parseInt(e.target.value) || 0 })} className={inputClass} min={1} />
          </Field>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
          <Upload size={14} /> Demo upload — file contents are not stored. Document metadata will be saved.
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit"><Upload size={16} /> Upload</Button>
        </div>
      </form>
    </Modal>
  );
}
