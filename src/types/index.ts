// File System Access API types
export interface FileSystemDirectoryHandleExtended extends FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  keys(): AsyncIterableIterator<string>;
}

export type NoteFileHandle = FileSystemFileHandle;
export type FolderHandle = FileSystemDirectoryHandleExtended;

// App domain types
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'idle';
export type Theme = 'light' | 'dark' | 'system';
export type ExportFormat = 'html' | 'markdown' | 'text';

export interface NoteFile {
  id: string;
  name: string;
  path: string[];          // path segments from root
  handle: FileSystemFileHandle;
  parentHandle: FileSystemDirectoryHandle;
  lastModified?: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  path: string[];
  handle: FileSystemDirectoryHandle;
  parentHandle: FileSystemDirectoryHandle | null;
  children: (NoteFolder | NoteFile)[];
  expanded: boolean;
}

export type FileTreeNode = NoteFolder | NoteFile;

export function isFolder(node: FileTreeNode): node is NoteFolder {
  return 'children' in node;
}

export function isNote(node: FileTreeNode): node is NoteFile {
  return !('children' in node);
}

// Context menu
export type ContextMenuAction =
  | 'new-note'
  | 'new-folder'
  | 'rename'
  | 'delete'
  | 'duplicate';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  target: FileTreeNode | null;
}

// Toast notifications
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
