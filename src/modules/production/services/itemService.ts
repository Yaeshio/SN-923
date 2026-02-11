/**
 * Production Module - Item Service
 * 工程アイテム（PartItem）の作成と管理
 */

import { db } from '@/src/shared/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { PartItem } from '@/src/modules/production/types';
import { Part } from '@/src/modules/inventory/types';
import { ProcessStatus } from '@/src/shared/types';
import { PROCESSES } from '@/app/constants';

/**
 * 新しいアイテムIDを生成する
 * 
 * @returns 次に使用可能なアイテムID
 */
async function generateNextItemId(): Promise<number> {
    const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
    const existingItemIds = allItemsSnapshot.docs.map(d => Number(d.id));
    return existingItemIds.length > 0 ? Math.max(...existingItemIds) + 1 : 1;
}

/**
 * 工程アイテムを作成する
 * 
 * @param partId - 部品ID
 * @param quantity - 作成する個数
 * @param storageBoxes - 割り当てられた保管ケースの配列
 * @param initialStatus - 初期ステータス
 * @returns 作成されたアイテムの配列
 */
export async function createItems(
    partId: number,
    quantity: number,
    storageBoxes: string[],
    initialStatus: ProcessStatus = 'CUTTING'
): Promise<PartItem[]> {
    if (storageBoxes.length !== quantity) {
        throw new Error(`Storage boxes count (${storageBoxes.length}) does not match quantity (${quantity})`);
    }

    let nextItemId = await generateNextItemId();
    const createdItems: PartItem[] = [];

    for (let i = 0; i < quantity; i++) {
        const newItem: PartItem = {
            id: nextItemId,
            part_id: partId,
            storage_case: storageBoxes[i],
            status: initialStatus,
            completed_at: null,
            updated_at: serverTimestamp()
        };

        await setDoc(doc(db, 'partItems', String(nextItemId)), newItem);
        createdItems.push(newItem);
        nextItemId++;
    }

    console.log(`[ItemService] Created ${quantity} PartItems for Part ${partId}`);
    return createdItems;
}

/**
 * アイテムのステータスを更新する
 * 
 * @param itemId - アイテムID
 * @param newStatus - 新しいステータス
 */
export async function updateItemStatus(
    itemId: number,
    newStatus: ProcessStatus
): Promise<void> {
    const itemRef = doc(db, 'partItems', String(itemId));

    await updateDoc(itemRef, {
        status: newStatus,
        updated_at: serverTimestamp(),
        completed_at: newStatus === 'ASSEMBLED' ? serverTimestamp() : null
    });

    console.log(`[ItemService] Updated item ${itemId} status to ${newStatus}`);
}

/**
 * 複数アイテムのステータスを一括更新する
 * 
 * @param itemIds - アイテムIDの配列
 * @param newStatus - 新しいステータス
 */
export async function updateMultipleItemsStatus(
    itemIds: number[],
    newStatus: ProcessStatus
): Promise<void> {
    const updatePromises = itemIds.map(itemId => updateItemStatus(itemId, newStatus));
    await Promise.all(updatePromises);

    console.log(`[ItemService] Updated ${itemIds.length} items to status ${newStatus}`);
}

/**
 * 部品とアイテムから進捗データを集計する
 */
export function aggregateProgress(parts: Part[], partItems: PartItem[]): any[] {
    return parts.map(part => {
        const items = partItems.filter(item => item.part_id === part.id);

        const processOrder = PROCESSES.map(p => p.key);
        const currentProcess = items.length > 0
            ? items.reduce((earliest: ProcessStatus, item: PartItem) => {
                const earliestIdx = processOrder.indexOf(earliest);
                const currentIdx = processOrder.indexOf(item.status);
                return currentIdx < earliestIdx ? item.status : earliest;
            }, 'ASSEMBLED' as ProcessStatus)
            : 'UNPRINTED';

        return {
            id: part.id,
            part_number: part.part_number,
            status: currentProcess,
            storage_cases: Array.from(new Set(items.map(i => i.storage_case))),
            count: items.length
        };
    });
}
