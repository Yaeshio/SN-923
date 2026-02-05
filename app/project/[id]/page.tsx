import Link from 'next/link';
import { notFound } from 'next/navigation';
import { aggregateProgress } from '@/app/utils';
import { SummaryCard } from '@/app/components/SummaryCard';
import { mockStore } from '@/lib/mockStore';
import ProjectClientContent from './ProjectClientContent';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

/**
 * プロジェクト別進捗ページ（サーバー側）
 */
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

    // データの取得
    const parts = await mockStore.getParts(projectId);
    const partItems = await mockStore.getPartItems(projectId);

    const totalInventory = partItems.length;
    const inProgress = partItems.filter(item => item.status !== 'READY').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = partItems.filter(item =>
        item.completed_at && new Date(item.completed_at) >= today
    ).length;

    // 表示データの集計
    const progressData = aggregateProgress(parts, partItems);

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

            {/* インタラクティブな一覧・カート機能 (クライアントコンポーネント) */}
            <ProjectClientContent
                progressData={progressData}
                partItems={partItems}
                projectId={projectId}
            />
        </div>
    );
}