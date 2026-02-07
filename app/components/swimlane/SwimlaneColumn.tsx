import React from 'react';
import { Part, PartItem } from '@/app/types';
import { PROCESSES } from '@/app/constants';
import { SwimlaneCell } from './SwimlaneCell';
import FileDownloadButton from '@/app/components/common/FileDownloadButton';

interface SwimlaneColumnProps {
    part: Part;
    items: PartItem[];
    onPreview: (item: any) => void;
}

export function SwimlaneColumn({ part, items, onPreview }: SwimlaneColumnProps) {
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
            <div className="sticky top-0 z-20 h-24 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 p-3 flex flex-col justify-between">
                <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight truncate" title={part.part_number}>
                        {part.part_number}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                        {items.length} units
                    </p>
                </div>

                <FileDownloadButton
                    storagePath={`models/${part.part_number}.stl`}
                    fileName={`${part.part_number}_model.stl`}
                    label="STL"
                    variant="outline"
                />
            </div>

            {/* Cells with Progress Line Overlay */}
            <div className="relative">
                {/* Vertical Progress Line (Connector) */}
                {lastActiveIndex >= 0 && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 top-0 w-1 bg-blue-100 -z-0"
                        style={{
                            height: `${(lastActiveIndex + 0.5) * 140}px`,
                            transition: 'height 0.3s ease-in-out'
                        }}
                    >
                        <div className="h-full w-full bg-blue-500/20 rounded-full" />
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
                            onPreview={onPreview}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
