// mockStoreとサーバーアクションをインポート
import { mockStore } from '@/lib/mockStore'
import { updateProcess } from '@/app/actions/updateProcess'
import { consumeItem } from '@/app/actions/consumeItem'
import { PROCESSES } from '@/app/constants'
import Link from 'next/link'

// アイテム詳細ページのコンポーネント
export default async function ItemPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // 文字列IDを数値に変換
  const id = parseInt(params.id, 10);

  // mockStoreから特定の部品アイテムのデータを取得
  const data = await mockStore.getPartItem(id);

  if (!data) {
    return (
      <div className="p-8">
        <p>アイテムが見つかりませんでした (ID: {id})</p>
        <Link href="/" className="text-blue-600 underline">ダッシュボードに戻る</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-xl mt-10">
      <Link href={`/project/${data.parts.project_id}`} className="text-sm text-gray-500 hover:text-blue-600 mb-4 inline-block">
        ← プロジェクト別進捗に戻る
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        部品番号: {data.parts.part_number}
      </h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-100">
        <p className="text-lg">
          <span className="font-semibold text-gray-600">現在工程:</span>{' '}
          <span className="text-blue-700 font-bold">{data.current_process}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">保管ケース: {data.storage_case}</p>
      </div>

      <div className="space-y-8">
        {/* 工程更新フォーム */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">工程を更新する</h2>
          <form action={async (formData) => {
            'use server'
            const next = formData.get('next') as string;
            await updateProcess(id, next);
          }} className="flex gap-4">
            <select
              name="next"
              defaultValue={data.current_process}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {PROCESSES.map(proc => (
                <option key={proc.key} value={proc.key}>{proc.name}</option>
              ))}
            </select>
            <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              工程更新
            </button>
          </form>
        </section>

        <hr className="border-gray-100" />

        {/* 組み込み完了フォーム */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">このアイテムを完了にする</h2>
          <form action={async () => {
            'use server'
            await consumeItem(id);
          }}>
            <button className="w-full bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg">
              組み込み完了（在庫から除外）
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
