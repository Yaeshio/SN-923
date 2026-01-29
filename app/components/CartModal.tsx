'use client';

import React from 'react';

interface CartItem {
    id: number;
    part_number: string;
    count: number;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onDownload: () => void;
}

export function CartModal({ isOpen, onClose, items, onDownload }: CartModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">プリント用カート</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">カートに部品が入っていません。</p>
                    ) : (
                        <table className="w-full">
                            <thead className="text-xs text-gray-400 uppercase border-b">
                                <tr>
                                    <th className="text-left pb-2">部品番号</th>
                                    <th className="text-right pb-2">ダウンロード数量</th>
                                    <th className="text-right pb-2">ファイル名</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4 font-semibold text-gray-800">{item.part_number}</td>
                                        <td className="py-4 text-right">
                                            <input
                                                type="number"
                                                defaultValue={item.count}
                                                className="w-16 border rounded p-1 text-right"
                                            />
                                        </td>
                                        <td className="py-4 text-right text-sm text-gray-500 font-mono">
                                            {item.part_number}.stl
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-white transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={items.length === 0}
                        className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-300"
                    >
                        Zipで一括ダウンロード
                    </button>
                </div>
            </div>
        </div>
    );
}