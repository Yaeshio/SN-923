// Supabaseクライアントとサーバーアクションをインポート
import { supabase } from '@/lib/supabase'
import { updateProcess } from '@/app/actions/updateProcess'
import { consumeItem } from '@/app/actions/consumeItem'

// 利用可能な工程のリスト
const PROCESS = [
  'printed', // 印刷済み
  'surface', // 表面処理
  'machining', // 機械加工
  'painting', // 塗装
  'ready' // 準備完了
]

// アイテム詳細ページのコンポーネント
export default async function ItemPage({ params }: any) {
  // URLのパラメータからアイテムIDを使用して、Supabaseから特定の部品アイテムのデータを取得
  const { data } = await supabase
    .from('part_items')
    .select(`
      id,
      current_process,
      parts ( part_number )
    `)
    .eq('id', params.id) // IDでフィルタリング
    .single() as any // 単一のレコードを取得

  return (
    <div>
      {/* 部品番号を表示 */}
      <h1>{(data?.parts as any)?.[0]?.part_number || data?.parts?.part_number}</h1>
      {/* 現在の工程を表示 */}
      <p>現在工程: {data?.current_process}</p>

      {/* 工程更新フォーム */}
      <form action={async (formData) => {
        'use server'
        // updateProcessサーバーアクションを呼び出して、工程を更新
        await updateProcess(
          data.id,
          formData.get('next') as string
        )
      }}>
        {/* 次の工程を選択するドロップダウン */}
        <select name="next">
          {PROCESS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button>工程更新</button>
      </form>

      {/* 組み込み完了フォーム */}
      <form action={async () => {
        'use server'
        // consumeItemサーバーアクションを呼び出して、アイテムを消費済みにする
        await consumeItem(data.id)
      }}>
        <button>組み込み完了</button>
      </form>
    </div>
  )
}
