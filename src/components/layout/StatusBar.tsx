import { useNotesStore } from '../../store';

export function StatusBar() {
  const { currentNote, noteContent, saveStatus } = useNotesStore();

  const wordCount = noteContent
    ? noteContent.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
    : 0;

  const charCount = noteContent
    ? noteContent.replace(/<[^>]+>/g, '').length
    : 0;

  return (
    <div
      className="flex items-center px-4 gap-4 flex-shrink-0 no-select"
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
      }}
    >
      {currentNote && (
        <>
          <span>{currentNote.path.join(' › ')}</span>
          <span className="ml-auto">{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span className="capitalize">{saveStatus === 'idle' ? '' : saveStatus}</span>
        </>
      )}
      {!currentNote && <span>Ready</span>}
      <span className="ml-auto text-[10px]">Notes v1.0</span>
    </div>
  );
}
