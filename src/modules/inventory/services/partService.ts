/**
 * Inventory Module - Part Service
 * 部品マスタの管理（取得・作成）
 */

import { db } from '@/src/shared/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    query,
    where
} from 'firebase/firestore';
import { Part } from '@/src/modules/inventory/types';

/**
 * 部品番号とプロジェクトIDから部品を検索する
 * 
 * @param partNumber - 部品番号
 * @param projectId - プロジェクトID
 * @returns 見つかった部品、または null
 */
export async function findPartByNumber(
    partNumber: string,
    projectId: number
): Promise<Part | null> {
    const partsRef = collection(db, 'parts');
    const q = query(
        partsRef,
        where('part_number', '==', partNumber),
        where('project_id', '==', projectId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const partDoc = snapshot.docs[0];
    return {
        id: Number(partDoc.id),
        ...partDoc.data()
    } as Part;
}

/**
 * 新しい部品を作成する
 * 
 * @param partNumber - 部品番号
 * @param projectId - プロジェクトID
 * @returns 作成された部品
 */
export async function createPart(
    partNumber: string,
    projectId: number
): Promise<Part> {
    // 新しいIDを生成（既存の最大ID + 1）
    const allPartsSnapshot = await getDocs(collection(db, 'parts'));
    const existingIds = allPartsSnapshot.docs.map(d => Number(d.id));
    const newPartId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const newPart: Part = {
        id: newPartId,
        part_number: partNumber,
        project_id: projectId
    };

    await setDoc(doc(db, 'parts', String(newPartId)), newPart);
    console.log(`[PartService] Created new Part: ${partNumber} (ID: ${newPartId})`);

    return newPart;
}

/**
 * 部品が存在することを保証する（なければ作成）
 * 
 * @param partNumber - 部品番号
 * @param projectId - プロジェクトID
 * @returns 既存または新規作成された部品
 */
export async function ensurePartExists(
    partNumber: string,
    projectId: number
): Promise<Part> {
    const existingPart = await findPartByNumber(partNumber, projectId);

    if (existingPart) {
        console.log(`[PartService] Using existing Part: ${partNumber} (ID: ${existingPart.id})`);
        return existingPart;
    }

    return await createPart(partNumber, projectId);
}
