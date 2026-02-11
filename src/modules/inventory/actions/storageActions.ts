'use server'

/**
 * Inventory Module - Storage Actions
 * 保管箱の管理に関するアクション
 */

import { db } from '@/src/shared/lib/firebase';
import { doc, updateDoc, collection, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

/**
 * 特定のアイテムの保管ボックスを強制的に解放する
 * @param itemId - 部品アイテムのID
 */
export async function releaseStorageCase(itemId: number) {
    try {
        const itemRef = doc(db, 'partItems', String(itemId));
        await updateDoc(itemRef, {
            storage_case: '',
            updated_at: serverTimestamp()
        });

        console.log(`[StorageActions] Released storage box for item ${itemId}`);

        revalidatePath('/');
        revalidatePath('/storage');

        return { success: true };
    } catch (error) {
        console.error('[StorageActions] Failed to release case:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * 保管ボックスの使用状況を取得する
 * @param maxBoxNumber - 最大ボックス番号
 */
export async function getStorageBoxStatus(maxBoxNumber: number = 100) {
    try {
        // 全アイテムと全部品を取得
        const itemsSnap = await getDocs(collection(db, 'partItems'));
        const partsSnap = await getDocs(collection(db, 'parts'));

        const partMap = new Map();
        partsSnap.forEach(doc => {
            const data = doc.data();
            partMap.set(data.id, data.part_number);
        });

        const boxMap = new Map();
        itemsSnap.forEach(doc => {
            const data = doc.data();
            if (data.storage_case && data.storage_case.trim() !== '') {
                boxMap.set(data.storage_case, {
                    itemId: data.id,
                    partNumber: partMap.get(data.part_id) || 'Unknown',
                    status: data.status
                });
            }
        });

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
        console.error('[StorageActions] Failed to get status:', error);
        return { success: false, error: (error as Error).message, boxes: [] };
    }
}
