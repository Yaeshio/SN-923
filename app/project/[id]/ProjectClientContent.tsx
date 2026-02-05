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
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PROCESSES } from '@/app/constants';
import { CartModal } from '@/app/components/CartModal';
import { PreviewModal } from '@/app/components/PreviewModal';
import { Part, PartItem } from '@/app/types';
import { updateItemStatus } from '@/app/actions/updateItemStatus';

// --- Components ---

interface DraggableItemProps {
    item: PartItem & { part_number?: string }; // part_numberはデータにある場合とない場合がある
    isOverlay?: boolean;
    onPreview: (item: any) => void;
}

function DraggableItem({ item, isOverlay, onPreview }: DraggableItemProps) {
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
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                bg-white p-2 rounded-md shadow-sm border border-gray-200 mb-2 cursor-grab active:cursor-grabbing
                hover:border-blue-400 transition-all text-xs
                ${isOverlay ? 'shadow-xl scale-105 border-blue-500' : ''}
            `}
        >
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-500">#{item.id}</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // ドラッグ動作と競合しないように
                        onPreview(item);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // 重要: ボタン押下でドラッグが始まらないようにする
                    className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100"
                >
                    詳細
                </button>
            </div>
            <div className="text-[10px] text-gray-400 truncate font-mono">
                {item.storage_case || 'No Case'}
            </div>
        </div>
    );
}

interface SwimlaneCellProps {
    partId: number;
    status: string;
    items: PartItem[];
    onPreview: (item: any) => void;
}

function SwimlaneCell({ partId, status, items, onPreview }: SwimlaneCellProps) {
    // Droppable ID: container-{partId}-{status}
    const droppableId = `container-${partId}-${status}`;
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });

    return (
        <div
            ref={setNodeRef}
            className={`
                flex-1 min-w-[140px] border-r border-gray-100 p-2 flex flex-col transition-colors
                ${isOver ? 'bg-blue-50/50' : 'bg-transparent'}
            `}
        >
            <SortableContext
                items={items.map(i => `item-${i.id}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 min-h-[60px]"> {/* 空でもドロップできるように高さを確保 */}
                    {items.map(item => (
                        <DraggableItem key={item.id} item={item} onPreview={onPreview} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

interface SwimlaneRowProps {
    part: Part;
    items: PartItem[];
    onPreview: (item: any) => void;
}

function SwimlaneRow({ part, items, onPreview }: SwimlaneRowProps) {
    return (
        <div className="flex bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-4 shrink-0">
            {/* 左端：部品情報（固定列） */}
            <div className="w-48 bg-gray-50 p-4 border-r border-gray-200 flex flex-col justify-center shrink-0">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{part.part_number}</h3>
                <p className="text-xs text-gray-500">Total: {items.length} items</p>
            </div>

            {/* 右側：工程セル（横スクロール可能領域） */}
            <div className="flex-1 flex divide-x divide-gray-100 overflow-x-auto">
                {PROCESSES.map(proc => (
                    <SwimlaneCell
                        key={proc.key}
                        partId={part.id}
                        status={proc.key}
                        items={items.filter(i => i.status === proc.key)}
                        onPreview={onPreview}
                    />
                ))}
            </div>
        </div>
    );
}

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

        // IDのパース
        // Draggable ID: item-{itemId}
        const activeIdStr = active.id as string;
        const itemId = parseInt(activeIdStr.split('-')[1], 10);

        // Droppable ID: container-{partId}-{status}
        // または Sortable Item ID: item-{itemId} (同じカラム内の並び替え時などはこれに乗ることもあるが、Droppableコンテナで受けるのが基本)

        let targetStatus: string | undefined;
        // let targetPartId: number | undefined; // 今回はstatusだけわかればよいが、厳密にはPartの一致確認も可

        const overIdStr = over.id as string;

        if (overIdStr.startsWith('container-')) {
            const parts = overIdStr.split('-');
            // container-{partId}-{status}
            // partIdが数値の場合、parts[1]は数値文字列。statusは残りの部分だが、status自体にハイフンが含まれない前提
            // statusにハイフンが含まれる場合は slice で結合が必要
            // 今回のPROCESS_STATUSESはハイフンを含まない (UNDERSCOREは含む) ので大丈夫
            targetStatus = parts[2]; // status
        } else if (overIdStr.startsWith('item-')) {
            // アイテムの上にドロップした場合、そのアイテムの親コンテナのステータスを取得する必要がある
            // items配列から検索して特定する
            const overItemId = parseInt(overIdStr.split('-')[1], 10);
            const overItem = items.find(i => i.id === overItemId);
            if (overItem) {
                targetStatus = overItem.status;
            }
        }

        if (targetStatus) {
            const item = items.find(i => i.id === itemId);
            // ステータスが変更される場合のみ処理
            if (item && item.status !== targetStatus) {
                // 楽観的UI更新
                setItems(prev => prev.map(i =>
                    i.id === itemId ? { ...i, status: targetStatus! } : i
                ));

                // サーバーアクションの呼び出し
                const result = await updateItemStatus(itemId, targetStatus);
                if (!result.success) {
                    // 失敗時はロールバック
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

    // カート機能用の計算
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
        <>
            <div className="mb-24">
                {/* ヘッダー行（工程名） */}
                <div className="flex ml-48 border-b border-gray-200 pb-2 mb-2 sticky top-0 bg-gray-50 z-10 shadow-sm">
                    {PROCESSES.map(proc => (
                        <div key={proc.key} className="flex-1 min-w-[140px] px-2 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {proc.name}
                        </div>
                    ))}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-col gap-4">
                        {parts.map(part => (
                            <SwimlaneRow
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

                    <DragOverlay>
                        {activeItem ? (
                            <DraggableItem
                                item={activeItem}
                                isOverlay
                                onPreview={() => { }}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* カートUIは一旦省略しないが、スペースの都合で簡易化する場合はここを調整 */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl z-50 shadow-xl">
                    <span className="font-bold">{selectedIds.length} items selected</span>
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
        </>
    );
}