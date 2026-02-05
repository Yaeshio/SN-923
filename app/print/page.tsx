'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { parts as allParts } from '../data'; // 既存のテストデータを使用
import { PROCESSES } from '../constants'; // 工程定義を使用
import { createPrinted } from '../actions/createPrinted';

import { Suspense } from 'react';

// ... imports remain the same

function PrintRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdStr = searchParams.get('project_id');
  const projectId = projectIdStr ? parseInt(projectIdStr) : null;

  // プロジェクトIDがあればフィルタリング
  const filteredParts = projectId
    ? allParts.filter(p => p.project_id === projectId)
    : allParts;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<number>(filteredParts[0]?.id || 0);
  const [quantity, setQuantity] = useState(1);
  const [targetStatus, setTargetStatus] = useState('PRINTED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // ファイル名に部品番号が含まれていれば自動選択する簡易ロジック
      const matchedPart = filteredParts.find(p => file.name.includes(p.part_number));
      if (matchedPart) setSelectedPartId(matchedPart.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // サーバーアクションを呼び出してモックデータを更新
      await createPrinted(
        selectedPartId,
        quantity,
        selectedFile?.name || `JOB-${Date.now()}`
      );

      const redirectPath = projectId ? `/project/${projectId}` : '/';
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      alert('エラーが発生しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backHref = projectId ? `/project/${projectId}` : '/';

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href={backHref} className="text-blue-600 hover:underline mb-2 inline-block">
            ← {projectId ? 'プロジェクト別進捗に戻る' : 'ダッシュボードに戻る'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">3Dプリント登録</h1>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* STLファイルアップロード */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".stl"
              onChange={handleFileChange}
              className="hidden"
              id="stl-upload"
            />
            <label htmlFor="stl-upload" className="cursor-pointer">
              <div className="text-gray-600">
                {selectedFile ? (
                  <span className="font-semibold text-blue-600">{selectedFile.name}</span>
                ) : (
                  "CADから出力したSTLファイルをアップロード"
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">クリックまたはドラッグ＆ドロップ</p>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 部品選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">対象部品</label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              >
                {filteredParts.map(p => (
                  <option key={p.id} value={p.id}>{p.part_number}</option>
                ))}
              </select>
            </div>

            {/* 数量入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>
          </div>

          {/* ステータス選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">登録時のステータス</label>
            <div className="flex gap-4 mt-2">
              {['UNPRINTED', 'PRINTED'].map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={targetStatus === status}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="mr-2"
                  />
                  {PROCESSES.find(p => p.key === status)?.name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isSubmitting ? '登録中...' : 'プリントジョブを登録'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PrintRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PrintRegistrationContent />
    </Suspense>
  );
}