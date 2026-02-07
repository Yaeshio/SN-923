import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye } from 'lucide-react';
import { PartItem } from '@/app/types';

interface SwimlaneItemProps {
    item: PartItem & { part_number?: string };
    isOverlay?: boolean;
    onPreview: (item: any) => void;
}

export function SwimlaneItem({ item, isOverlay, onPreview }: SwimlaneItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `item-${item.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging || isOverlay ? 999 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2 select-none group relative
        ${isOverlay ? 'shadow-xl scale-105 border-blue-500 ring-2 ring-blue-200' : 'hover:border-blue-400'}
      `}
        >
            <div className="flex items-center justify-between gap-2">
                {/* Drag Handle - Mobile/Touch Target */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600 touch-none"
                >
                    <GripVertical size={16} />
                </div>

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-700">#{item.id}</span>
                        {item.storage_case && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 truncate max-w-[80px]">
                                {item.storage_case}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(item);
                    }}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                    title="詳細を見る"
                >
                    <Eye size={14} />
                </button>
            </div>

            {/* Date or extra info if needed */}
            {item.updated_at && (
                <div className="text-[10px] text-gray-400 mt-1 pl-6">
                    {new Date(item.updated_at).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}
