import { ProjectsList } from '@/src/modules/project/components/ProjectsList';

/**
 * プロジェクト一覧ダッシュボード
 */
export default async function ProjectsDashboardPage() {
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          BOM進捗管理システム
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          プロジェクトを選択して、部品の製造工程と進捗状況をリアルタイムで確認できます。
        </p>
      </header>

      <div className="max-w-6xl mx-auto">
        <ProjectsList />
      </div>
    </div>
  );
}
