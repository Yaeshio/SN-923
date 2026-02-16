'use server'

/**
 * Production Module - Update Item Status Action
 * ステータス更新と付随するロジック（ボックス解放など）
 */

import { revalidatePath } from 'next/cache';
import { updateItemStatus as updateStatus } from '@/src/modules/production/services/itemService';
import { db } from '@/src/shared/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 部品アイテムのステータスを更新するサーバーアクション
 * @param itemId - 部品アイテムのID
 * @param newStatus - 新しいステータス
 */
export async function updateItemStatus(itemId: string, newStatus: string) {
    try {
        const id = itemId;

        // ステータスを更新
        await updateStatus(id, newStatus as any);

        // ステータスがASSEMBLED（完成）の場合、保管ボックスを解放
        if (newStatus === 'ASSEMBLED') {
            const itemRef = doc(db, 'partItems', id);
            await updateDoc(itemRef, {
                storage_case: '',
                updated_at: serverTimestamp()
            });
            console.log(`[UpdateItemStatus] Released storage box for item ${id}`);
        }

        revalidatePath('/');
        revalidatePath('/storage');

        return { success: true };
    } catch (error) {
        console.error('[UpdateItemStatus] Failed:', error);
        return { success: false, error: (error as Error).message };
    }
}
