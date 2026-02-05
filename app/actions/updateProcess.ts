'use server'

import { mockStore } from '@/lib/mockStore'
import { ProcessStatus } from '@/app/types'
import { revalidatePath } from 'next/cache'

/**
 * 部品アイテムの工程を更新するサーバーアクション
 * @param itemId - 更新する部品アイテムのID
 * @param nextProcess - 次の工程名
 */
export async function updateProcess(
  itemId: string | number,
  nextProcess: string,
  projectId?: number
) {
  // 文字列IDを数値に変換（mockStoreの仕様に合わせる）
  const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

  // メモリ上のデータを更新
  await mockStore.updatePartItem(id, {
    status: nextProcess as ProcessStatus,
    // READYに移行した場合は完了日時を設定
    completed_at: nextProcess === 'READY' ? new Date() : null
  });

  // 工程ログはモック版では省略、または必要なら追加
  console.log(`Updated item ${id} to status ${nextProcess}`);

  // キャッシュを更新してUIに反映
  revalidatePath('/');
  revalidatePath(`/item/${id}`);
  if (projectId) {
    revalidatePath(`/project/${projectId}`);
  }
}
