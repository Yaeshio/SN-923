'use server'

import { mockStore } from '@/lib/mockStore'
import { revalidatePath } from 'next/cache'

/**
 * 不良を報告し、再製作ジョブを生成するサーバーアクション
 * @param itemId - 不良が発生したアイテムのID
 * @param reason - 不良の理由
 */
export async function reportDefect(itemId: number | string, reason: string) {
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;

    const item = await mockStore.getPartItem(id);
    if (!item) {
        console.error(`Item ${id} not found`);
        return;
    }

    // 1. 現状のアイテムを「不良(DEFECTIVE)」にする
    await mockStore.updatePartItem(id, {
        current_process: 'DEFECTIVE'
    });

    // 2. 新しいジョブ（再製作）を生成する
    // 元のアイテムの情報を引き継ぎつつ、工程を「未プリント」に戻す
    await mockStore.addPartItem({
        part_id: item.part_id,
        storage_case: `${item.storage_case} (RE)`, // 再製作であることを示す
        current_process: 'UNPRINTED',
        completed_at: null
    });

    console.log(`Reported defect for item ${id}: ${reason}`);

    // キャッシュを更新
    revalidatePath('/');
    revalidatePath(`/item/${id}`);
    revalidatePath(`/project/${item.parts.project_id}`);
}