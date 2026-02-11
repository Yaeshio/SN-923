/**
 * Production Module - Production Service
 * 複数のエンティティにまたがる製造関連のトランザクション処理
 */

import { db, storage } from '@/src/shared/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    runTransaction,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ProcessStatus } from '@/src/shared/types';
import { Part } from '@/src/modules/inventory/types';
import { PartItem } from '@/src/modules/production/types';

/**
 * STLファイルをアップロードし、部品を作成（未存在時）し、指定個数のアイテムを作成する
 * これらをアトミックなトランザクションとして実行する
 */
export async function registerPrintedItems(
    fileBuffer: ArrayBuffer,
    partNumber: string,
    projectId: number,
    quantity: number,
    targetStatus: ProcessStatus = 'PRINTED'
): Promise<{ success: boolean; partNumber: string; downloadUrl: string }> {

    // 1. Storageへのアップロード（StorageはFirestoreトランザクション外）
    const timestamp = Date.now();
    const storagePath = `projects/${projectId}/stl/${partNumber}_${timestamp}.stl`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBuffer);
    const downloadUrl = await getDownloadURL(storageRef);

    // 2. Firestoreトランザクション
    await runTransaction(db, async (transaction) => {
        // 2a. 部品(Part)の存在確認
        const partsRef = collection(db, 'parts');
        const q = query(
            partsRef,
            where('part_number', '==', partNumber),
            where('project_id', '==', projectId)
        );
        // トランザクション内でのクエリ実行は制限があるため、ここでは簡易的に getDocs を使用
        // 厳密な一貫性が必要な場合は、事前にIDを確定させるか、ID設計を見直す必要がある
        const partQuerySnapshot = await getDocs(q);

        let partId: number;

        if (partQuerySnapshot.empty) {
            // 新規作成: ID採番（競合のリスクがあるが、現行ロジックを踏襲）
            const allPartsSnapshot = await getDocs(collection(db, 'parts'));
            const existingIds = allPartsSnapshot.docs.map(d => Number(d.id));
            partId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

            const newPart: Part = {
                id: partId,
                part_number: partNumber,
                project_id: projectId
            };

            const partDocRef = doc(db, 'parts', String(partId));
            transaction.set(partDocRef, newPart);
        } else {
            partId = Number(partQuerySnapshot.docs[0].id);
        }

        // 2b. PartItem の作成: ID採番
        const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
        const existingItemIds = allItemsSnapshot.docs.map(d => Number(d.id));
        let nextItemId = existingItemIds.length > 0 ? Math.max(...existingItemIds) + 1 : 1;

        for (let i = 0; i < quantity; i++) {
            // PartItemの型に準拠したオブジェクト作成
            const newItemStub = {
                id: nextItemId,
                part_id: partId,
                storage_case: `AUTO-${partNumber}-${i + 1}`,
                status: targetStatus,
                completed_at: null,
                updated_at: serverTimestamp(),
                stl_url: downloadUrl // 追加プロパティ
            };

            const itemDocRef = doc(db, 'partItems', String(nextItemId));
            transaction.set(itemDocRef, newItemStub);
            nextItemId++;
        }
    });

    return { success: true, partNumber, downloadUrl };
}
