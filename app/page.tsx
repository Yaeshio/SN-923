import Link from 'next/link';

// --- 型定義 ---
// 各工程を表す型
type Process = 
  | 'UNPRINTED'
  | 'PRINTED'
  | 'SURFACE_TREATMENT'
  | 'CUTTING'
  | 'PAINTING'
  | 'READY';

// 部品マスターの型
interface Part {
  id: number;
  part_number: string;
}

// 部品個体の型
interface PartItem {
  id: number;
  part_id: number;
  storage_case: string;
  current_process: Process;
  completed_at: Date | null;
}

// --- ダミーデータ ---
// 部品マスターデータ
const parts: Part[] = [
  { id: 1, part_number: 'PN-001-A' },
  { id: 2, part_number: 'PN-002-B' },
  { id: 3, part_number: 'PN-003-C' },
  { id: 4, part_number: 'PN-004-A-Sub' },
];

// 部品個体データ
const partItems: PartItem[] = [
  { id: 101, part_id: 1, storage_case: 'Case-A1', current_process: 'PRINTED', completed_at: null },
  { id: 102, part_id: 1, storage_case: 'Case-A1', current_process: 'SURFACE_TREATMENT', completed_at: null },
  { id: 103, part_id: 1, storage_case: 'Case-A2', current_process: 'CUTTING', completed_at: null },
  { id: 104, part_id: 1, storage_case: 'Case-A2', current_process: 'READY', completed_at: new Date() },
  { id: 105, part_id: 2, storage_case: 'Case-B1', current_process: 'UNPRINTED', completed_at: null },
  { id: 106, part_id: 2, storage_case: 'Case-B1', current_process: 'PRINTED', completed_at: null },
  { id: 107, part_id: 2, storage_case: 'Case-B2', current_process: 'PAINTING', completed_at: null },
  { id: 108, part_id: 3, storage_case: 'Case-C1', current_process: 'READY', completed_at: new Date('2023-10-25T14:00:00Z') },
  { id: 109, part_id: 3, storage_case: 'Case-C1', current_process: 'READY', completed_at: new Date() },
  { id: 110, part_id: 4, storage_case: 'Case-D1', current_process: 'SURFACE_TREATMENT', completed_at: null },
  { id: 111, part_id: 4, storage_case: 'Case-D1', current_process: 'SURFACE_TREATMENT', completed_at: null },
];

// --- 定数 ---
// 全工程のリスト
const PROCESSES: { key: Process; name: string }[] = [
  { key: 'UNPRINTED', name: '未プリント' },
  { key: 'PRINTED', name: 'プリント済み' },
  { key: 'SURFACE_TREATMENT', name: '表面処理' },
  { key: 'CUTTING', name: '切削' },
  { key: 'PAINTING', name: '塗装' },
  { key: 'READY', name: '準備完了' },
];

// --- データ集計ロジック ---
// マトリックス表示用のデータ構造
interface ProgressData {
  part_number: string;
  storage_cases: string[];
  counts: Record<Process, number>;
}

/**
 * 部品個体データを部品番号ごとに集計する関数
 */
const aggregateProgress = (): ProgressData[] => {
  const progressMap = new Map<string, { storage_cases: Set<string>; counts: Record<Process, number> }>();

  // まず、すべての部品マスターをMapに初期設定
  parts.forEach(part => {
    progressMap.set(part.part_number, {
      storage_cases: new Set(),
      counts: {
        UNPRINTED: 0,
        PRINTED: 0,
        SURFACE_TREATMENT: 0,
        CUTTING: 0,
        PAINTING: 0,
        READY: 0,
      },
    });
  });

  // 部品個体データをループして集計
  partItems.forEach(item => {
    const part = parts.find(p => p.id === item.part_id);
    if (part) {
      const currentData = progressMap.get(part.part_number);
      if (currentData) {
        currentData.counts[item.current_process]++;
        currentData.storage_cases.add(item.storage_case);
      }
    }
  });

  // Mapから最終的な配列データを生成
  return Array.from(progressMap.entries()).map(([part_number, data]) => ({
    part_number,
    storage_cases: Array.from(data.storage_cases).sort(),
    counts: data.counts,
  }));
};

// --- メインコンポーネント ---
export default function DashboardPage() {
  // サマリーカード用のデータを計算
  const totalInventory = partItems.length;
  const inProgress = partItems.filter(item => item.current_process !== 'READY').length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = partItems.filter(item => 
    item.completed_at && new Date(item.completed_at) >= today
  ).length;

  const progressData = aggregateProgress();

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          工程進捗ダッシュボード
        </h1>
        <Link href="/print" passHref>
          <button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 ease-in-out text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            3Dプリント登録
          </button>
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
              <th className="p-4 text-lg font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 w-64 min-w-[250px]">部品番号 / 保管ケース</th>
              {PROCESSES.map(proc => (
                <th key={proc.key} className="p-4 text-lg font-semibold text-gray-700 text-center whitespace-nowrap min-w-[120px]">{proc.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {progressData.map(data => (
              <tr key={data.part_number} className="hover:bg-gray-50">
                <td className="p-4 sticky left-0 bg-white hover:bg-gray-50 z-10 border-r">
                  <div className="font-bold text-lg text-gray-900">{data.part_number}</div>
                  <div className="text-sm text-gray-500 mt-1">{data.storage_cases.join(', ')}</div>
                </td>
                {PROCESSES.map(proc => {
                  const count = data.counts[proc.key];
                  const partId = parts.find(p => p.part_number === data.part_number)?.id;
                  // 実際のアプリケーションでは、より詳細な情報を渡す必要があるかもしれません
                  const linkHref = partId ? `/item/${partId}?process=${proc.key}` : '#';

                  return (
                    <td key={proc.key} className="p-4 text-center">
                      <Link href={linkHref} passHref>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// サマリーカードコンポーネント
interface SummaryCardProps {
  title: string;
  value: number | string;
  valueColor?: string;
}

function SummaryCard({ title, value, valueColor = 'text-gray-800' }: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center">
      <div>
        <p className="text-lg text-gray-500">{title}</p>
        <p className={`text-5xl font-extrabold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
