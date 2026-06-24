import { FolderOpen, FileText, Zap, Shield, Wifi } from 'lucide-react';

interface OnboardingProps {
  onChooseFolder: () => void;
  isLoading: boolean;
}

export function Onboarding({ onChooseFolder, isLoading }: OnboardingProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full"
      style={{ background: 'var(--surface-0)' }}
    >
      {/* App icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-float"
        style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)' }}
      >
        <FileText size={36} className="text-white" />
      </div>

      <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Notes
      </h1>
      <p className="text-base mb-10 text-center max-w-sm" style={{ color: 'var(--text-secondary)' }}>
        Your notes live on your device. Select a folder to get started.
      </p>

      <button
        onClick={onChooseFolder}
        disabled={isLoading}
        className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 shadow-float active:scale-95"
        style={{ background: 'var(--accent)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
      >
        <FolderOpen size={16} />
        {isLoading ? 'Opening...' : 'Choose Folder'}
      </button>

      <div className="flex gap-8 mt-14">
        {[
          { icon: Zap, label: 'Instant sync', desc: 'Files saved directly to disk' },
          { icon: Shield, label: 'Private', desc: 'No cloud, no accounts' },
          { icon: Wifi, label: 'Offline', desc: 'Works without internet' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 w-28 text-center">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
              style={{ background: 'var(--accent-muted)' }}
            >
              <Icon size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
            <span className="text-xs leading-tight" style={{ color: 'var(--text-tertiary)' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
