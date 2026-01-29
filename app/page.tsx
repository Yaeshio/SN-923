import Link from 'next/link';
import { mockStore } from '@/lib/mockStore';

/**
 * プロジェクト一覧ダッシュボード
 */
export default async function ProjectsDashboardPage() {
  const projects = await mockStore.getProjects();

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

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <Link key={project.id} href={`/project/${project.id}`}>
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-1">
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h2>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    進行中
                  </span>
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {project.description}
                </p>

                {/* 簡易進捗表示（ダミー） */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">全体進捗</span>
                    <span className="font-bold text-blue-600">65%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full w-[65%] shadow-sm"></div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                <div className="text-sm">
                  <span className="text-gray-500">納期: </span>
                  <span className="font-semibold text-gray-800">{project.deadline}</span>
                </div>
                <span className="text-blue-600 font-bold flex items-center group-hover:translate-x-1 transition-transform">
                  詳細を見る
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}