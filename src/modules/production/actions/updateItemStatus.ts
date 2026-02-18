'use server'

/**
 * Production Module - Update Item Status Action
 * ステータス更新と付随するロジック（ボックス解放など）
 */

import { revalidatePath } from 'next/cache';
import { updateItemStatus as updateStatus } from '@/src/modules/production/services/itemService';


/**
 * 部品アイテムのステータスを更新するサーバーアクション
 * @param itemId - 部品アイテムのID
 * @param newStatus - 新しいステータス
 */
export async function updateItemStatus(itemId: string, newStatus: string) {
    try {
        const id = itemId;

        // ステータスを更新 (itemService側でボックス解放もハンドルされる)
        await updateStatus(id, newStatus as any);

        revalidatePath('/');
        revalidatePath('/storage');

        return { success: true };
    } catch (error) {
        console.error('[UpdateItemStatus] Failed:', error);
        return { success: false, error: (error as Error).message };
    }
}

