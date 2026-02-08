'use server'

import { mockStore } from '@/lib/mockStore'
import { revalidatePath } from 'next/cache'

/**
 * 部品アイテムのステータスを更新するサーバーアクション
 * @param itemId - 部品アイテムのID
 * @param newStatus - 新しいステータス（工程）
 */
export async function updateItemStatus(itemId: string | number, newStatus: string) {
    try {
        // ステータスを更新
        await mockStore.updatePartItemStatus(itemId, newStatus);

        // ステータスがASSEMBLED（完成）の場合、保管ボックスを解放
        if (newStatus === 'ASSEMBLED') {
            await mockStore.updatePartItem(Number(itemId), {
                storage_case: ''
            });
            console.log(`Released storage box for item ${itemId}`);
        }

        // キャッシュを更新してUIに反映
        revalidatePath('/');
        revalidatePath('/storage');

        return { success: true };
    } catch (error) {
        console.error('Failed to update item status:', error);
        return { success: false, error: (error as Error).message };
    }
}
