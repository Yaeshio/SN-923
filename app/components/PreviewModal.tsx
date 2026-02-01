'use client';

import { Suspense } from 'react';
import { ModelViewer } from './ModelViewer';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    partNumber: string;
}

export function PreviewModal({ isOpen, onClose, partNumber }: PreviewModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{partNumber} の3Dプレビュー</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">&times;</button>
                </div>
                <div className="p-6">
                    {/* パスは構成に合わせて変更してください */}
                    {isOpen && partNumber && (
                        <Suspense fallback={<div className="flex justify-center items-center h-[400px] bg-gray-100 rounded-lg text-gray-500">Loading 3D Model...</div>}>
                            <ModelViewer url={`/models/${partNumber}.stl`} />
                        </Suspense>
                    )}
                    <p className="mt-4 text-sm text-gray-500 text-center">
                        ドラッグで回転、ホイールでズームできます
                    </p>
                </div>
            </div>
        </div>
    );
}