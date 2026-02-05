'use server'

import { mockStore } from '@/lib/mockStore'
import { revalidatePath } from 'next/cache'

/**
 * 3Dプリントされた新しい部品アイテムを作成するサーバーアクション
 * @param partId - 部品のID
 * @param qty - 数量
 * @param storageCaseLabel - 保管ケースのラベル（mock版では文字列）
 */
export async function createPrinted(
  partId: string | number,
  qty: number,
  storageCaseLabel: string
) {
  const pId = typeof partId === 'string' ? parseInt(partId, 10) : partId;

  // 指定された数量だけループを実行
  for (let i = 0; i < qty; i++) {
    await mockStore.addPartItem({
      part_id: pId,
      status: 'PRINTED',
      storage_case: storageCaseLabel,
      completed_at: null
    });
  }

  console.log(`Created ${qty} items for part ${pId}`);

  revalidatePath('/');
}
