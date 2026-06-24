import { useRef, useEffect, useCallback } from 'react';
import { FileText, Minimize2 } from 'lucide-react';
import { RichPad, type RichPadRef } from '@payablehq/richpad';
import '@payablehq/richpad/styles';
import type { JSONContent } from '@tiptap/react';
import { useNotesStore, useUIStore } from '../../store';
import { useAutosave } from '../../hooks/useAutosave';

export function Editor() {
  const { currentNote, noteContent, setNoteContent } = useNotesStore();
  const { theme, isFullscreen, setFullscreen } = useUIStore();
  const { saveNow } = useAutosave();
  const editorRef = useRef<RichPadRef>(null);
  const prevNoteIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedMode: 'light' | 'dark' =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;

  // Sync Zustand fullscreen state with browser Fullscreen API
  useEffect(() => {
    const el = document.documentElement;

    if (isFullscreen) {
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch(() => {
          // Fullscreen API unavailable — fall back to CSS-only mode (handled below)
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFullscreen]);

  // Keep Zustand in sync if the user presses Escape to exit browser fullscreen
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen, setFullscreen]);

  // Load note into editor when selection changes
  useEffect(() => {
    if (!editorRef.current || !currentNote) return;
    if (prevNoteIdRef.current !== currentNote.id) {
      prevNoteIdRef.current = currentNote.id;
      editorRef.current.setContent(noteContent, false);
      setTimeout(() => editorRef.current?.focus('start'), 50);
    }
  }, [currentNote, noteContent]);

  const handleChange = useCallback((value: string | JSONContent) => {
    const html = typeof value === 'string' ? value : (editorRef.current?.getHTML() ?? '');
    setNoteContent(html);
  }, [setNoteContent]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!currentNote) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center h-full"
        style={{ background: 'var(--surface-0)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--surface-2)' }}
        >
          <FileText size={28} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          No note selected
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Select a note from the sidebar or create a new one
        </p>
        <div className="flex gap-4 mt-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>
            <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>⌘N</kbd>{' '}
            New note
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>⌘F</kbd>{' '}
            Search
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>F11</kbd>{' '}
            Fullscreen
          </span>
        </div>
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden notes-editor"
      style={{ background: 'var(--surface-0)', position: 'relative' }}
    >
      {/* Fullscreen exit button — only shown when fullscreen is active */}
      {isFullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg transition-opacity opacity-40 hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          title="Exit fullscreen (F11 or Esc)"
        >
          <Minimize2 size={13} />
          Exit fullscreen
        </button>
      )}

      {/* RichPad editor — no breadcrumb bar above it */}
      <div className="flex-1 overflow-y-auto">
        <RichPad
          ref={editorRef}
          content={noteContent}
          onChange={handleChange}
          placeholder="Start writing…"
          theme={{ mode: resolvedMode }}
          toolbarVariant="modern"
          outputFormat="html"
          minHeight="100%"
        />
      </div>
    </div>
  );
}
