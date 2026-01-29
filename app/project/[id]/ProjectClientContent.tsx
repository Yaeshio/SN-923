'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PROCESSES } from '@/app/constants';
import { CartModal } from '@/app/components/CartModal';

export default function ProjectClientContent({ progressData, projectId, projectName }: any) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const cartItems = progressData
        .filter((d: any) => selectedIds.includes(d.id))
        .map((d: any) => ({ id: d.id, part_number: d.part_number, count: d.count }));

    const handleDownload = () => {
        alert(`${selectedIds.length}件のファイルをZipにまとめてダウンロードを開始します（モック）`);
        setIsCartOpen(false);
        setSelectedIds([]);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto mb-20">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 w-12">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(progressData.map((d: any) => d.id));
                                        else setSelectedIds([]);
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                />
                            </th>
                            <th className="p-4 text-lg font-semibold text-gray-700">部品番号 / 進捗</th>
                            <th className="p-4 text-lg font-semibold text-gray-700 text-center">ステータス</th>
                            <th className="p-4 text-lg font-semibold text-gray-700">保管場所</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {progressData.map((data: any) => {
                            const processInfo = PROCESSES.find(p => p.key === data.current_process);
                            const isSelected = selectedIds.includes(data.id);

                            return (
                                <tr key={data.id} className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(data.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{data.part_number}</div>
                                        <div className="text-xs text-gray-400">数量: {data.count}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-4 py-1.5 rounded-full font-bold text-xs ${data.current_process === 'READY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {processInfo?.name || data.current_process}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {data.storage_cases.join(', ') || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/item/${data.id}`}>
                                            <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">詳細</button>
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* フローティング・カートボタン */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white border border-blue-200 shadow-2xl px-8 py-4 rounded-2xl z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <span className="text-2xl font-black text-blue-600">{selectedIds.length}</span>
                        <span className="ml-2 font-bold text-gray-600">件を選択中</span>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        カートに追加して確認
                    </button>
                </div>
            )}

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onDownload={handleDownload}
            />
        </>
    );
}