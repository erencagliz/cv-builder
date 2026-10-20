import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from './dndModifiers';
import { CSS } from '@dnd-kit/utilities';

export interface HandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
}

function Item({ id, children }: { id: string; children: (h: HandleProps, dragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`sortable${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children({ attributes, listeners, setActivatorNodeRef }, isDragging)}
    </div>
  );
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  render,
  className,
}: {
  items: T[];
  getId: (t: T) => string;
  onReorder: (next: T[]) => void;
  render: (item: T, handle: HandleProps, index: number, dragging: boolean) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        screenReaderInstructions: { draggable: 'Taşımak için boşluk tuşuna bas, oklarla yer değiştir, bırakmak için tekrar boşluk tuşuna bas.' },
        announcements: {
          onDragStart: () => 'Öğe tutuldu.',
          onDragOver: () => 'Öğe taşınıyor.',
          onDragEnd: () => 'Öğe bırakıldı.',
          onDragCancel: () => 'Taşıma iptal edildi.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((it, i) => (
            <Item key={ids[i]} id={ids[i]}>
              {(h, dragging) => render(it, h, i, dragging)}
            </Item>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({ handle, label }: { handle: HandleProps; label: string }) {
  return (
    <button type="button" className="drag-handle" ref={handle.setActivatorNodeRef} {...handle.attributes} {...handle.listeners} aria-label={label}>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
      </svg>
    </button>
  );
}
