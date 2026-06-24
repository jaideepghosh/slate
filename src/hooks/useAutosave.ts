import { useEffect, useRef, useCallback } from 'react';
import { useNotesStore } from '../store';
import { writeNoteContent } from '../services/filesystem';

const AUTOSAVE_DELAY = 2000;

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { currentNote, noteContent, saveStatus, setSaveStatus, setSavedContent } = useNotesStore();

  const save = useCallback(async () => {
    if (!currentNote || saveStatus === 'saved') return;
    setSaveStatus('saving');
    try {
      await writeNoteContent(currentNote.handle, noteContent);
      setSavedContent(noteContent);
    } catch (err) {
      console.error('Autosave failed:', err);
      setSaveStatus('error');
    }
  }, [currentNote, noteContent, saveStatus, setSaveStatus, setSavedContent]);

  // Debounced autosave on content change
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [noteContent, saveStatus, save]);

  return { saveNow: save };
}
