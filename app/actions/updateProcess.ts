'use server' // このファイルがサーバーサイドで実行されることを示す

import { supabase } from '@/lib/supabase'

/**
 * 部品アイテムの工程を更新するサーバーアクション
 * @param itemId - 更新する部品アイテムのID
 * @param nextProcess - 次の工程名
 */
export async function updateProcess(
  itemId: string,
  nextProcess: string
) {
  // 'part_items'テーブルの現在の工程を更新
  await supabase
    .from('part_items')
    .update({ current_process: nextProcess }) // 'current_process'カラムを新しい工程名で更新
    .eq('id', itemId) // 指定されたIDのアイテムを対象とする

  // 'part_process_logs'テーブルに新しい工程ログを挿入
  await supabase.from('part_process_logs').insert({
    part_item_id: itemId, // 部品アイテムのID
    process: nextProcess // 新しい工程名
  })
}
