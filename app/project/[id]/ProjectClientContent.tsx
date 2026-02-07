'use client';

import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CartModal } from '@/app/components/CartModal';
import { PreviewModal } from '@/app/components/PreviewModal';
import { Part, PartItem, ProcessStatus } from '@/app/types';
import { updateItemStatus } from '@/app/actions/updateItemStatus';
import { SwimlaneColumn } from '@/app/components/swimlane/SwimlaneColumn';
import { SwimlaneItem } from '@/app/components/swimlane/SwimlaneItem';
import { PROCESSES } from '@/app/constants';

// --- Main Component ---

export default function ProjectClientContent({
    progressData,
    parts,
    partItems: initialItems,
    projectId
}: {
    progressData: any[],
    parts: Part[],
    partItems: PartItem[],
    projectId: number
}) {
    const [items, setItems] = useState<PartItem[]>(initialItems);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<any | null>(null);

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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIdStr = active.id as string;
        const itemId = parseInt(activeIdStr.split('-')[1], 10);
        let targetStatus: string | undefined;
        const overIdStr = over.id as string;

        if (overIdStr.startsWith('container-')) {
            const parts = overIdStr.split('-');
            targetStatus = parts.slice(2).join('-');
        } else if (overIdStr.startsWith('item-')) {
            const overItemId = parseInt(overIdStr.split('-')[1], 10);
            const overItem = items.find(i => i.id === overItemId);
            if (overItem) {
                targetStatus = overItem.status;
            }
        }

        if (targetStatus) {
            const item = items.find(i => i.id === itemId);
            if (item && item.status !== targetStatus) {
                setItems(prev => prev.map(i =>
                    i.id === itemId ? { ...i, status: targetStatus as ProcessStatus } : i
                ));

                const result = await updateItemStatus(itemId, targetStatus);
                if (!result.success) {
                    setItems(prev => prev.map(i =>
                        i.id === itemId ? { ...i, status: item.status } : i
                    ));
                    alert(`Failed to update status: ${result.error}`);
                }
            }
        }
    };

    const activeItem = activeId
        ? items.find(i => `item-${i.id}` === activeId)
        : null;

    const cartItems = items
        .filter(i => selectedIds.includes(i.id))
        .map(i => {
            const part = parts.find(p => p.id === i.part_id);
            return {
                id: i.id,
                part_number: part?.part_number || `Part-${i.part_id}`,
                count: 1
            };
        });

    return (
        <div className="relative flex flex-col h-[75vh] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="flex w-max min-w-full">

                        {/* Legend Column */}
                        <div className="sticky left-0 z-30 w-24 md:w-40 shrink-0 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            <div className="h-24 border-b border-gray-200 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Step</span>
                            </div>
                            <div className="flex flex-col">
                                {PROCESSES.map((proc, index) => (
                                    <div
                                        key={proc.key}
                                        className="h-[140px] border-b border-gray-100 p-3 flex flex-col justify-center bg-gray-50/50"
                                    >
                                        <div className="text-[10px] font-bold text-blue-500 mb-0.5">Step 0{index + 1}</div>
                                        <div className="text-xs font-extrabold text-gray-800 leading-tight uppercase">
                                            {proc.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Parts Columns Grid */}
                        <div className="flex divide-x divide-gray-100 snap-x snap-mandatory md:snap-none">
                            {parts.map(part => (
                                <SwimlaneColumn
                                    key={part.id}
                                    part={part}
                                    items={items.filter(i => i.part_id === part.id)}
                                    onPreview={(item) => {
                                        const part = parts.find(p => p.id === item.part_id);
                                        setPreviewItem({
                                            ...item,
                                            part_number: part?.part_number
                                        });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeItem ? (
                        <div className="w-48 shadow-2xl">
                            <SwimlaneItem
                                item={{
                                    ...activeItem,
                                    part_number: parts.find(p => p.id === activeItem.part_id)?.part_number
                                }}
                                isOverlay
                                onPreview={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-black text-white px-6 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="font-bold">{selectedIds.length}</span>
                        <span>Items Selected</span>
                    </button>
                </div>
            )}

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onDownload={() => alert("Zipダウンロードを開始します")}
            />

            <PreviewModal
                isOpen={!!previewItem}
                onClose={() => setPreviewItem(null)}
                partNumber={previewItem?.part_number || ''}
                itemId={previewItem?.id}
                status={previewItem?.status}
                projectId={projectId}
            />
        </div>
    );
}