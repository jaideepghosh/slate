import { useEffect, useCallback } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { Explorer } from '../components/explorer/Explorer';
import { ResizeHandle } from '../components/explorer/ResizeHandle';
import { Editor } from '../components/editor/Editor';
import { StatusBar } from '../components/layout/StatusBar';
import { Onboarding } from '../components/layout/Onboarding';
import { ToastContainer } from '../components/common/Toast';
import { useNotesStore, useFolderStore, useUIStore } from '../store';
import { useFileTree } from '../hooks/useFileTree';
import { useAutosave } from '../hooks/useAutosave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { pickDirectory, readDirectory, verifyPermission } from '../services/filesystem';
import { saveRootHandle, loadRootHandle, clearRootHandle } from '../services/storage/idb';

export default function App() {
  const { noteTree, currentNote } = useNotesStore();
  const { rootHandle, hasPermission, isLoading, setRootHandle, setHasPermission, setIsLoading } = useFolderStore();
  const { sidebarWidth, initTheme, addToast } = useUIStore();
  const { saveNow } = useAutosave();
  const { createNote, deleteNode, renameNode, refreshTree } = useFileTree();
  const { setNoteTree } = useNotesStore();

  // Init
  useEffect(() => {
    initTheme();
    tryRestoreHandle();
  }, []);

  const tryRestoreHandle = async () => {
    setIsLoading(true);
    try {
      const handle = await loadRootHandle();
      if (!handle) return;
      const ok = await verifyPermission(handle);
      if (ok) {
        setRootHandle(handle);
        setHasPermission(true);
        const tree = await readDirectory(handle);
        setNoteTree(tree);
      } else {
        await clearRootHandle();
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFolder = async () => {
    setIsLoading(true);
    try {
      const handle = await pickDirectory();
      if (!handle) return;
      await saveRootHandle(handle);
      setRootHandle(handle);
      setHasPermission(true);
      const tree = await readDirectory(handle);
      setNoteTree(tree);
      addToast('success', `Opened "${handle.name}"`);
    } catch (err) {
      addToast('error', 'Could not open folder', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    await clearRootHandle();
    setRootHandle(null);
    setHasPermission(false);
    setNoteTree(null);
  };

  const handleNewNote = useCallback(() => {
    if (!noteTree) return;
    createNote(noteTree.handle, []);
  }, [noteTree, createNote]);

  useKeyboardShortcuts({
    onNewNote: handleNewNote,
    onSave: saveNow,
    onPrint: () => {
      if (!currentNote) return;
      import('../services/export').then(({ printContent }) => {
        printContent(useNotesStore.getState().noteContent, currentNote.name);
      });
    },
    onDelete: () => currentNote && deleteNode(currentNote),
    onRename: () => currentNote && renameNode(currentNote),
  });

  if (!hasPermission) {
    return (
      <>
        <Onboarding onChooseFolder={handleChooseFolder} isLoading={isLoading} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-0)' }}>
      {/* Toolbar — always visible (even in fullscreen the whole page is full-screen) */}
      <Toolbar
        onNewNote={handleNewNote}
        onSave={saveNow}
        onReconnect={handleReconnect}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Explorer width={sidebarWidth} />
        <ResizeHandle sidebarWidth={sidebarWidth} />

        {/* Editor */}
        <Editor />
      </div>

      {/* Status bar */}
      <StatusBar />

      <ToastContainer />
    </div>
  );
}
