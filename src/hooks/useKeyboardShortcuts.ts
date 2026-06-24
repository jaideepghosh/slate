import { useEffect } from 'react';
import { useUIStore } from '../store';

type ShortcutMap = {
  onNewNote?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const { setFullscreen, isFullscreen } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === 'F11') {
        e.preventDefault();
        setFullscreen(!isFullscreen);
        return;
      }

      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setFullscreen(!isFullscreen);
        return;
      }

      // Don't fire shortcuts when in an input/contenteditable (except the editor)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditorContent = target.closest('.ProseMirror') !== null;

      if (ctrl && e.key === 'n' && !isInput) {
        e.preventDefault();
        shortcuts.onNewNote?.();
      }

      if (ctrl && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
      }

      if (ctrl && e.key === 'p' && !isEditorContent) {
        e.preventDefault();
        shortcuts.onPrint?.();
      }

      if (ctrl && e.key === 'f' && !isEditorContent) {
        e.preventDefault();
        shortcuts.onSearch?.();
      }

      if (e.key === 'Delete' && !isInput && !isEditorContent) {
        shortcuts.onDelete?.();
      }

      if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        shortcuts.onRename?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, isFullscreen, setFullscreen]);
}
