// サーバーアクションとSupabaseクライアントをインポート
import { createPrinted } from '../actions/createPrinted'
import { supabase } from '@/lib/supabase'

// 3Dプリント登録ページのコンポーネント
export default async function PrintPage() {
  // Supabaseから部品と保管ケースのデータを取得
  const { data: parts } = await supabase.from('parts').select() as any
  const { data: cases } = await supabase.from('storage_cases').select() as any

  return (
    // フォーム送信時にサーバーアクションを実行
    <form action={async (formData: any) => {
      'use server' // この関数をサーバーサイドで実行することを示す
      // createPrintedサーバーアクションを呼び出して、新しいプリントアイテムを作成
      await createPrinted(
        formData.get('part') as string, // フォームから部品IDを取得
        Number(formData.get('qty')), // フォームから数量を取得し、数値に変換
        formData.get('case') as string // フォームからケースIDを取得
      )
    }}>
      <h1>3Dプリント完了</h1>

      {/* 部品選択のドロップダウン */}
      <select name="part">
        {parts?.map((p: any) => (
          <option key={p.id} value={p.id}>{p.part_number}</option>
        ))}
      </select>

      {/* 数量入力フィールド */}
      <input name="qty" type="number" defaultValue={1} />

      {/* 保管ケース選択のドロップダウン */}
      <select name="case">
        {cases?.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* 登録ボタン */}
      <button type="submit">登録</button>
    </form>
  )
}
