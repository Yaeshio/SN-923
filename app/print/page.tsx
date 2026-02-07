'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROCESSES } from '../constants';
import { createPrinted } from '../actions/createPrinted';
import { parseFileName, ParsedFileInfo } from '@/lib/utils/parseFileName';
import { ProcessStatus } from '../types';

import { Suspense } from 'react';

function PrintRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdStr = searchParams.get('project_id');
  const projectId = projectIdStr ? parseInt(projectIdStr) : null;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedInfos, setParsedInfos] = useState<(ParsedFileInfo & { file: File })[]>([]);
  const [targetStatus, setTargetStatus] = useState<ProcessStatus>('PRINTED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ファイル選択時の解析処理
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const infos = selectedFiles.map(file => ({
        ...parseFileName(file.name),
        file
      }));
      setParsedInfos(infos);
    } else {
      setParsedInfos([]);
    }
  }, [selectedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !projectId) {
      alert('ファイルを選択し、プロジェクトIDを指定してください。');
      return;
    }

    const invalidFiles = parsedInfos.filter(info => !info.isValid);
    if (invalidFiles.length > 0) {
      alert('解析に失敗したファイルが含まれています。修正または削除してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      // 順次登録（並列にするとFirestoreのID採番でぶつかる可能性があるため、ここでは順次処理）
      for (const info of parsedInfos) {
        const arrayBuffer = await info.file.arrayBuffer();
        await createPrinted(
          arrayBuffer,
          info.file.name,
          projectId,
          info.quantity,
          targetStatus
        );
      }

      alert(`${parsedInfos.length} 件の部品登録が完了しました。`);
      const redirectPath = `/project/${projectId}`;
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backHref = projectId ? `/project/${projectId}` : '/';

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link href={backHref} className="text-blue-600 hover:underline mb-2 inline-block">
            ← {projectId ? 'プロジェクト別進捗に戻る' : 'ダッシュボードに戻る'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">3Dプリント一括追加登録</h1>
          <p className="text-gray-500 mt-2">STLファイル名から部品情報を自動取得して登録します。</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* STLファイルアップロード */}
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${selectedFiles.length > 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
            }`}>
            <input
              type="file"
              accept=".stl"
              onChange={handleFileChange}
              multiple
              className="hidden"
              id="stl-upload"
            />
            <label htmlFor="stl-upload" className="cursor-pointer">
              <div className="text-gray-600">
                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-600 text-lg">{selectedFiles.length} 個のファイルを選択中</p>
                    <p className="text-sm text-gray-500">クリックしてファイルを変更・追加</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="font-medium">CADから出力したSTLファイルをアップロード</p>
                    <p className="text-sm text-gray-400">複数選択が可能です（クリックまたはドラッグ＆ドロップ）</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* 解析プレビューリスト */}
          {parsedInfos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 flex justify-between items-center">
                <span>解析プレビュー</span>
                <span className="text-sm font-normal text-gray-500">{parsedInfos.length} 件</span>
              </h3>
              <div className="border rounded-lg overflow-hidden divide-y bg-gray-50">
                {parsedInfos.map((info, idx) => (
                  <div key={idx} className={`p-4 flex items-center justify-between ${info.isValid ? 'bg-white' : 'bg-red-50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">STL</span>
                        <p className="font-medium text-gray-900 truncate">{info.file.name}</p>
                      </div>
                      {info.isValid ? (
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                          <span>部品番号: <strong className="font-mono text-blue-600">{info.partNumber}</strong></span>
                          <span>個数: <strong className="text-gray-900">{info.quantity}</strong></span>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-red-600 font-medium">⚠️ {info.errorMessage}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {info.isValid ? (
                        <span className="text-green-500 text-xl">✓</span>
                      ) : (
                        <span className="text-red-500 text-xl">✕</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            {/* ステータス選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">登録後の初期ステータス</label>
              <div className="flex gap-6">
                {['UNPRINTED', 'PRINTED'].map((status) => (
                  <label key={status} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={targetStatus === status}
                      onChange={(e) => setTargetStatus(e.target.value as ProcessStatus)}
                      className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className={`text-sm font-medium transition-colors ${targetStatus === status ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-800'}`}>
                      {PROCESSES.find(p => p.key === status)?.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedFiles.length === 0 || parsedInfos.some(i => !i.isValid)}
            className={`w-full text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-xl ${isSubmitting || selectedFiles.length === 0 || parsedInfos.some(i => !i.isValid)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:transform active:scale-[0.98]'
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {selectedFiles.length} 件を登録処理中...
              </span>
            ) : `プリントジョブ ${selectedFiles.length} 件を登録実行`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PrintRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <PrintRegistrationContent />
    </Suspense>
  );
}
