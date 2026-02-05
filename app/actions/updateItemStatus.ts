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
        await mockStore.updatePartItemStatus(itemId, newStatus);

        // キャッシュを更新してUIに反映
        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Failed to update item status:', error);
        return { success: false, error: (error as Error).message };
    }
}
