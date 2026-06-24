import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, FolderPlus, RefreshCw, X } from 'lucide-react';
import { TreeNode, ContextMenu } from './TreeNode';
import { useNotesStore, useUIStore, useFolderStore } from '../../store';
import { useFileTree } from '../../hooks/useFileTree';
import type { FileTreeNode, ContextMenuState, NoteFile, NoteFolder } from '../../types';

interface ExplorerProps {
  width: number;
}

function filterTree(node: NoteFolder, query: string): NoteFolder {
  const lq = query.toLowerCase();
  const filteredChildren = node.children
    .map((child) => {
      if ('children' in child) {
        const filtered = filterTree(child as NoteFolder, query);
        return filtered.children.length > 0 ? { ...filtered, expanded: true } : null;
      }
      return child.name.toLowerCase().includes(lq) ? child : null;
    })
    .filter(Boolean) as FileTreeNode[];

  return { ...node, children: filteredChildren, expanded: true };
}

export function Explorer({ width }: ExplorerProps) {
  const { noteTree, currentNote } = useNotesStore();
  const { rootHandle } = useFolderStore();
  const { searchQuery, setSearchQuery } = useUIStore();
  const { openNote, createNote, createNewFolder, deleteNode, renameNode, refreshTree } = useFileTree();
  const searchRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, target: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect?.();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      target: node,
    });
  }, []);

  const handleContextAction = useCallback(async (action: string, node: FileTreeNode) => {
    const isFolder = 'children' in node;
    switch (action) {
      case 'new-note': {
        const f = node as NoteFolder;
        await createNote(f.handle, f.path);
        break;
      }
      case 'new-folder': {
        const f = node as NoteFolder;
        await createNewFolder(f.handle);
        break;
      }
      case 'rename':
        await renameNode(node);
        break;
      case 'delete':
        await deleteNode(node);
        break;
    }
  }, [createNote, createNewFolder, renameNode, deleteNode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTree();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleNewNoteInRoot = async () => {
    if (!noteTree) return;
    await createNote(noteTree.handle, []);
  };

  const displayTree = searchQuery && noteTree
    ? filterTree(noteTree, searchQuery)
    : noteTree;

  // Focus search with Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width, background: 'var(--surface-1)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Sidebar header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
        >
          {rootHandle?.name ?? 'Notes'}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-2)]"
            title="Refresh"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => noteTree && createNewFolder(noteTree.handle)}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-2)]"
            title="New Folder"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <FolderPlus size={12} />
          </button>
          <button
            onClick={handleNewNoteInRoot}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-2)]"
            title="New Note (⌘N)"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'var(--surface-2)' }}
        >
          <Search size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1" role="tree">
        {displayTree ? (
          <>
            {/* Root-level children */}
            {displayTree.children.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                onOpenNote={openNote}
                onContextMenu={handleContextMenu}
                selectedId={currentNote?.id}
              />
            ))}
            {displayTree.children.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <Plus size={18} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  No notes yet
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Click + to create your first note
                </p>
              </div>
            )}
            {displayTree.children.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No results for "{searchQuery}"
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Context menu */}
      <ContextMenu
        state={contextMenu}
        onAction={handleContextAction}
        onClose={() => setContextMenu((s) => ({ ...s, visible: false }))}
      />
    </div>
  );
}
