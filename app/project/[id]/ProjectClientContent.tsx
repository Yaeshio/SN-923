'use client';

import React, { useState, useMemo } from 'react';
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
import { Plus, FolderPlus, ChevronRight, ChevronDown, MoreHorizontal, MoveRight } from 'lucide-react';
import { CartModal } from '@/src/modules/logistics/components/CartModal';
import { PreviewModal } from '@/src/modules/production/components/PreviewModal';
import { MovePartModal } from '@/src/modules/production/components/MovePartModal';
import { Part } from '@/src/modules/inventory/types';
import { PartItem, Unit } from '@/app/types';
import { ProcessStatus } from '@/src/shared/types';
import { updateItemStatus } from '@/src/modules/production/actions/updateItemStatus';
import { SwimlaneColumn } from '@/src/modules/production/components/swimlane/SwimlaneColumn';
import { SwimlaneItem } from '@/src/modules/production/components/swimlane/SwimlaneItem';
import { PROCESSES } from '@/app/constants';
import { calculateUnitProgress } from '@/app/utils';
import { mockStore } from '@/lib/mockStore';

// --- Main Component ---

export default function ProjectClientContent({
    progressData,
    parts: initialParts,
    partItems: initialItems,
    projectId,
    initialUnits
}: {
    progressData: any[],
    parts: Part[],
    partItems: PartItem[],
    projectId: number,
    initialUnits: Unit[]
}) {
    const [units, setUnits] = useState<Unit[]>(initialUnits);
    const [parts, setParts] = useState<Part[]>(initialParts);
    const [items, setItems] = useState<PartItem[]>(() => {
        const latestItemsMap = new Map<number, PartItem>();
        initialItems.forEach(item => {
            const currentLatest = latestItemsMap.get(item.part_id);
            if (!currentLatest) {
                latestItemsMap.set(item.part_id, item);
            } else {
                const currentIdx = PROCESSES.findIndex(p => p.key === currentLatest.status);
                const newIdx = PROCESSES.findIndex(p => p.key === item.status);
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
    const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({ 'unclassified': true });

    // Unit Movement State
    const [movingPartId, setMovingPartId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAddUnit = async () => {
        const name = prompt('ユニット名を入力してください:');
        if (!name) return;
        try {
            const newUnit = await mockStore.addUnit(projectId, name);
            setUnits(prev => [...prev, newUnit]);
            setExpandedUnits(prev => ({ ...prev, [newUnit.id]: true }));
        } catch (error) {
            alert('ユニットの作成に失敗しました');
        }
    };

    const handleOpenMoveModal = (partId: number) => {
        setMovingPartId(partId);
    };

    const handleCloseMoveModal = () => {
        setMovingPartId(null);
    };

    const handleMovePartConfirm = async (unitId: string | null) => {
        if (!movingPartId) return;
        try {
            await mockStore.assignPartToUnit(movingPartId, unitId);
            setParts(prev => prev.map(p => p.id === movingPartId ? { ...p, unit_id: unitId } : p));

            // Expand the target unit automatically
            if (unitId) {
                setExpandedUnits(prev => ({ ...prev, [unitId]: true }));
            } else {
                setExpandedUnits(prev => ({ ...prev, 'unclassified': true }));
            }

            handleCloseMoveModal();
        } catch (error) {
            alert('ユニット移動に失敗しました');
        }
    };

    const toggleUnit = (unitId: string) => {
        setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
    };

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
            const partsList = overIdStr.split('-');
            const targetPartId = parseInt(partsList[1], 10);
            if (targetPartId !== activeItem.part_id) return;
            targetStatus = partsList.slice(2).join('-');
        } else if (overIdStr.startsWith('item-')) {
            const overItemId = parseInt(overIdStr.split('-')[1], 10);
            const overItem = items.find(i => i.id === overItemId);
            if (overItem && overItem.part_id !== activeItem.part_id) return;
            if (overItem) targetStatus = overItem.status;
        }

        if (targetStatus && targetStatus !== activeItem.status) {
            const originalStatus = activeItem.status;
            setItems(prev => prev.map(i =>
                i.id === itemId ? { ...i, status: targetStatus as ProcessStatus } : i
            ));

            const result = await updateItemStatus(itemId, targetStatus);
            if (!result.success) {
                setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: originalStatus } : i));
                alert(`Failed to update status: ${result.error}`);
            }
        }
    };

    const handleToggleSelect = (itemId: number) => {
        setSelectedIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const groupedParts = useMemo(() => {
        const groups: Record<string, Part[]> = { 'unclassified': [] };
        units.forEach(u => groups[u.id] = []);
        parts.forEach(p => {
            const uid = p.unit_id && groups[p.unit_id] ? p.unit_id : 'unclassified';
            groups[uid].push(p);
        });
        return groups;
    }, [units, parts]);

    const activeItem = activeId ? items.find(i => `item-${i.id}` === activeId) : null;
    const cartItems = items.filter(i => selectedIds.includes(i.id)).map(i => {
        const part = parts.find(p => p.id === i.part_id);
        return { id: i.id, part_number: part?.part_number || `Part-${i.part_id}`, status: i.status, count: 1 };
    });

    return (
        <div className="flex flex-col h-[75vh] bg-gray-50/50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center z-40">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <FolderPlus size={18} className="text-blue-500" />
                        工程マトリクス
                    </h2>
                    <button
                        onClick={handleAddUnit}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                        <Plus size={16} />
                        ユニットを追加
                    </button>
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Units Mode: Active
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <div className="flex w-max min-w-full relative">
                        {/* Static Legend Column */}
                        <div className="sticky left-0 z-30 w-32 md:w-44 shrink-0 bg-white border-r border-gray-200 shadow-md">
                            <div className="h-16 border-b border-gray-200 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-md">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Process Chain</span>
                            </div>
                            {PROCESSES.map((proc, index) => (
                                <div key={proc.key} className="h-[80px] border-b border-gray-100 p-3 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-4 h-4 rounded bg-gray-100 text-gray-500 text-[9px] font-black flex items-center justify-center border border-gray-200">
                                            {index + 1}
                                        </span>
                                        <div className="text-[10px] font-black text-gray-800 uppercase truncate">{proc.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grouped Columns */}
                        <div className="flex-1 flex flex-col">
                            {[...units, { id: 'unclassified', name: '未分類' } as Unit].map(unit => {
                                const unitParts = groupedParts[unit.id] || [];
                                const isExpanded = expandedUnits[unit.id];
                                const progress = calculateUnitProgress(unitParts, items);

                                return (
                                    <div key={unit.id} className="border-b border-gray-200 bg-white">
                                        {/* Unit Header */}
                                        <div
                                            className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm cursor-pointer hover:bg-gray-50/80 transition-colors shadow-sm"
                                            onClick={() => toggleUnit(unit.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                                                        {unit.name}
                                                        <span className="text-[10px] text-gray-400 font-medium">({unitParts.length} Parts)</span>
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-900">{progress}%</span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase">Ready Completion</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unit Content */}
                                        {isExpanded && (
                                            <div className="flex pl-4 pr-10 py-4 bg-gray-50/30 overflow-x-visible">
                                                {unitParts.length > 0 ? (
                                                    <div className="flex divide-x divide-gray-200/50">
                                                        {unitParts.map(part => (
                                                            <div key={part.id} className="relative group">
                                                                <SwimlaneColumn
                                                                    part={part}
                                                                    items={items.filter(i => i.part_id === part.id)}
                                                                    selectedIds={selectedIds}
                                                                    onToggleSelect={handleToggleSelect}
                                                                    onPreview={(item) => {
                                                                        const p = parts.find(pt => pt.id === item.part_id);
                                                                        setPreviewItem({ ...item, part_number: p?.part_number });
                                                                    }}
                                                                    onMove={handleOpenMoveModal}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center w-full text-gray-400 text-xs font-medium italic">
                                                        このユニットに部品は登録されていません
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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

            {movingPartId && (
                <MovePartModal
                    isOpen={!!movingPartId}
                    onClose={handleCloseMoveModal}
                    onMove={handleMovePartConfirm}
                    units={units}
                    currentUnitId={parts.find(p => p.id === movingPartId)?.unit_id}
                    partNumber={parts.find(p => p.id === movingPartId)?.part_number || ''}
                />
            )}
        </div>
    );
}
