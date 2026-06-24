import { useState, useRef } from 'react';
import { ChevronRight, Folder, FolderOpen, FileText, MoreHorizontal } from 'lucide-react';
import type { NoteFile, NoteFolder, FileTreeNode, ContextMenuState } from '../../types';
import { useNotesStore } from '../../store';

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  onOpenNote: (note: NoteFile) => void;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
  selectedId?: string;
}

export function TreeNode({ node, depth, onOpenNote, onContextMenu, selectedId }: TreeNodeProps) {
  const { updateNodeExpanded } = useNotesStore();
  const isFolder = 'children' in node;
  const isSelected = selectedId === node.id;
  const folder = node as NoteFolder;

  const handleClick = () => {
    if (isFolder) {
      updateNodeExpanded(node.id, !folder.expanded);
    } else {
      onOpenNote(node as NoteFile);
    }
  };

  const indentPx = depth * 14 + 8;

  return (
    <div>
      <div
        className={`
          flex items-center gap-1.5 py-1 pr-2 cursor-pointer rounded-md mx-1 group relative
          transition-colors duration-75
          ${isSelected
            ? 'text-white'
            : 'hover:bg-[var(--surface-2)]'
          }
        `}
        style={{
          paddingLeft: indentPx,
          background: isSelected ? 'var(--accent)' : undefined,
          color: isSelected ? 'white' : 'var(--text-primary)',
        }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, node);
        }}
        role={isFolder ? 'treeitem' : 'option'}
        aria-selected={isSelected}
        aria-expanded={isFolder ? folder.expanded : undefined}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          <ChevronRight
            size={13}
            className="flex-shrink-0 transition-transform duration-150"
            style={{ transform: folder.expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          folder.expanded
            ? <FolderOpen size={14} className="flex-shrink-0 opacity-80" />
            : <Folder size={14} className="flex-shrink-0 opacity-80" />
        ) : (
          <FileText size={13} className="flex-shrink-0 opacity-70" />
        )}

        {/* Name */}
        <span
          className="text-xs font-medium flex-1 truncate leading-5"
          title={node.name}
        >
          {node.name}
        </span>

        {/* Context trigger */}
        <button
          className={`
            opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded transition-opacity
            ${isSelected ? 'hover:bg-white/20' : 'hover:bg-[var(--surface-3)]'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, node);
          }}
          aria-label="More options"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>

      {/* Children */}
      {isFolder && folder.expanded && (
        <div>
          {folder.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onOpenNote={onOpenNote}
              onContextMenu={onContextMenu}
              selectedId={selectedId}
            />
          ))}
          {folder.children.length === 0 && (
            <div
              className="text-xs py-1 mx-1"
              style={{ paddingLeft: (depth + 1) * 14 + 8 + 18, color: 'var(--text-tertiary)' }}
            >
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
  state: ContextMenuState;
  onAction: (action: string, node: FileTreeNode) => void;
  onClose: () => void;
}

export function ContextMenu({ state, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  if (!state.visible || !state.target) return null;

  const isFolder = 'children' in state.target;

  const items = isFolder
    ? [
        { label: 'New Note', action: 'new-note', shortcut: '⌘N' },
        { label: 'New Folder', action: 'new-folder' },
        null,
        { label: 'Rename', action: 'rename', shortcut: 'F2' },
        { label: 'Delete', action: 'delete', shortcut: '⌫', danger: true },
      ]
    : [
        { label: 'Rename', action: 'rename', shortcut: 'F2' },
        { label: 'Delete', action: 'delete', shortcut: '⌫', danger: true },
      ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 rounded-xl py-1 min-w-[160px] animate-slide-up"
        style={{
          left: state.x,
          top: state.y,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {items.map((item, i) =>
          item === null ? (
            <div key={i} className="my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />
          ) : (
            <button
              key={item.action}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors rounded-lg mx-0.5"
              style={{
                color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
                width: 'calc(100% - 4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.1)' : 'var(--surface-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={() => {
                onAction(item.action, state.target!);
                onClose();
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-4 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        )}
      </div>
    </>
  );
}
