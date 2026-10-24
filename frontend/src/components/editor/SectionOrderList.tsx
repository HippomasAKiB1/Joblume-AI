import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { moveItemUp, moveItemDown } from '../../utils/sectionOrder';

interface SectionOrderListProps {
  order: string[];
  onChange: (updatedOrder: string[]) => void;
}

const sectionLabels: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills & Tech Stack',
  projects: 'Key Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  awards: 'Honors & Awards',
  custom_sections: 'Custom Sections',
};

interface SortableItemProps {
  id: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  total,
  onMoveUp,
  onMoveDown,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const label = sectionLabels[id] || id;

  return (
    <div ref={setNodeRef} style={style} className={`order-sortable-row ${isDragging ? 'is-dragging' : ''}`}>
      <div className="order-drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        <GripVertical size={16} />
      </div>

      <div className="order-item-info">
        <span className="order-index-badge">{index + 1}</span>
        <span className="order-item-label">{label}</span>
      </div>

      <div className="order-item-arrows">
        <button
          type="button"
          className="arrow-btn"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Move Up"
          aria-label={`Move ${label} Up`}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className="arrow-btn"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Move Down"
          aria-label={`Move ${label} Down`}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
};

export const SectionOrderList: React.FC<SectionOrderListProps> = ({ order, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(String(active.id));
      const newIndex = order.indexOf(String(over.id));
      onChange(arrayMove(order, oldIndex, newIndex));
    }
  };

  return (
    <div className="section-order-container">
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
        Drag to reorder sections, or use the accessible arrow buttons to shift sections up and down.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="order-items-stack">
            {order.map((sectionKey, idx) => (
              <SortableItem
                key={sectionKey}
                id={sectionKey}
                index={idx}
                total={order.length}
                onMoveUp={() => onChange(moveItemUp(order, idx))}
                onMoveDown={() => onChange(moveItemDown(order, idx))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <style>{`
        .section-order-container {
          display: flex;
          flex-direction: column;
        }
        .order-items-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .order-sortable-row {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          user-select: none;
        }
        .order-sortable-row.is-dragging {
          box-shadow: var(--shadow-md);
          border-color: var(--primary, #4f46e5);
        }
        .order-drag-handle {
          cursor: grab;
          color: var(--text-tertiary, #94a3b8);
          display: flex;
          align-items: center;
          padding: 4px;
          margin-right: 8px;
        }
        .order-drag-handle:active {
          cursor: grabbing;
        }
        .order-item-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .order-index-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary, #64748b);
          background: var(--bg-hover, #f1f5f9);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .order-item-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }
        .order-item-arrows {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .arrow-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary, #64748b);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }
        .arrow-btn:hover:not(:disabled) {
          background: var(--bg-hover, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }
        .arrow-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
