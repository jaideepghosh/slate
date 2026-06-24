import type { NoteFolder, NoteFile, FileTreeNode } from '../../types';

// Augment types for File System Access API
declare global {
  interface FileSystemHandle {
    queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  }
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
}

function generateId(path: string[]): string {
  return path.join('/');
}

export async function readDirectory(
  handle: FileSystemDirectoryHandle,
  path: string[] = [],
  parentHandle: FileSystemDirectoryHandle | null = null
): Promise<NoteFolder> {
  const children: FileTreeNode[] = [];

  for await (const entry of (handle as unknown as { values(): AsyncIterableIterator<FileSystemHandle> }).values()) {
    const name = entry.name;
    if (name.startsWith('.')) continue;

    if (entry.kind === 'directory') {
      const subFolder = await readDirectory(
        entry as FileSystemDirectoryHandle,
        [...path, name],
        handle
      );
      children.push(subFolder);
    } else if (entry.kind === 'file' && name.endsWith('.html')) {
      const noteFile: NoteFile = {
        id: generateId([...path, name]),
        name: name.replace(/\.html$/, ''),
        path: [...path, name],
        handle: entry as FileSystemFileHandle,
        parentHandle: handle,
      };
      children.push(noteFile);
    }
  }

  children.sort((a, b) => {
    const aIsFolder = 'children' in a;
    const bIsFolder = 'children' in b;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    id: generateId(path.length ? path : ['root']),
    name: handle.name,
    path,
    handle,
    parentHandle,
    children,
    expanded: path.length === 0,
  };
}

export async function readNoteContent(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}

export async function writeNoteContent(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function createNoteFile(
  folderHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle> {
  const fileName = name.endsWith('.html') ? name : `${name}.html`;
  const handle = await folderHandle.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(`<p></p>`);
  await writable.close();
  return handle;
}

export async function createFolder(
  parentHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await parentHandle.getDirectoryHandle(name, { create: true });
}

export async function deleteEntry(
  parentHandle: FileSystemDirectoryHandle,
  name: string,
  isDirectory: boolean
): Promise<void> {
  await parentHandle.removeEntry(name, { recursive: isDirectory });
}

export async function renameEntry(
  parentHandle: FileSystemDirectoryHandle,
  oldName: string,
  newName: string,
  _isDirectory: boolean,
  content?: string
): Promise<FileSystemHandle> {
  const oldFileName = oldName.endsWith('.html') ? oldName : `${oldName}.html`;
  const newFileName = newName.endsWith('.html') ? newName : `${newName}.html`;
  const newHandle = await parentHandle.getFileHandle(newFileName, { create: true });
  const writable = await newHandle.createWritable();
  await writable.write(content ?? '');
  await writable.close();
  await parentHandle.removeEntry(oldFileName);
  return newHandle;
}

export async function verifyPermission(handle: FileSystemHandle): Promise<boolean> {
  const options = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  if ((await handle.requestPermission(options)) === 'granted') return true;
  return false;
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    throw err;
  }
}
