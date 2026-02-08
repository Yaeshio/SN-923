import React from 'react';
import { Part, PartItem } from '@/app/types';
import { PROCESSES } from '@/app/constants';
import { SwimlaneCell } from './SwimlaneCell';
import FileDownloadButton from '@/app/components/common/FileDownloadButton';

interface SwimlaneColumnProps {
    part: Part;
    items: PartItem[];
    selectedIds: number[];
    onToggleSelect: (itemId: number) => void;
    onPreview: (item: any) => void;
}

export function SwimlaneColumn({ part, items, selectedIds, onToggleSelect, onPreview }: SwimlaneColumnProps) {
    // Find the "furthest" process index that has items
    const lastActiveIndex = items.reduce((max, item) => {
        const idx = PROCESSES.findIndex(p => p.key === item.status);
        return Math.max(max, idx);
    }, -1);

    return (
        <div className="
      relative flex flex-col
      w-[85vw] md:w-64 shrink-0 snap-center
      border-r border-gray-200 bg-white
    ">
            {/* Column Header - Part Info */}
            <div className="sticky top-0 z-20 h-24 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex flex-col justify-between group-hover:bg-white transition-colors">
                <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-xs tracking-tight truncate uppercase" title={part.part_number}>
                        {part.part_number}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="text-[10px] text-gray-400 font-medium">
                        {items.length} units
                    </div>
                </div>
            </div>

            {/* Cells with Progress Line Overlay */}
            <div className="relative flex-1 bg-gray-50/30">
                {/* Vertical Progress Line (Connector) */}
                {lastActiveIndex >= 0 && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 top-0 w-[3px] -z-0"
                        style={{
                            height: `${(lastActiveIndex + 0.5) * 80}px`,
                            transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div className="h-full w-full bg-gradient-to-b from-blue-100 via-blue-200 to-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                    </div>
                )}

                {/* Status Cells */}
                <div className="flex flex-col">
                    {PROCESSES.map((proc, index) => (
                        <SwimlaneCell
                            key={proc.key}
                            partId={part.id}
                            status={proc.key}
                            items={items.filter(i => i.status === proc.key)}
                            isLast={index === PROCESSES.length - 1}
                            selectedIds={selectedIds}
                            onToggleSelect={onToggleSelect}
                            onPreview={onPreview}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
