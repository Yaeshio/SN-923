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
import { CartModal } from '@/src/modules/logistics/components/CartModal';
import { PreviewModal } from '@/src/modules/production/components/PreviewModal';
import { Part } from '@/src/modules/inventory/types';
import { PartItem } from '@/src/modules/production/types';
import { ProcessStatus } from '@/src/shared/types';
import { updateItemStatus } from '@/src/modules/production/actions/updateItemStatus';
import { SwimlaneColumn } from '@/src/modules/production/components/swimlane/SwimlaneColumn';
import { SwimlaneItem } from '@/src/modules/production/components/swimlane/SwimlaneItem';
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
    // --- Deduplicate items to ensure 1 part = 1 item in 1 status ---
    const [items, setItems] = useState<PartItem[]>(() => {
        const latestItemsMap = new Map<number, PartItem>();
        initialItems.forEach(item => {
            const currentLatest = latestItemsMap.get(item.part_id);
            if (!currentLatest) {
                latestItemsMap.set(item.part_id, item);
            } else {
                const currentIdx = PROCESSES.findIndex(p => p.key === currentLatest.status);
                const newIdx = PROCESSES.findIndex(p => p.key === item.status);
                // Keep the one furthest along in the process chain
                if (newIdx > currentIdx) {
                    latestItemsMap.set(item.part_id, item);
                }
            }
        });
        return Array.from(latestItemsMap.values());
    });

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
        const activeItem = items.find(i => i.id === itemId);
        if (!activeItem) return;

        let targetStatus: string | undefined;
        const overIdStr = over.id as string;

        if (overIdStr.startsWith('container-')) {
            const parts = overIdStr.split('-');
            const targetPartId = parseInt(parts[1], 10);

            // STRICT DND: Only allow movement within the same part column
            if (targetPartId !== activeItem.part_id) return;

            targetStatus = parts.slice(2).join('-');
        } else if (overIdStr.startsWith('item-')) {
            const overItemId = parseInt(overIdStr.split('-')[1], 10);
            const overItem = items.find(i => i.id === overItemId);

            // STRICT DND: Only allow movement within the same part column
            if (overItem && overItem.part_id !== activeItem.part_id) return;

            if (overItem) {
                targetStatus = overItem.status;
            }
        }

        if (targetStatus && targetStatus !== activeItem.status) {
            const originalStatus = activeItem.status;

            // Optimistic update
            setItems(prev => prev.map(i =>
                i.id === itemId ? { ...i, status: targetStatus as ProcessStatus } : i
            ));

            const result = await updateItemStatus(itemId, targetStatus);
            if (!result.success) {
                // Rollback
                setItems(prev => prev.map(i =>
                    i.id === itemId ? { ...i, status: originalStatus } : i
                ));
                alert(`Failed to update status: ${result.error}`);
            }
        }
    };

    const handleToggleSelect = (itemId: number) => {
        setSelectedIds(prev => prev.includes(itemId)
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]
        );
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
                status: i.status,
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
                        <div className="sticky left-0 z-30 w-32 md:w-44 shrink-0 bg-white border-r border-gray-200 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
                            <div className="h-24 border-b border-gray-200 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-md">
                                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-300 mb-1">Process</div>
                                <div className="text-[10px] font-bold text-gray-400">Step Master</div>
                            </div>
                            <div className="flex flex-col">
                                {PROCESSES.map((proc, index) => (
                                    <div
                                        key={proc.key}
                                        className="h-[80px] border-b border-gray-100 p-3 flex flex-col justify-center bg-white"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black flex items-center justify-center border border-blue-100">
                                                {index + 1}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-gray-100" />
                                        </div>
                                        <div className="text-[11px] font-black text-gray-900 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                            {proc.name}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-300 mt-1 uppercase tracking-wider">
                                            Stage 0{index + 1}
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
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
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
                                isSelected={selectedIds.includes(activeItem.id)}
                                onToggleSelect={() => { }}
                                onPreview={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Floating Cart Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {selectedIds.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                            {selectedIds.length}
                        </span>
                    )}
                </button>
            </div>

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onDownload={() => {
                    console.log('Downloading Zip for items:', selectedIds);
                    alert("Zipダウンロードを開始します");
                }}
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