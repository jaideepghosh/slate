import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { NoteFile, NoteFolder, SaveStatus, Theme, Toast, ToastType } from '../types';
import { savePreference, loadPreference } from '../services/storage/idb';

// ── Notes Store ──────────────────────────────────────────────────────────────
interface NotesState {
  currentNote: NoteFile | null;
  noteContent: string;
  savedContent: string;
  saveStatus: SaveStatus;
  noteTree: NoteFolder | null;
  setCurrentNote: (note: NoteFile | null) => void;
  setNoteContent: (content: string) => void;
  setSavedContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setNoteTree: (tree: NoteFolder | null) => void;
  updateNodeExpanded: (id: string, expanded: boolean) => void;
}

export const useNotesStore = create<NotesState>()(
  subscribeWithSelector((set) => ({
    currentNote: null,
    noteContent: '',
    savedContent: '',
    saveStatus: 'idle',
    noteTree: null,

    setCurrentNote: (note) => set({ currentNote: note }),
    setNoteContent: (content) =>
      set((state) => ({
        noteContent: content,
        saveStatus: content !== state.savedContent ? 'unsaved' : 'saved',
      })),
    setSavedContent: (content) => set({ savedContent: content, saveStatus: 'saved' }),
    setSaveStatus: (status) => set({ saveStatus: status }),
    setNoteTree: (tree) => set({ noteTree: tree }),

    updateNodeExpanded: (id, expanded) =>
      set((state) => {
        if (!state.noteTree) return state;
        const updateTree = (node: NoteFolder): NoteFolder => ({
          ...node,
          expanded: node.id === id ? expanded : node.expanded,
          children: node.children.map((child) =>
            'children' in child ? updateTree(child) : child
          ),
        });
        return { noteTree: updateTree(state.noteTree) };
      }),
  }))
);

// ── Folder Store ─────────────────────────────────────────────────────────────
interface FolderState {
  rootHandle: FileSystemDirectoryHandle | null;
  hasPermission: boolean;
  isLoading: boolean;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  setHasPermission: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
}

export const useFolderStore = create<FolderState>()((set) => ({
  rootHandle: null,
  hasPermission: false,
  isLoading: false,
  setRootHandle: (handle) => set({ rootHandle: handle }),
  setHasPermission: (v) => set({ hasPermission: v }),
  setIsLoading: (v) => set({ isLoading: v }),
}));

// ── UI Store ─────────────────────────────────────────────────────────────────
interface UIState {
  sidebarWidth: number;
  theme: Theme;
  isFullscreen: boolean;
  searchQuery: string;
  toasts: Toast[];
  setSidebarWidth: (w: number) => void;
  setTheme: (t: Theme) => void;
  setFullscreen: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  initTheme: () => Promise<void>;
}

export const useUIStore = create<UIState>()((set, get) => ({
  sidebarWidth: 260,
  theme: 'system',
  isFullscreen: false,
  searchQuery: '',
  toasts: [],

  setSidebarWidth: (w) => {
    set({ sidebarWidth: Math.max(180, Math.min(480, w)) });
    savePreference('sidebarWidth', w);
  },

  setTheme: (t) => {
    set({ theme: t });
    savePreference('theme', t);
    applyTheme(t);
  },

  setFullscreen: (v) => set({ isFullscreen: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  addToast: (type, title, message, duration = 3500) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  initTheme: async () => {
    const saved = await loadPreference<Theme>('theme');
    const savedWidth = await loadPreference<number>('sidebarWidth');
    const theme = saved ?? 'system';
    set({
      theme,
      sidebarWidth: savedWidth ?? 260,
    });
    applyTheme(theme);
  },
}));

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { theme } = useUIStore.getState();
  if (theme === 'system') applyTheme('system');
});
