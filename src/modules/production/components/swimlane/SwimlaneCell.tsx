import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PartItem } from '@/src/modules/production/types';
import { ProcessStatus } from '@/src/shared/types';
import { SwimlaneItem } from './SwimlaneItem';

interface SwimlaneCellProps {
    partId: string;
    status: ProcessStatus;
    items: PartItem[];
    isLast: boolean;
    selectedIds: string[];
    onToggleSelect: (itemId: string) => void;
    onPreview: (item: any) => void;
}

export function SwimlaneCell({ partId, status, items, isLast, selectedIds, onToggleSelect, onPreview }: SwimlaneCellProps) {
    const droppableId = `container-${partId}-${status}`;
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });

    return (
        <div
            ref={setNodeRef}
            className={`
        relative w-full h-[80px] border-b border-gray-100 p-2.5 transition-colors
        ${isOver ? 'bg-blue-50/50' : 'bg-white'}
        ${isLast ? 'border-b-0' : ''}
      `}
        >
            <SortableContext
                items={items.map(i => `item-${i.id}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-2 h-full">
                    {items.map(item => (
                        <SwimlaneItem
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.includes(item.id)}
                            onToggleSelect={onToggleSelect}
                            onPreview={onPreview}
                        />
                    ))}

                    {/* Placeholder when empty */}
                    {items.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-300 font-medium border border-dashed border-gray-200 rounded px-2 py-1">
                                Drop
                            </span>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
