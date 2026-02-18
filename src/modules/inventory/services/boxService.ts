/**
 * Inventory Module - Box Service
 * 保管ケース（ボックス）の管理
 */

import { db } from '@/src/shared/lib/firebase';
import {
    collection,
    getDocs,
    query,
    where,
    limit,
    doc,
    runTransaction,
    serverTimestamp,
    Transaction
} from 'firebase/firestore';
import { Box } from '../types';

export const BoxService = {
    /**
     * 空いているボックスを探し、指定された部品を割り当てる
     * 検索と更新をトランザクション内で行い、レースコンディションを防止する
     */
    async findAndOccupyEmptyBox(itemId: string, transaction?: Transaction): Promise<Box> {
        // 1. 先に空きボックスをクエリで探す (Firestoreの制限上、トランザクション内でクエリはできないため)
        const boxesRef = collection(db, 'boxes');
        const q = query(boxesRef, where('is_occupied', '==', false), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('No available boxes');
        }

        const boxDoc = snapshot.docs[0];
        const boxId = boxDoc.id;
        const boxRef = doc(db, 'boxes', boxId);

        const updateLogic = async (tx: Transaction) => {
            const docSnap = await tx.get(boxRef);
            if (!docSnap.exists()) {
                throw new Error('Box not found');
            }

            const data = docSnap.data() as Omit<Box, 'id'>;
            if (data.is_occupied) {
                // クエリで見つけた時点では空いていたが、既に他で埋められた場合
                throw new Error('No available boxes');
            }

            const updateData = {
                is_occupied: true,
                current_item_id: itemId,
                last_used_at: serverTimestamp()
            };

            tx.update(boxRef, updateData);

            return {
                id: boxId,
                ...data,
                ...updateData
            } as Box;
        };

        if (transaction) {
            return await updateLogic(transaction);
        } else {
            return await runTransaction(db, updateLogic);
        }
    },

    /**
     * 指定されたボックスを解放する
     */
    async releaseBox(boxId: string, transaction?: Transaction): Promise<void> {
        const boxRef = doc(db, 'boxes', boxId);

        const updateLogic = async (tx: Transaction) => {
            tx.update(boxRef, {
                is_occupied: false,
                current_item_id: null,
                last_used_at: serverTimestamp()
            });
        };

        if (transaction) {
            await updateLogic(transaction);
        } else {
            await runTransaction(db, updateLogic);
        }
    }
};


/**
 * 使用中のボックスIDを取得する (旧互換用)
 */
export async function getUsedBoxes(): Promise<Set<string>> {
    const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
    const usedBoxes = new Set<string>();

    allItemsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.storage_case && data.storage_case.trim() !== '') {
            usedBoxes.add(data.storage_case);
        }
    });

    return usedBoxes;
}

/**
 * 次に利用可能なボックスIDを探す (旧互換用)
 */
export function findNextAvailableBox(usedBoxes: Set<string>): string {
    let boxNumber = 1;
    while (true) {
        const boxId = `BOX-${String(boxNumber).padStart(3, '0')}`;
        if (!usedBoxes.has(boxId)) {
            return boxId;
        }
        boxNumber++;
    }
}

/**
 * 指定された個数分のボックスを確保する (旧互換用)
 */
export async function allocateBoxes(quantity: number): Promise<string[]> {
    const usedBoxes = await getUsedBoxes();
    const allocatedBoxes: string[] = [];

    for (let i = 0; i < quantity; i++) {
        const boxId = findNextAvailableBox(usedBoxes);
        usedBoxes.add(boxId);
        allocatedBoxes.push(boxId);
    }

    console.log(`[BoxService] Allocated ${quantity} boxes: ${allocatedBoxes.join(', ')}`);
    return allocatedBoxes;
}

/**
 * プレビュー用：ボックス割り当てをシミュレートする（DB更新なし） (旧互換用)
 */
export async function previewBoxAllocation(quantities: number[]): Promise<string[][]> {
    const usedBoxes = await getUsedBoxes();
    const allAllocations: string[][] = [];

    for (const quantity of quantities) {
        const allocation: string[] = [];
        for (let i = 0; i < quantity; i++) {
            const boxId = findNextAvailableBox(usedBoxes);
            usedBoxes.add(boxId);
            allocation.push(boxId);
        }
        allAllocations.push(allocation);
    }

    return allAllocations;
}

