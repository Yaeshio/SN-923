import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye } from 'lucide-react';
import { PartItem } from '@/app/types';

interface SwimlaneItemProps {
    item: PartItem & { part_number?: string };
    isOverlay?: boolean;
    isSelected?: boolean;
    onToggleSelect: (itemId: number) => void;
    onPreview: (item: any) => void;
}

export function SwimlaneItem({ item, isOverlay, isSelected, onToggleSelect, onPreview }: SwimlaneItemProps) {
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
        bg-white rounded-xl shadow-sm border p-2 select-none group relative
        ${isOverlay ? 'shadow-2xl scale-105 border-blue-500 ring-4 ring-blue-50' : 'hover:border-blue-400 hover:shadow-md'}
        ${isSelected ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-100' : 'border-gray-200'}
        transition-all duration-200
      `}
        >
            <div className="flex items-center justify-between gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 -ml-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors touch-none"
                >
                    <GripVertical size={16} />
                </div>

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-xs text-gray-900 tracking-tight">#{item.id}</span>
                            {item.storage_case && (
                                <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full truncate">
                                    {item.storage_case}
                                </span>
                            )}
                        </div>
                        {item.updated_at && (
                            <div className="text-[9px] text-gray-400 font-medium">
                                Last: {new Date(item.updated_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selection Checkbox */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelect(item.id);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </div>

                {/* Action Buttons */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(item);
                    }}
                    className="text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm bg-gray-50/50"
                    title="詳細を見る"
                >
                    <Eye size={16} />
                </button>
            </div>
        </div>
    );
}
