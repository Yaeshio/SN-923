/**
 * Inventory Module - Box Service
 * 保管ケース（ボックス）の採番と管理
 */

import { db } from '@/src/shared/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * 使用中のボックスIDを取得する
 * 
 * @returns 使用中のボックスIDのSet
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
 * 次に利用可能なボックスIDを探す
 * 
 * @param usedBoxes - 使用中のボックスIDのSet
 * @returns 次に利用可能なボックスID
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
 * 指定された個数分のボックスを確保する
 * 
 * @param quantity - 必要なボックスの個数
 * @returns 確保されたボックスIDの配列
 */
export async function allocateBoxes(quantity: number): Promise<string[]> {
    const usedBoxes = await getUsedBoxes();
    const allocatedBoxes: string[] = [];

    for (let i = 0; i < quantity; i++) {
        const boxId = findNextAvailableBox(usedBoxes);
        usedBoxes.add(boxId); // 次の検索で重複しないように追加
        allocatedBoxes.push(boxId);
    }

    console.log(`[BoxService] Allocated ${quantity} boxes: ${allocatedBoxes.join(', ')}`);
    return allocatedBoxes;
}

/**
 * プレビュー用：ボックス割り当てをシミュレートする（DB更新なし）
 * 
 * @param quantities - 各ファイルに必要なボックス数の配列
 * @returns 各ファイルに割り当てられるボックスIDの2次元配列
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
