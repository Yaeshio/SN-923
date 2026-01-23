// SupabaseクライアントとNext.jsのLinkコンポーネントをインポート
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// 在庫一覧ページのメインコンポーネント
export default async function Home() {
  // Supabaseから'in_progress'ステータスの部品アイテムのデータを取得
  const { data } = await supabase
    .from('part_items') // 'part_items'テーブルを選択
    .select(`
      id,
      current_process,
      parts ( part_number )
    `) // 必要なカラム（id, 現在の工程, 関連するpartsテーブルの部品番号）を選択
    .eq('status', 'in_progress') as any // 'status'が'in_progress'のレコードに絞り込む

  return (
    <main>
      <h1>在庫一覧</h1>

      {/* 3Dプリント登録ページへのリンク */}
      <Link href="/print">▶ 3Dプリント登録</Link>

      {/* 在庫アイテムのリストを表示 */}
      <ul>
        {data?.map((item: any) => (
          <li key={item.id}>
            {/* 部品番号と現在の工程を表示 */}
            {(item?.parts as any)?.[0]?.part_number || item?.parts?.part_number} | {item.current_process}
            {' '}
            {/* 詳細ページへのリンク */}
            <Link href={`/item/${item.id}`}>詳細</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
