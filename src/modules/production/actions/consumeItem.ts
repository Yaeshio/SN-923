'use server'

/**
 * Production Module - Consume Item Action
 * 部品アイテムを消費済みにする
 */

import { revalidatePath } from 'next/cache';
import { updateItemStatus } from '@/src/modules/production/services/itemService';

/**
 * 部品アイテムを消費済みにするサーバーアクション
 * @param itemId - 消費する部品アイテムのID
 */
export async function consumeItem(itemId: string | number) {
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

    // READY（または消費済みを意味するステータス）に更新
    // ここでは既存ロジックに合わせてステータスを更新し、保管ボックスを実質的に空にする
    await updateItemStatus(id, 'ASSEMBLED'); // 完成＝消費とみなす

    console.log(`[ConsumeItem] Consumed item ${id}`);

    revalidatePath('/');
    revalidatePath(`/item/${id}`);
}
