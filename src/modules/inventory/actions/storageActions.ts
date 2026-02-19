'use server';

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
 * 単一の保管ボックスの使用状況を効率的に確認する
 * @param boxName - 確認するボックス名 (例: "棚A-1")
 * @returns 'occupied' | 'available' | 'error'
 */
export async function getBoxStatus(boxName: string) {
    try {
        if (!boxName) {
            return 'available';
        }
        // 特定のボックス名を持つ partItems をクエリ
        const itemsRef = collection(db, 'partItems');
        const q = query(itemsRef, where('storage_case', '==', boxName));
        const querySnapshot = await getDocs(q);

        // ドキュメントが存在すれば 'occupied', なければ 'available'
        if (querySnapshot.empty) {
            return 'available';
        } else {
            return 'occupied';
        }
    } catch (error) {
        console.error(`[StorageActions] Failed to get status for box ${boxName}:`, error);
        return 'error';
    }
}


/**
 * 保管ボックス全体のリストと使用状況を動的に取得する
 */
export async function getStorageBoxes() {
    try {
        // 1. 登録されている全ボックスのマスターデータを取得
        const boxesSnap = await getDocs(collection(db, 'boxes'));
        if (boxesSnap.empty) {
            return { success: true, boxes: [] };
        }
        const allBoxIds = boxesSnap.docs.map(doc => doc.id);
        
        // 2. 使用中のアイテム情報を全て取得
        const itemsRef = collection(db, 'partItems');
        const q = query(itemsRef, where('storage_case', '!=', ''));
        const usedItemsSnap = await getDocs(q);
        const usedItems = usedItemsSnap.docs.map(doc => doc.data());

        // 3. 部品情報を取得してMapに格納
        const partsSnap = await getDocs(collection(db, 'parts'));
        const partMap = new Map();
        partsSnap.forEach(doc => {
            const data = doc.data();
            partMap.set(data.id, data.part_number);
        });

        // 4. 使用中ボックスの情報をまとめる
        const boxMap = new Map();
        usedItems.forEach(item => {
            if (item.storage_case) {
                boxMap.set(item.storage_case, {
                    itemId: item.id,
                    partNumber: partMap.get(item.part_id) || 'Unknown',
                    status: item.status
                });
            }
        });

        // 5. 全ボックスの最終的なリストを生成
        const boxes = allBoxIds.map(boxId => {
            const usage = boxMap.get(boxId);
            return {
                boxId,
                isUsed: !!usage,
                itemId: usage?.itemId || null,
                partNumber: usage?.partNumber || null,
                status: usage?.status || null
            };
        });

        return { success: true, boxes };
    } catch (error) {
        console.error('[StorageActions] Failed to get storage boxes:', error);
        return { success: false, error: (error as Error).message, boxes: [] };
    }
}
