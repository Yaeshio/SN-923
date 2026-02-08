'use server'

import { mockStore } from '@/lib/mockStore'
import { revalidatePath } from 'next/cache'

/**
 * 特定のアイテムの保管ボックスを強制的に解放するサーバーアクション
 * @param itemId - 部品アイテムのID
 */
export async function releaseStorageCase(itemId: number) {
    try {
        await mockStore.updatePartItem(itemId, {
            storage_case: ''
        });

        console.log(`Forcefully released storage box for item ${itemId}`);

        // キャッシュを更新してUIに反映
        revalidatePath('/');
        revalidatePath('/storage');

        return { success: true };
    } catch (error) {
        console.error('Failed to release storage case:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * 保管ボックスの使用状況を取得するサーバーアクション
 * @param maxBoxNumber - 最大ボックス番号（デフォルト: 100）
 */
export async function getStorageBoxStatus(maxBoxNumber: number = 100) {
    try {
        const allItems = await mockStore.getPartItems();

        // ボックス番号ごとに使用状況をマッピング
        const boxMap = new Map<string, { itemId: number; partNumber: string; status: string }>();

        // Partsデータも取得して部品番号を解決
        const parts = await mockStore.getParts();
        const partMap = new Map(parts.map(p => [p.id, p.part_number]));

        allItems.forEach(item => {
            if (item.storage_case && item.storage_case.trim() !== '') {
                const partNumber = partMap.get(item.part_id) || 'Unknown';
                boxMap.set(item.storage_case, {
                    itemId: item.id,
                    partNumber,
                    status: item.status
                });
            }
        });

        // BOX-001 から BOX-{maxBoxNumber} までの状態を生成
        const boxes = [];
        for (let i = 1; i <= maxBoxNumber; i++) {
            const boxId = `BOX-${String(i).padStart(3, '0')}`;
            const usage = boxMap.get(boxId);

            boxes.push({
                boxId,
                isUsed: !!usage,
                itemId: usage?.itemId || null,
                partNumber: usage?.partNumber || null,
                status: usage?.status || null
            });
        }

        return { success: true, boxes };
    } catch (error) {
        console.error('Failed to get storage box status:', error);
        return { success: false, error: (error as Error).message, boxes: [] };
    }
}
