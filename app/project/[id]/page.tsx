import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROCESSES } from '@/app/constants';
import { aggregateProgress } from '@/app/utils';
import { SummaryCard } from '@/app/components/SummaryCard';
import { mockStore } from '@/lib/mockStore';

interface PageProps {
    params: {
        id: string;
    };
}

/**
 * プロジェクト別進捗ページ
 */
export default async function ProjectDetailPage({ params }: PageProps) {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
        notFound();
    }

    const project = await mockStore.getProject(projectId);
    if (!project) {
        notFound();
    }

    // mockStoreからプロジェクトに属するデータを取得
    const parts = await mockStore.getParts(projectId);
    const partItems = await mockStore.getPartItems(projectId);

    const totalInventory = partItems.length;
    const inProgress = partItems.filter(item => item.current_process !== 'READY').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = partItems.filter(item =>
        item.completed_at && new Date(item.completed_at) >= today
    ).length;

    // 2. マトリックス表示用にデータを集計
    const progressData = aggregateProgress(parts, partItems);

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                        ← プロジェクト一覧へ戻る
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {project.name} - 進捗状況
                    </h1>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
                <Link href={`/print?project_id=${projectId}`}>
                    <span className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer inline-block text-lg">
                        3Dプリント登録
                    </span>
                </Link>
            </header>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="総在庫数" value={totalInventory} />
                <SummaryCard title="仕掛品数 (工程進行中)" value={inProgress} valueColor="text-orange-500" />
                <SummaryCard title="本日完了数" value={completedToday} valueColor="text-green-500" />
            </div>

            {/* 工程進捗マトリックス */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 text-lg font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 w-64 min-w-[250px]">
                                部品番号 / 保管ケース
                            </th>
                            {PROCESSES.map(proc => (
                                <th key={proc.key} className="p-4 text-lg font-semibold text-center text-gray-700 whitespace-nowrap min-w-[120px]">
                                    {proc.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {progressData.length === 0 ? (
                            <tr>
                                <td colSpan={PROCESSES.length + 1} className="p-8 text-center text-gray-500">
                                    このプロジェクトに登録されている部品はありません。
                                </td>
                            </tr>
                        ) : (
                            progressData.map(data => (
                                <tr key={data.part_number} className="hover:bg-gray-50">
                                    <td className="p-4 sticky left-0 bg-white hover:bg-gray-50 z-10 border-r">
                                        <div className="font-bold text-lg text-gray-900">{data.part_number}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {data.storage_cases.join(', ')}
                                        </div>
                                    </td>
                                    {PROCESSES.map(proc => {
                                        const count = data.counts[proc.key];
                                        const part = parts.find(p => p.part_number === data.part_number);
                                        const linkHref = part ? `/item/${part.id}?process=${proc.key}` : '#';

                                        return (
                                            <td key={proc.key} className="p-4 text-center">
                                                <Link href={linkHref}>
                                                    <div
                                                        className={`
                              text-2xl font-bold rounded-lg w-20 h-14 flex items-center justify-center mx-auto cursor-pointer
                              transition-all duration-200 transform hover:scale-110 hover:shadow-lg
                              ${count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}
                            `}
                                                    >
                                                        {count}
                                                    </div>
                                                </Link>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
