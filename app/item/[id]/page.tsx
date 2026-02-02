import { mockStore } from '@/lib/mockStore'
import { updateProcess } from '@/app/actions/updateProcess'
import { consumeItem } from '@/app/actions/consumeItem'
import { reportDefect } from '@/app/actions/reportDefect' // アクションをインポート
import { PROCESSES } from '@/app/constants'
import Link from 'next/link'

export default async function ItemPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  const data = await mockStore.getPartItem(id);

  if (!data) {
    return <div className="p-8">アイテムが見つかりませんでした</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-xl mt-10 border border-gray-100">
      <Link href={`/project/${data.parts.project_id}`} className="text-sm text-blue-600 hover:underline mb-6 inline-block font-bold">
        ← プロジェクト進捗に戻る
      </Link>

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-black text-gray-900">{data.parts.part_number}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.current_process === 'DEFECTIVE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          ID: {id}
        </span>
      </div>

      {/* ステータス表示 */}
      <div className={`p-4 rounded-lg mb-8 border ${data.current_process === 'DEFECTIVE' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Current Status</p>
        <p className={`text-2xl font-black ${data.current_process === 'DEFECTIVE' ? 'text-red-700' : 'text-blue-800'}`}>
          {PROCESSES.find(p => p.key === data.current_process)?.name || data.current_process}
        </p>
      </div>

      <div className="space-y-10">
        {/* 1. 通常の工程更新 */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">工程を進める</h2>
          <form action={async (formData) => {
            'use server'
            const next = formData.get('next') as string;
            await updateProcess(id, next, data.parts.project_id);
          }} className="flex gap-2">
            <select name="next" defaultValue={data.current_process} className="flex-1 p-3 border rounded-lg font-bold">
              {PROCESSES.map(proc => <option key={proc.key} value={proc.key}>{proc.name}</option>)}
            </select>
            <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">更新</button>
          </form>
        </section>

        {/* 2. 不良報告セクション（ここが重要） */}
        {data.current_process !== 'DEFECTIVE' && (
          <section className="p-6 border-2 border-red-200 rounded-2xl bg-red-50/50">
            <h2 className="text-lg font-black text-red-700 mb-2 flex items-center gap-2">
              ⚠️ 不良・再製作の報告
            </h2>
            <p className="text-sm text-red-600 mb-4 font-medium">
              この個体に欠陥がある場合、ここで報告します。この個体は「不良」として記録され、自動的に「未プリント」の新しいジョブが作成されます。
            </p>
            <form action={async (formData) => {
              'use server'
              const reason = formData.get('reason') as string;
              await reportDefect(id, reason);
            }} className="space-y-3">
              <input
                name="reason"
                placeholder="不良理由（例：積層剥離、寸法誤差）"
                className="w-full p-3 border-2 border-red-100 rounded-xl focus:border-red-500 outline-none bg-white font-medium"
                required
              />
              <button className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-[0.98]">
                不良を確定し、再製作を依頼
              </button>
            </form>
          </section>
        )}

        {/* 3. 完了処理 */}
        <section>
          <form action={async () => {
            'use server'
            await consumeItem(id);
          }}>
            <button className="w-full border-2 border-green-600 text-green-600 font-black py-4 rounded-xl hover:bg-green-50 transition-colors">
              組み込み完了（ストックから除外）
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}