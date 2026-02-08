'use client'

import { useState } from 'react';
import { releaseStorageCase } from '@/app/actions/storageActions';

interface Box {
    boxId: string;
    isUsed: boolean;
    itemId: number | null;
    partNumber: string | null;
    status: string | null;
}

interface StorageBoxGridProps {
    boxes: Box[];
}

export default function StorageBoxGrid({ boxes }: StorageBoxGridProps) {
    const [releasing, setReleasing] = useState<string | null>(null);

    const handleRelease = async (boxId: string, itemId: number) => {
        if (!confirm(`ボックス ${boxId} を強制解放しますか？`)) {
            return;
        }

        setReleasing(boxId);
        try {
            const result = await releaseStorageCase(itemId);
            if (result.success) {
                // revalidatePathによって自動的にページが更新される
            } else {
                alert(`解放に失敗しました: ${result.error}`);
            }
        } catch (error) {
            alert(`エラーが発生しました: ${error}`);
        } finally {
            setReleasing(null);
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {boxes.map((box) => (
                <div
                    key={box.boxId}
                    className={`
                        rounded-lg border-2 p-4 transition-all
                        ${box.isUsed
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : 'bg-gray-50 border-gray-200'
                        }
                    `}
                >
                    <div className="text-center">
                        <div className="font-bold text-lg mb-2 text-gray-800">
                            {box.boxId}
                        </div>

                        {box.isUsed ? (
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <div className="text-gray-600 font-medium">
                                        {box.partNumber}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {box.status}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRelease(box.boxId, box.itemId!)}
                                    disabled={releasing === box.boxId}
                                    className="
                                        w-full px-3 py-1.5 text-xs font-medium
                                        bg-red-500 text-white rounded
                                        hover:bg-red-600 
                                        disabled:bg-gray-400 disabled:cursor-not-allowed
                                        transition-colors
                                    "
                                >
                                    {releasing === box.boxId ? '解放中...' : '強制解放'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 py-2">
                                空き
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
