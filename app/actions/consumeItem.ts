'use server' // このファイルがサーバーサイドで実行されることを示す

import { supabase } from '@/lib/supabase'

/**
 * 部品アイテムを消費済みにするサーバーアクション
 * @param itemId - 消費する部品アイテムのID
 */
export async function consumeItem(itemId: string) {
  await supabase
    .from('part_items') // 'part_items'テーブルを選択
    .update({
      status: 'consumed', // ステータスを'consumed'（消費済み）に更新
      current_process: 'assembled', // 現在の工程を'assembled'（組み立て済み）に更新
      storage_case_id: null // 保管ケースIDをnullに設定
    })
    .eq('id', itemId) // 指定されたIDのアイテムを対象とする
}
