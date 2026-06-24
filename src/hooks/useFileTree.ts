import { useCallback } from 'react';
import { useNotesStore, useFolderStore, useUIStore } from '../store';
import {
  readDirectory,
  readNoteContent,
  createNoteFile,
  createFolder,
  deleteEntry,
  renameEntry,
} from '../services/filesystem';
import type { NoteFile, NoteFolder, FileTreeNode } from '../types';

export function useFileTree() {
  const { noteTree, setNoteTree, setCurrentNote, setSavedContent, setNoteContent, currentNote } = useNotesStore();
  const { rootHandle } = useFolderStore();
  const { addToast } = useUIStore();

  const refreshTree = useCallback(async () => {
    if (!rootHandle) return;
    try {
      const tree = await readDirectory(rootHandle);
      setNoteTree(tree);
    } catch (err) {
      console.error('Failed to refresh tree:', err);
      addToast('error', 'Failed to read folder', (err as Error).message);
    }
  }, [rootHandle, setNoteTree, addToast]);

  const openNote = useCallback(async (note: NoteFile) => {
    try {
      const content = await readNoteContent(note.handle);
      setCurrentNote(note);
      setNoteContent(content);
      setSavedContent(content);
    } catch (err) {
      addToast('error', 'Failed to open note', (err as Error).message);
    }
  }, [setCurrentNote, setNoteContent, setSavedContent, addToast]);

  const createNote = useCallback(async (folderHandle: FileSystemDirectoryHandle, folderPath: string[]) => {
    const name = prompt('Note name:')?.trim();
    if (!name) return;
    try {
      const handle = await createNoteFile(folderHandle, name);
      await refreshTree();
      // Auto-open new note
      const note: NoteFile = {
        id: [...folderPath, `${name}.html`].join('/'),
        name,
        path: [...folderPath, `${name}.html`],
        handle,
        parentHandle: folderHandle,
      };
      await openNote(note);
      addToast('success', `Note "${name}" created`);
    } catch (err) {
      addToast('error', 'Failed to create note', (err as Error).message);
    }
  }, [refreshTree, openNote, addToast]);

  const createNewFolder = useCallback(async (parentHandle: FileSystemDirectoryHandle) => {
    const name = prompt('Folder name:')?.trim();
    if (!name) return;
    try {
      await createFolder(parentHandle, name);
      await refreshTree();
      addToast('success', `Folder "${name}" created`);
    } catch (err) {
      addToast('error', 'Failed to create folder', (err as Error).message);
    }
  }, [refreshTree, addToast]);

  const deleteNode = useCallback(async (node: FileTreeNode) => {
    const isFolder = 'children' in node;
    const label = isFolder ? 'folder' : 'note';
    const confirmed = confirm(`Delete ${label} "${node.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const fileName = isFolder ? node.name : (node as NoteFile).path[node.path.length - 1];
      const parent = (node as NoteFile).parentHandle;
      await deleteEntry(parent, fileName, isFolder);
      if (!isFolder && currentNote?.id === node.id) {
        setCurrentNote(null);
        setNoteContent('');
        setSavedContent('');
      }
      await refreshTree();
      addToast('success', `"${node.name}" deleted`);
    } catch (err) {
      addToast('error', 'Failed to delete', (err as Error).message);
    }
  }, [refreshTree, currentNote, setCurrentNote, setNoteContent, setSavedContent, addToast]);

  const renameNode = useCallback(async (node: FileTreeNode) => {
    const isFolder = 'children' in node;
    if (isFolder) {
      addToast('warning', 'Folder rename', 'Folder rename is not supported by the File System Access API. Please rename via your OS.');
      return;
    }
    const note = node as NoteFile;
    const newName = prompt('New name:', note.name)?.trim();
    if (!newName || newName === note.name) return;
    try {
      const content = await readNoteContent(note.handle);
      const fileName = note.path[note.path.length - 1];
      await renameEntry(note.parentHandle, fileName, newName, false, content);
      if (currentNote?.id === note.id) {
        setCurrentNote(null);
        setNoteContent('');
        setSavedContent('');
      }
      await refreshTree();
      addToast('success', `Renamed to "${newName}"`);
    } catch (err) {
      addToast('error', 'Failed to rename', (err as Error).message);
    }
  }, [refreshTree, currentNote, setCurrentNote, setNoteContent, setSavedContent, addToast]);

  const findFolderById = useCallback((id: string): NoteFolder | null => {
    if (!noteTree) return null;
    const search = (node: NoteFolder): NoteFolder | null => {
      if (node.id === id) return node;
      for (const child of node.children) {
        if ('children' in child) {
          const found = search(child as NoteFolder);
          if (found) return found;
        }
      }
      return null;
    };
    return search(noteTree);
  }, [noteTree]);

  return {
    noteTree,
    refreshTree,
    openNote,
    createNote,
    createNewFolder,
    deleteNode,
    renameNode,
    findFolderById,
  };
}
