'use client';

import React, { useState } from 'react';
import { PROCESSES } from '@/app/constants';
import { CartModal } from '@/app/components/CartModal';
import { updateProcess } from '@/app/actions/updateProcess';
import { PreviewModal } from '@/app/components/PreviewModal'; // 新設したコンポーネント

export default function ProjectClientContent({ progressData, projectId }: { progressData: any[], projectId: number }) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);

    // プレビュー表示用のステートを追加
    const [previewPartNumber, setPreviewPartNumber] = useState<string | null>(null);

    // チェックボックス選択制御
    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // 工程を一つ進めるクイック操作
    const handleQuickForward = async (itemId: number, currentProcKey: string) => {
        const currentIndex = PROCESSES.findIndex(p => p.key === currentProcKey);
        if (currentIndex < PROCESSES.length - 1) {
            setIsUpdating(itemId);
            const nextProcess = PROCESSES[currentIndex + 1].key;
            await updateProcess(itemId, nextProcess, projectId);
            setIsUpdating(null);
        }
    };

    const cartItems = progressData
        .filter(d => selectedIds.includes(d.id))
        .map(d => ({ id: d.id, part_number: d.part_number, count: d.count }));

    return (
        <>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-24">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="sticky left-0 z-30 bg-gray-100 p-4 border-r border-gray-200 min-w-[240px] text-left">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === progressData.length && progressData.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(progressData.map(d => d.id));
                                                else setSelectedIds([]);
                                            }}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="text-sm font-bold text-gray-600 uppercase">部品番号 / 数量</span>
                                    </div>
                                </th>
                                {PROCESSES.map(proc => (
                                    <th key={proc.key} className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 min-w-[160px]">
                                        {proc.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {progressData.map(data => (
                                <tr key={data.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 p-4 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(data.id)}
                                                onChange={() => toggleSelection(data.id)}
                                                className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 cursor-pointer"
                                            />
                                            <div>
                                                {/* 部品名をクリックするとプレビューが開くように変更 */}
                                                <button
                                                    onClick={() => setPreviewPartNumber(data.part_number)}
                                                    className="font-black text-blue-600 hover:text-blue-800 hover:underline leading-none text-left transition-colors"
                                                >
                                                    {data.part_number}
                                                </button>
                                                <div className="text-xs text-gray-400 mt-2 font-bold uppercase">保管: {data.storage_cases.join(', ') || '-'}</div>
                                                <div className="mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">
                                                    QTY: {data.count}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {PROCESSES.map(proc => {
                                        const isCurrent = data.current_process === proc.key;
                                        return (
                                            <td key={proc.key} className={`p-2 border-r border-gray-100 align-middle ${isCurrent ? 'bg-blue-50/30' : ''}`}>
                                                {isCurrent && (
                                                    <div
                                                        onClick={() => handleQuickForward(data.id, proc.key)}
                                                        className={`
                                                            relative group/card cursor-pointer p-3 rounded-xl shadow-md border-b-4 transition-all duration-200 transform hover:-translate-y-1 active:scale-95
                                                            ${proc.key === 'READY'
                                                                ? 'bg-green-600 border-green-800 text-white'
                                                                : 'bg-white border-blue-600 text-blue-900'}
                                                            ${isUpdating === data.id ? 'opacity-50 animate-pulse' : ''}
                                                        `}
                                                    >
                                                        <div className="text-[10px] font-black uppercase opacity-60 mb-1">
                                                            {isUpdating === data.id ? 'Updating...' : 'Current Status'}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-sm">加工中</span>
                                                            {proc.key !== 'READY' && (
                                                                <span className="text-lg font-bold group-hover/card:translate-x-1 transition-transform">→</span>
                                                            )}
                                                        </div>
                                                        {proc.key !== 'READY' && (
                                                            <div className="absolute -bottom-10 left-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/card:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                                                クリックで次へ進む
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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

            {/* 追加：プレビューモーダル */}
            <PreviewModal
                isOpen={!!previewPartNumber}
                onClose={() => setPreviewPartNumber(null)}
                partNumber={previewPartNumber || ''}
            />
        </>
    );
}