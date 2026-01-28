'use server'

import { mockStore } from '@/lib/mockStore'
import { revalidatePath } from 'next/cache'

/**
 * 部品アイテムを消費済みにするサーバーアクション
 * @param itemId - 消費する部品アイテムのID
 */
export async function consumeItem(itemId: string | number) {
  const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

  await mockStore.updatePartItem(id, {
    current_process: 'READY', // 本来のロジックに合わせてREADYにするか、または別のステータス
    completed_at: new Date(),
    storage_case: 'CONSUMED' // 便宜上の表記
  });

  console.log(`Consumed item ${id}`);

  revalidatePath('/');
  revalidatePath(`/item/${id}`);
}
