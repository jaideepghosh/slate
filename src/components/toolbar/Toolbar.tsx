import { useState } from 'react';
import {
  Plus, Save, Download, Printer, Maximize2, Minimize2,
  Sun, Moon, Monitor, ChevronDown, Loader2, Check, AlertCircle,
  FolderOpen, Copy, CheckCheck,
} from 'lucide-react';
import { useNotesStore, useUIStore } from '../../store';
import { exportContent, printContent } from '../../services/export';
import type { ExportFormat, SaveStatus, Theme } from '../../types';

interface ToolbarProps {
  onNewNote: () => void;
  onSave: () => void;
  onReconnect: () => void;
}

// Shared dropdown menu styles — rendered in a portal-like fixed position
// so they always float above the editor regardless of stacking context.
const MENU_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  background: 'var(--surface-1)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-float)',
};

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { icon: React.ReactNode; label: string; color: string }> = {
    saved:   { icon: <Check size={11} />,                                    label: 'Saved',   color: 'var(--success)'        },
    saving:  { icon: <Loader2 size={11} className="animate-spin" />,         label: 'Saving…', color: 'var(--text-tertiary)'  },
    unsaved: { icon: <div className="w-1.5 h-1.5 rounded-full bg-current" />, label: 'Unsaved', color: 'var(--warning)'       },
    error:   { icon: <AlertCircle size={11} />,                              label: 'Error',   color: 'var(--danger)'         },
    idle:    { icon: null,                                                   label: '',        color: 'var(--text-tertiary)'  },
  };
  const { icon, label, color } = map[status];
  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ThemeMenu() {
  const { theme, setTheme } = useUIStore();
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  const items: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: 'Light',  icon: <Sun size={13} />     },
    { value: 'dark',   label: 'Dark',   icon: <Moon size={13} />    },
    { value: 'system', label: 'System', icon: <Monitor size={13} /> },
  ];
  const current = items.find((i) => i.value === theme) ?? items[2];

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
  };

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--text-secondary)' }}
        title="Theme"
      >
        {current.icon}
        <ChevronDown size={10} />
      </button>

      {anchor && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setAnchor(null)} />
          <div
            className="rounded-xl py-1 w-32 animate-slide-up"
            style={{ ...MENU_STYLE, top: anchor.top, right: anchor.right }}
          >
            {items.map((item) => (
              <button
                key={item.value}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded-lg mx-0.5"
                style={{
                  width: 'calc(100% - 4px)',
                  color:      theme === item.value ? 'var(--accent)'       : 'var(--text-primary)',
                  background: theme === item.value ? 'var(--accent-muted)' : 'transparent',
                  fontWeight: theme === item.value ? 500 : 400,
                }}
                onClick={() => { setTheme(item.value); setAnchor(null); }}
              >
                {item.icon}
                {item.label}
                {theme === item.value && <Check size={10} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ExportMenu({ onExport }: { onExport: (fmt: ExportFormat) => void }) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: r.bottom + 6, left: r.left });
  };

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--text-secondary)' }}
        title="Download / Export"
      >
        <Download size={14} />
        <span className="hidden sm:block">Download</span>
        <ChevronDown size={10} />
      </button>

      {anchor && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setAnchor(null)} />
          <div
            className="rounded-xl py-1 w-44 animate-slide-up"
            style={{ ...MENU_STYLE, top: anchor.top, left: anchor.left }}
          >
            {(['html', 'markdown', 'text'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                className="w-full flex items-center px-3 py-1.5 text-xs rounded-lg mx-0.5 transition-colors"
                style={{ width: 'calc(100% - 4px)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => { onExport(fmt); setAnchor(null); }}
              >
                {fmt === 'html' ? 'HTML (.html)' : fmt === 'markdown' ? 'Markdown (.md)' : 'Plain Text (.txt)'}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function Toolbar({ onNewNote, onSave, onReconnect }: ToolbarProps) {
  const { currentNote, noteContent, saveStatus } = useNotesStore();
  const { isFullscreen, setFullscreen } = useUIStore();
  const [copied, setCopied] = useState(false);

  // Only show note-action buttons when a note is open and has content
  const hasNote = !!currentNote;
  const hasContent = hasNote && noteContent.replace(/<[^>]+>/g, '').trim().length > 0;

  const handleExport = (fmt: ExportFormat) => {
    if (!currentNote) return;
    exportContent(noteContent, fmt, currentNote.name);
  };

  const handlePrint = () => {
    if (!currentNote) return;
    printContent(noteContent, currentNote.name);
  };

  const handleCopy = async () => {
    if (!currentNote) return;
    try {
      const plain = new DOMParser().parseFromString(noteContent, 'text/html').body.textContent ?? '';
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plain], { type: 'text/plain' }),
          'text/html':  new Blob([noteContent], { type: 'text/html' }),
        }),
      ]);
    } catch {
      const plain = new DOMParser().parseFromString(noteContent, 'text/html').body.textContent ?? '';
      await navigator.clipboard.writeText(plain);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolbarBtn =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[var(--surface-2)]';

  return (
    <div
      className="flex items-center gap-1 px-3 flex-shrink-0 no-select"
      style={{
        height: 'var(--toolbar-height)',
        background: 'var(--surface-0)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
        // Ensure the toolbar itself sits above the editor
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* App logo */}
      <div className="flex items-center gap-2 mr-3">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)' }}
        >
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--text-primary)' }}>
          Notes
        </span>
      </div>

      <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

      {/* New Note — always visible */}
      <button
        onClick={onNewNote}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all active:scale-95"
        style={{ background: 'var(--accent)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        title="New Note (⌘N)"
      >
        <Plus size={13} />
        <span className="hidden sm:block">New Note</span>
      </button>

      {/* Note-scoped actions — only shown when a note is open */}
      {hasNote && (
        <>
          {/* Save */}
          <button
            onClick={onSave}
            disabled={saveStatus === 'saved'}
            className={`${toolbarBtn} disabled:opacity-40`}
            style={{ color: 'var(--text-secondary)' }}
            title="Save (⌘S)"
          >
            <Save size={13} />
            <span className="hidden sm:block">Save</span>
          </button>

          {/* Copy — only when there is content */}
          {hasContent && (
            <>
              <div className="w-px h-5 mx-0.5" style={{ background: 'var(--border-default)' }} />

              <button
                onClick={handleCopy}
                className={toolbarBtn}
                style={{ color: copied ? 'var(--success)' : 'var(--text-secondary)' }}
                title="Copy content to clipboard"
              >
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                <span className="hidden sm:block">{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* Download dropdown */}
              <ExportMenu onExport={handleExport} />

              {/* Print */}
              <button
                onClick={handlePrint}
                className={toolbarBtn}
                style={{ color: 'var(--text-secondary)' }}
                title="Print (⌘P)"
              >
                <Printer size={14} />
                <span className="hidden sm:block">Print</span>
              </button>
            </>
          )}
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save status indicator */}
      <SaveIndicator status={saveStatus} />

      <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

      {/* Theme picker */}
      <ThemeMenu />

      {/* Change folder */}
      <button
        onClick={onReconnect}
        className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--text-tertiary)' }}
        title="Change folder"
      >
        <FolderOpen size={14} />
      </button>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(!isFullscreen)}
        className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--text-tertiary)' }}
        title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
      >
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}
