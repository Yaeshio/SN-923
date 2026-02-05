'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PROCESSES } from '@/app/constants';
import { CartModal } from '@/app/components/CartModal';
import { PreviewModal } from '@/app/components/PreviewModal';
import { PartItem, ProcessStatus } from '@/app/types';
import { updateItemStatus } from '@/app/actions/updateItemStatus';
import { updateProcess } from '@/app/actions/updateProcess';

// --- Components ---

interface KanbanItemProps {
    item: PartItem & { part_number: string };
    isUpdating?: boolean;
    onPreview: (item: any) => void;
}

function KanbanItem({ item, isUpdating, onPreview }: KanbanItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                bg-white p-4 rounded-xl shadow-sm border-b-4 border-gray-200 mb-3 cursor-grab active:cursor-grabbing
                hover:border-blue-400 transition-all group
                ${isUpdating ? 'opacity-50 animate-pulse' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(item);
                    }}
                    className="font-black text-blue-600 hover:text-blue-800 hover:underline leading-none text-left"
                >
                    {item.part_number}
                </button>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    ID: {item.id}
                </span>
            </div>
            <div className="text-xs text-gray-500 font-bold uppercase truncate">
                CASE: {item.storage_case || '-'}
            </div>
            {item.status === 'READY' && (
                <div className="mt-2 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block">
                    READY
                </div>
            )}
        </div>
    );
}

function KanbanColumn({ id, title, items, onPreview }: { id: string, title: string, items: any[], onPreview: (item: any) => void }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div className="flex-1 min-w-[300px] bg-gray-50/50 rounded-2xl p-4 flex flex-col border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex justify-between items-center px-2">
                {title}
                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                    {items.length}
                </span>
            </h3>
            <div ref={setNodeRef} className="flex-1">
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => (
                        <KanbanItem key={item.id} item={item} onPreview={onPreview} />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-gray-300 text-xs font-bold uppercase italic">
                        Empty
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Component ---

export default function ProjectClientContent({
    progressData,
    partItems: initialItems,
    projectId
}: {
    progressData: any[],
    partItems: PartItem[],
    projectId: number
}) {
    const [items, setItems] = useState<any[]>(() => {
        // PartNumberをマッピング
        return initialItems.map(item => {
            const partInfo = progressData.find(p => p.id === item.part_id);
            return {
                ...item,
                part_number: partInfo?.part_number || `Part-${item.part_id}`
            };
        });
    });

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);
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
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const itemId = active.id as number;
        const overId = over.id as string;

        // 移動先のカラム（工程名）を特定
        const newStatus = PROCESSES.find(p => p.key === overId)?.key;

        if (newStatus) {
            const item = items.find(i => i.id === itemId);
            if (item && item.status !== newStatus) {
                // 楽観的UI更新
                setItems(prev => prev.map(i =>
                    i.id === itemId ? { ...i, status: newStatus } : i
                ));

                // サーバーアクションの呼び出し
                const result = await updateItemStatus(itemId, newStatus);
                if (!result.success) {
                    // 失敗した場合は元に戻す
                    setItems(prev => prev.map(i =>
                        i.id === itemId ? { ...i, status: item.status } : i
                    ));
                    alert(`Failed to update status: ${result.error}`);
                }
            }
        }
    };

    const cartItems = items
        .filter(d => selectedIds.includes(d.id))
        .map(d => ({ id: d.id, part_number: d.part_number, count: 1 }));

    return (
        <>
            <div className="mb-24">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                        {PROCESSES.map(proc => (
                            <KanbanColumn
                                key={proc.key}
                                id={proc.key}
                                title={proc.name}
                                items={items.filter(i => i.status === proc.key)}
                                onPreview={setPreviewItem}
                            />
                        ))}
                        {/* 不良カラムも表示 */}
                        <KanbanColumn
                            id="DEFECTIVE"
                            title="不良"
                            items={items.filter(i => i.status === 'DEFECTIVE')}
                            onPreview={setPreviewItem}
                        />
                    </div>

                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 opacity-90 scale-105">
                                <span className="font-black text-blue-600">
                                    {items.find(i => i.id === activeId)?.part_number}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* フローティングバー */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-gray-900 text-white px-8 py-4 rounded-2xl z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Selected</span>
                        <span className="text-xl font-black text-blue-400">{selectedIds.length} <span className="text-sm">Items</span></span>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-700"></div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-blue-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-400 transition-colors flex items-center gap-2"
                    >
                        カートに追加 (STL)
                    </button>
                </div>
            )}

            {/* カートモーダル */}
            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onDownload={() => alert("Zipダウンロードを開始します")}
            />

            {/* プレビューモーダル */}
            <PreviewModal
                isOpen={!!previewItem}
                onClose={() => setPreviewItem(null)}
                partNumber={previewItem?.part_number || ''}
                itemId={previewItem?.id}
                status={previewItem?.status}
                projectId={projectId}
            />
        </>
    );
}