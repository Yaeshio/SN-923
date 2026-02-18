import { db } from '@/src/shared/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { PartItem } from '@/src/modules/production/types';
import { Part } from '@/src/modules/inventory/types';
import { ProcessStatus } from '@/src/shared/types';
import { PROCESSES } from '@/app/constants';
import { BoxService } from '@/src/modules/inventory/services/boxService';


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
    partId: string,
    quantity: number,
    storageBoxes: string[],
    initialStatus: ProcessStatus = 'CUTTING'
): Promise<PartItem[]> {
    if (storageBoxes.length !== quantity) {
        throw new Error(`Storage boxes count (${storageBoxes.length}) does not match quantity (${quantity})`);
    }

    const createdItems: PartItem[] = [];

    for (let i = 0; i < quantity; i++) {
        const itemRef = doc(collection(db, 'partItems'));
        const newItem: PartItem = {
            id: itemRef.id,
            part_id: partId,
            box_id: null, // 明示的に割り当てる場合は別のフローを使用
            storage_case: storageBoxes[i],
            status: initialStatus,
            completed_at: null,
            updated_at: serverTimestamp()
        };

        await setDoc(itemRef, newItem);
        createdItems.push(newItem);
    }

    console.log(`[ItemService] Created ${quantity} PartItems for Part ${partId}`);
    return createdItems;
}

/**
 * アイテムのステータスを更新する
 * ステータスが完了（ASSEMBLED または READY）になった場合、ボックスを自動的に解放する
 * 
 * @param itemId - アイテムID
 * @param newStatus - 新しいステータス
 */
export async function updateItemStatus(
    itemId: string,
    newStatus: ProcessStatus
): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'partItems', itemId);
        const itemSnap = await transaction.get(itemRef);

        if (!itemSnap.exists()) {
            throw new Error('Item not found');
        }

        const itemData = itemSnap.data() as PartItem;
        const isCompleted = newStatus === 'ASSEMBLED' || (newStatus as string) === 'READY';

        const updates: any = {
            status: newStatus,
            updated_at: serverTimestamp(),
            completed_at: isCompleted ? serverTimestamp() : null
        };

        // ボックスの解放処理
        if (isCompleted && itemData.box_id) {
            await BoxService.releaseBox(itemData.box_id, transaction);
            updates.box_id = null;
            updates.storage_case = ''; // 互換性のためのフィールドもクリア
        }

        transaction.update(itemRef, updates);
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
    itemIds: string[],
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
            count: items.length,
            unit_id: part.unit_id
        };
    });
}
