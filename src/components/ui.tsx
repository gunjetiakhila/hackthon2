import type { ReactNode } from 'react';

export function Badge({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{message}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition';

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md' | 'lg'; } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-blue-900 hover:bg-blue-800 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} {...props}>
      {children}
    </button>
  );
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
