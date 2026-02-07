# STLインポート機能 使用ガイド

## 概要

STLファイルのインポート機能により、ファイル名から部品番号と個数を自動解析し、Firebase Storageへのアップロードと同時にFirestoreに部品（Part）と工程アイテム（PartItem）を自動生成します。

## 実装されたファイル

### 1. ユーティリティ
- **`lib/utils/parseFileName.ts`**: ファイル名解析エンジン

### 2. サーバーアクション
- **`app/actions/importStl.ts`**: インポート処理のサーバーアクション

### 3. UIコンポーネント
- **`app/components/StlImportModal.tsx`**: ドラッグ&ドロップ対応のインポートモーダル

### 4. APIルート
- **`app/api/preview-filenames/route.ts`**: ファイル名プレビュー用API
- **`app/api/import-stl/route.ts`**: インポート実行用API

## ファイル名フォーマット

以下のフォーマットに対応しています:

| ファイル名 | 部品番号 | 個数 |
|-----------|---------|------|
| `PART123.stl` | PART123 | 1 |
| `PART123_x5.stl` | PART123 | 5 |
| `ABC-456_X10.stl` | ABC-456 | 10 |
| `ITEM_789_x3.stl` | ITEM_789 | 3 |

### ルール
- 拡張子は `.stl` または `.STL`
- 個数指定は `_x数字` または `_X数字` の形式
- 個数指定がない場合はデフォルトで1個
- 個数の範囲は 1〜1000

## 使用方法

### プロジェクトページに組み込む例

```tsx
'use client';

import { useState } from 'react';
import { StlImportModal } from '@/app/components/StlImportModal';

export default function ProjectPage({ projectId }: { projectId: number }) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportComplete = () => {
    // インポート完了後の処理（例: データ再取得）
    window.location.reload();
  };

  return (
    <div>
      {/* インポートボタン */}
      <button
        onClick={() => setIsImportModalOpen(true)}
        className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
      >
        STLファイルをインポート
      </button>

      {/* インポートモーダル */}
      <StlImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        projectId={projectId}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
```

## 処理フロー

1. **ファイル選択/ドロップ**
   - ユーザーがSTLファイルを選択またはドラッグ&ドロップ
   - 複数ファイルの同時選択が可能

2. **プレビュー解析**
   - `/api/preview-filenames` を呼び出し
   - ファイル名から部品番号と個数を抽出
   - 解析結果をテーブル表示（有効/無効を色分け）

3. **初期ステータス選択**
   - ユーザーが初期ステータスを選択（デフォルト: CUTTING）
   - 選択肢: UNPRINTED, PRINTED, SURFACE_TREATMENT, CUTTING, PAINTING, READY

4. **インポート実行**
   - 「インポート実行」ボタンをクリック
   - `/api/import-stl` を呼び出し
   - 各ファイルに対して以下を実行:
     - Firebase Storageにアップロード（パス: `projects/{projectId}/stl/{partNumber}_{timestamp}.stl`）
     - Firestoreで部品番号を検索
     - 該当する部品がなければ新規作成
     - 指定個数分のPartItemを作成

5. **完了通知**
   - 成功/失敗件数を表示
   - `onImportComplete` コールバックを実行
   - モーダルを自動クローズ

## データ構造

### Part（部品）
```typescript
{
  id: number;
  part_number: string;  // ファイル名から抽出
  project_id: number;
}
```

### PartItem（工程アイテム）
```typescript
{
  id: number;
  part_id: number;
  storage_case: string;  // 自動生成: "AUTO-{partNumber}-{連番}"
  status: ProcessStatus;  // ユーザーが選択した初期ステータス
  completed_at: Date | null;
  updated_at: Timestamp;
}
```

## エラーハンドリング

- **無効なファイル名**: プレビュー時に赤色で表示、エラーメッセージを表示
- **アップロード失敗**: 個別にエラーを記録し、結果レポートに含める
- **重複部品番号**: 既存の部品を使用（新規作成しない）
- **ネットワークエラー**: エラーメッセージを表示し、リトライを促す

## カスタマイズ

### ファイル名パターンの拡張

`lib/utils/parseFileName.ts` の `parseFileName` 関数を編集:

```typescript
// 例: プレフィックス付きパターンに対応
const prefixPattern = /^PREFIX_(.+?)_x(\d+)$/;
```

### 初期ステータスの変更

`app/components/StlImportModal.tsx` の `defaultStatus` の初期値を変更:

```typescript
const [defaultStatus, setDefaultStatus] = useState<ProcessStatus>('PRINTED');
```

### ストレージパスのカスタマイズ

`app/actions/importStl.ts` の `storagePath` を変更:

```typescript
const storagePath = `custom/path/${partNumber}.stl`;
```

## テスト方法

1. Firebase Emulatorを起動
2. プロジェクトページを開く
3. 以下のテストファイルを準備:
   - `TEST001.stl`
   - `TEST002_x3.stl`
   - `INVALID_NAME.txt` (エラーテスト用)
4. ファイルをドラッグ&ドロップ
5. プレビューを確認
6. インポート実行
7. Firestore Emulator UIで確認:
   - `parts` コレクション
   - `partItems` コレクション
8. Storage Emulator UIでファイルを確認

## トラブルシューティング

### ファイルがアップロードされない
- Firebase Emulatorが起動しているか確認
- `lib/firebase.ts` の接続設定を確認
- ブラウザのコンソールでエラーを確認

### 部品が重複して作成される
- Firestoreのクエリが正しく動作しているか確認
- `part_number` と `project_id` の両方で検索していることを確認

### プレビューが表示されない
- `/api/preview-filenames` のレスポンスを確認
- ファイル名が `.stl` で終わっているか確認

## 今後の拡張案

- [ ] バッチインポートの進捗バー表示
- [ ] インポート履歴の記録
- [ ] ファイル名パターンのカスタム設定UI
- [ ] STLファイルのサムネイル生成
- [ ] 重複チェック時の上書き/スキップ選択
- [ ] CSVによる一括インポート
