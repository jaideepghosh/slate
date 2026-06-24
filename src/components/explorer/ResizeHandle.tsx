import { useRef, useCallback } from 'react';
import { useUIStore } from '../../store';

interface ResizeHandleProps {
  sidebarWidth: number;
}

export function ResizeHandle({ sidebarWidth }: ResizeHandleProps) {
  const { setSidebarWidth } = useUIStore();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startX.current;
    setSidebarWidth(startWidth.current + delta);
  }, [setSidebarWidth]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth, onMouseMove, onMouseUp]);

  return (
    <div
      className="w-1 flex-shrink-0 cursor-col-resize group relative"
      style={{ background: 'var(--border-subtle)', zIndex: 10 }}
      onMouseDown={onMouseDown}
    >
      <div
        className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[var(--accent)] opacity-0 group-hover:opacity-30 transition-opacity"
      />
    </div>
  );
}
