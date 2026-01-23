'use server' // このファイルがサーバーサイドで実行されることを示す

import { supabase } from '@/lib/supabase'

/**
 * 3Dプリントされた新しい部品アイテムを作成するサーバーアクション
 * @param partId - 部品のID
 * @param qty - 数量
 * @param storageCaseId - 保管ケースのID
 */
export async function createPrinted(
  partId: string,
  qty: number,
  storageCaseId: string
) {
  // 指定された数量だけループを実行
  for (let i = 0; i < qty; i++) {
    // 'part_items'テーブルに新しいレコードを挿入
    const { data, error } = await supabase
      .from('part_items')
      .insert({
        part_id: partId, // 部品ID
        current_process: 'printed', // 現在の工程を'printed'に設定
        storage_case_id: storageCaseId // 保管ケースID
      })
      .select() // 挿入したレコードをSELECT
      .single() // 単一のレコードとして取得

    // 挿入が成功した場合
    if (data) {
      // 'part_process_logs'テーブルに工程ログを挿入
      await supabase.from('part_process_logs').insert({
        part_item_id: data.id, // 新しく作成された部品アイテムのID
        process: 'printed' // 工程名
      })
    }

    // エラーが発生した場合は、エラーをスロー
    if (error) throw error
  }
}
