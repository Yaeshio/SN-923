'use client';

import React, { useState, useCallback } from 'react';
import { ParsedFileInfo } from '@/src/modules/inventory/types';
import { ProcessStatus } from '@/src/shared/types';

interface StlImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    onImportComplete?: () => void;
}

interface FileWithPreview {
    file: File;
    parsed: ParsedFileInfo;
}

export function StlImportModal({ isOpen, onClose, projectId, onImportComplete }: StlImportModalProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [defaultStatus, setDefaultStatus] = useState<ProcessStatus>('CUTTING');

    // ファイル名を解析してプレビューリストに追加
    const handleFiles = useCallback(async (fileList: FileList | File[]) => {
        const stlFiles = Array.from(fileList).filter(
            file => file.name.toLowerCase().endsWith('.stl')
        );

        if (stlFiles.length === 0) {
            alert('STLファイルを選択してください');
            return;
        }

        // サーバーサイドの解析関数を呼び出す
        const fileNames = stlFiles.map(f => f.name);
        const response = await fetch('/api/preview-filenames', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileNames })
        });

        const parsedInfos: ParsedFileInfo[] = await response.json();

        const filesWithPreview: FileWithPreview[] = stlFiles.map((file, index) => ({
            file,
            parsed: parsedInfos[index]
        }));

        setFiles(prev => [...prev, ...filesWithPreview]);
    }, []);

    // ドラッグ&ドロップのハンドラー
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    }, [handleFiles]);

    // ファイル選択ダイアログ
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    // ファイルを削除
    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    // インポート実行
    const handleImport = useCallback(async () => {
        if (files.length === 0) {
            alert('ファイルを選択してください');
            return;
        }

        // 無効なファイルがあるかチェック
        const invalidFiles = files.filter(f => !f.parsed.isValid);
        if (invalidFiles.length > 0) {
            const confirm = window.confirm(
                `${invalidFiles.length}件の無効なファイルがあります。有効なファイルのみインポートしますか?`
            );
            if (!confirm) return;
        }

        setIsUploading(true);
        setUploadProgress('アップロード中...');

        try {
            // ファイルをArrayBufferに変換
            const filesData = await Promise.all(
                files
                    .filter(f => f.parsed.isValid)
                    .map(async ({ file }) => ({
                        buffer: await file.arrayBuffer(),
                        name: file.name
                    }))
            );

            // サーバーアクションを呼び出す
            const response = await fetch('/api/import-stl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    defaultStatus,
                    filesData: filesData.map(fd => ({
                        name: fd.name,
                        buffer: Array.from(new Uint8Array(fd.buffer))
                    }))
                })
            });

            const results = await response.json();

            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.filter((r: any) => !r.success).length;

            setUploadProgress(`完了: ${successCount}件成功, ${failCount}件失敗`);

            setTimeout(() => {
                setFiles([]);
                setUploadProgress('');
                setIsUploading(false);
                onImportComplete?.();
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Import error:', error);
            setUploadProgress('エラーが発生しました');
            setIsUploading(false);
        }
    }, [files, projectId, defaultStatus, onImportComplete, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
                {/* ヘッダー */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-2xl font-bold text-white">STLファイルインポート</h2>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="text-white/80 hover:text-white disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ドラッグ&ドロップエリア */}
                <div className="p-6">
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                            }`}
                    >
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            STLファイルをドラッグ&ドロップ
                        </p>
                        <p className="text-sm text-gray-500 mb-4">または</p>
                        <label className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-lg">
                            ファイルを選択
                            <input
                                type="file"
                                multiple
                                accept=".stl"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    </div>

                    {/* 初期ステータス選択 */}
                    <div className="mt-6 flex items-center gap-4">
                        <label className="font-semibold text-gray-700">初期ステータス:</label>
                        <select
                            value={defaultStatus}
                            onChange={(e) => setDefaultStatus(e.target.value as ProcessStatus)}
                            disabled={isUploading}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="UNPRINTED">未プリント</option>
                            <option value="PRINTED">プリント済み</option>
                            <option value="SURFACE_TREATMENT">表面処理</option>
                            <option value="CUTTING">切削</option>
                            <option value="PAINTING">塗装</option>
                            <option value="READY">完成</option>
                        </select>
                    </div>
                </div>

                {/* プレビューリスト */}
                {files.length > 0 && (
                    <div className="px-6 pb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            抽出された部品番号 ({files.length}件)
                        </h3>
                        <div className="max-h-[40vh] overflow-y-auto border border-gray-200 rounded-xl">
                            <table className="w-full">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr className="text-xs text-gray-600 uppercase">
                                        <th className="text-left p-3">ファイル名</th>
                                        <th className="text-left p-3">部品番号</th>
                                        <th className="text-center p-3">個数</th>
                                        <th className="text-left p-3">保管ボックス</th>
                                        <th className="text-left p-3">状態</th>
                                        <th className="text-center p-3">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {files.map((fileWithPreview, index) => (
                                        <tr key={index} className={fileWithPreview.parsed.isValid ? '' : 'bg-red-50'}>
                                            <td className="p-3 text-sm font-mono text-gray-700">
                                                {fileWithPreview.file.name}
                                            </td>
                                            <td className="p-3 font-semibold text-gray-800">
                                                {fileWithPreview.parsed.partNumber || '-'}
                                            </td>
                                            <td className="p-3 text-center font-bold text-blue-600">
                                                {fileWithPreview.parsed.quantity}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {fileWithPreview.parsed.storageBoxes?.map((box, i) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 font-bold rounded border border-blue-100">
                                                            {box}
                                                        </span>
                                                    )) || '-'}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {fileWithPreview.parsed.isValid ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        ✓ 有効
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        ✗ {fileWithPreview.parsed.errorMessage}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    disabled={isUploading}
                                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    削除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* アップロード進捗 */}
                {uploadProgress && (
                    <div className="px-6 pb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-blue-800 font-semibold">{uploadProgress}</p>
                        </div>
                    </div>
                )}

                {/* フッター */}
                <div className="p-6 bg-gray-50 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={files.length === 0 || isUploading}
                        className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'インポート中...' : `インポート実行 (${files.filter(f => f.parsed.isValid).length}件)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
