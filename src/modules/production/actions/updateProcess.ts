'use server'

/**
 * Production Module - Update Process Action
 * 工程アイテムのステータス更新
 */

import { revalidatePath } from 'next/cache';
import { ProcessStatus } from '@/src/shared/types';
import { updateItemStatus } from '@/src/modules/production/services/itemService';

/**
 * 部品アイテムの工程を更新するサーバーアクション
 * 
 * @param itemId - 更新する部品アイテムのID
 * @param nextProcess - 次の工程ステータス
 * @param projectId - プロジェクトID（オプション）
 */
export async function updateProcess(
    itemId: string | number,
    nextProcess: string,
    projectId?: number
) {
    // 文字列IDを数値に変換
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

    // Production Service を使用してステータスを更新
    await updateItemStatus(id, nextProcess as ProcessStatus);

    console.log(`[UpdateProcess] Updated item ${id} to status ${nextProcess}`);

    // キャッシュを更新してUIに反映
    revalidatePath('/');
    revalidatePath(`/item/${id}`);
    if (projectId) {
        revalidatePath(`/project/${projectId}`);
    }
}
