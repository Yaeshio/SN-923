'use server'

/**
 * Production Module - Report Defect Action
 * 不良を報告し、再製作ジョブを生成する
 */

import { db } from '@/src/shared/lib/firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { updateItemStatus, createItems } from '@/src/modules/production/services/itemService';

/**
 * 不良を報告し、再製作ジョブを生成するサーバーアクション
 * @param itemId - 不良が発生したアイテムのID
 * @param reason - 不良の理由
 */
export async function reportDefect(itemId: number | string, reason: string) {
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

    // 1. 元のアイテム情報を取得
    const itemRef = doc(db, 'partItems', String(id));
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
        console.error(`[ReportDefect] Item ${id} not found`);
        return { success: false, error: 'Item not found' };
    }

    const itemData = itemSnap.data();

    // 2. 現状のアイテムを「不良(DEFECTIVE)」にする
    await updateItemStatus(id, 'DEFECTIVE');

    // 3. 新しいジョブ（再製作）を生成する
    // 元のアイテムの情報を引き継ぎつつ、工程を「未プリント」に戻す
    // ボックス名は (RE) を付与
    await createItems(
        itemData.part_id,
        1,
        [`${itemData.storage_case} (RE)`],
        'UNPRINTED'
    );

    console.log(`[ReportDefect] Reported defect for item ${id}: ${reason}`);

    // キャッシュを更新
    revalidatePath('/');
    revalidatePath(`/item/${id}`);

    return { success: true };
}
