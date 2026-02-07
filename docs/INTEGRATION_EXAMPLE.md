# プロジェクトページへのSTLインポート機能統合例

## 統合方法

`app/project/[id]/page.tsx` を以下のように修正して、STLインポートボタンを追加します。

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { aggregateProgress } from '@/app/utils';
import { SummaryCard } from '@/app/components/SummaryCard';
import { mockStore } from '@/lib/mockStore';
import ProjectClientContent from './ProjectClientContent';
// ↓ 追加
import ProjectPageClient from './ProjectPageClient';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectDetailPage(props: PageProps) {
    const params = await props.params;
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
        notFound();
    }

    const project = await mockStore.getProject(projectId);
    if (!project) {
        notFound();
    }

    const parts = await mockStore.getParts(projectId);
    const partItems = await mockStore.getPartItems(projectId);

    const totalInventory = partItems.length;
    const inProgress = partItems.filter(item => item.status !== 'READY').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = partItems.filter(item =>
        item.completed_at && new Date(item.completed_at) >= today
    ).length;

    const progressData = aggregateProgress(parts, partItems);

    return (
        <ProjectPageClient
            project={project}
            projectId={projectId}
            totalInventory={totalInventory}
            inProgress={inProgress}
            completedToday={completedToday}
            progressData={progressData}
            parts={parts}
            partItems={partItems}
        />
    );
}
```

## 新しいクライアントコンポーネントの作成

`app/project/[id]/ProjectPageClient.tsx` を作成:

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SummaryCard } from '@/app/components/SummaryCard';
import { StlImportModal } from '@/app/components/StlImportModal';
import ProjectClientContent from './ProjectClientContent';
import { Part, PartItem, Project } from '@/app/types';

interface ProjectPageClientProps {
    project: Project;
    projectId: number;
    totalInventory: number;
    inProgress: number;
    completedToday: number;
    progressData: any[];
    parts: Part[];
    partItems: PartItem[];
}

export default function ProjectPageClient({
    project,
    projectId,
    totalInventory,
    inProgress,
    completedToday,
    progressData,
    parts,
    partItems
}: ProjectPageClientProps) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleImportComplete = () => {
        // インポート完了後にページをリロード
        window.location.reload();
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block font-medium">
                        ← プロジェクト一覧へ戻る
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {project.name}
                    </h1>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
                <div className="flex gap-3">
                    {/* STLインポートボタン（新規追加） */}
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all"
                    >
                        📁 STLインポート
                    </button>
                    
                    <Link href={`/print?project_id=${projectId}`}>
                        <span className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer inline-block">
                            3Dプリント登録
                        </span>
                    </Link>
                </div>
            </header>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="総在庫数" value={totalInventory} />
                <SummaryCard title="仕掛品数" value={inProgress} valueColor="text-orange-500" />
                <SummaryCard title="本日完了数" value={completedToday} valueColor="text-green-500" />
            </div>

            {/* インタラクティブな一覧・カート機能 */}
            <ProjectClientContent
                progressData={progressData}
                parts={parts}
                partItems={partItems}
                projectId={projectId}
            />

            {/* STLインポートモーダル */}
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

## 変更点の説明

### 1. サーバーコンポーネントとクライアントコンポーネントの分離
- `page.tsx`: サーバーコンポーネント（データ取得のみ）
- `ProjectPageClient.tsx`: クライアントコンポーネント（UI + インタラクション）

### 2. STLインポートボタンの追加
- ヘッダー部分に緑色の「STLインポート」ボタンを追加
- クリックするとモーダルが開く

### 3. モーダルの統合
- `StlImportModal` コンポーネントをインポート
- `isImportModalOpen` ステートで表示/非表示を管理
- インポート完了後は `window.location.reload()` でページをリフレッシュ

## 使用フロー

1. ユーザーがプロジェクトページを開く
2. 「STLインポート」ボタンをクリック
3. モーダルが開き、ファイルをドラッグ&ドロップまたは選択
4. ファイル名が自動解析され、プレビュー表示
5. 初期ステータスを選択（デフォルト: CUTTING）
6. 「インポート実行」ボタンをクリック
7. Firebase Storage にアップロード + Firestore に保存
8. 完了後、ページが自動リロードされ、新しい部品が表示される

## より良い実装（オプション）

ページリロードの代わりに、SWRやReact Queryを使ってデータを再取得する方法もあります:

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

const handleImportComplete = () => {
    // Next.jsのキャッシュを無効化してリフレッシュ
    router.refresh();
};
```

この方法なら、ページ全体をリロードせずにデータのみを再取得できます。
