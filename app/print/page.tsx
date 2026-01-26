'use client'; // インタラクティブな操作のためClient Componentを使用

import React, { useState } from 'react';
import Link from 'next/link';
import { parts } from '../data'; // 既存のテストデータを使用
import { PROCESSES } from '../constants'; // 工程定義を使用

export default function PrintRegistrationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<number>(parts[0]?.id || 0);
  const [quantity, setQuantity] = useState(1);
  const [targetProcess, setTargetProcess] = useState('UNPRINTED');

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // ファイル名に部品番号が含まれていれば自動選択する簡易ロジック
      const matchedPart = parts.find(p => file.name.includes(p.part_number));
      if (matchedPart) setSelectedPartId(matchedPart.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`登録シミュレーション:\n部品ID: ${selectedPartId}\n数量: ${quantity}\n状態: ${targetProcess}\nファイル: ${selectedFile?.name}`);
    // ここで将来的にサーバーアクション（createPrintedなど）を呼び出します
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ダッシュボードに戻る
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
                {parts.map(p => (
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
                    checked={targetProcess === status}
                    onChange={(e) => setTargetProcess(e.target.value)}
                    className="mr-2"
                  />
                  {PROCESSES.find(p => p.key === status)?.name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors text-lg"
          >
            プリントジョブを登録
          </button>
        </form>
      </div>
    </div>
  );
}