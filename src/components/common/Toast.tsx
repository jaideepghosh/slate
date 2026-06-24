import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '../../store';
import type { Toast, ToastType } from '../../types';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} className="text-green-500 flex-shrink-0" />,
  error: <AlertCircle size={15} className="text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle size={15} className="text-yellow-500 flex-shrink-0" />,
  info: <Info size={15} className="text-blue-500 flex-shrink-0" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUIStore();

  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg animate-slide-in-right"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-toast)',
        minWidth: 240,
        maxWidth: 360,
      }}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
