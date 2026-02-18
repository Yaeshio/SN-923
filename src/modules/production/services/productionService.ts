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

import { BoxService } from '@/src/modules/inventory/services/boxService';

/**
 * STLファイルをアップロードし、部品を作成（未存在時）し、指定個数のアイテムを作成する
 * これらをアトミックなトランザクションとして実行する
 */
export async function registerPrintedItems(
    fileBuffer: ArrayBuffer,
    partNumber: string,
    projectId: string,
    quantity: number,
    targetStatus: ProcessStatus = 'PRINTED'
): Promise<{ success: boolean; partNumber: string; downloadUrl: string }> {

    // 1. Storageへのアップロード (トランザクションの外で行う)
    const timestamp = Date.now();
    const storagePath = `projects/${projectId}/stl/${partNumber}_${timestamp}.stl`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBuffer);
    const downloadUrl = await getDownloadURL(storageRef);

    // 2. Firestoreトランザクション
    try {
        await runTransaction(db, async (transaction) => {
            // 2a. 部品(Part)の存在確認
            const partsRef = collection(db, 'parts');
            const q = query(
                partsRef,
                where('part_number', '==', partNumber),
                where('project_id', '==', projectId)
            );
            const partQuerySnapshot = await getDocs(q);

            let partId: string;

            if (partQuerySnapshot.empty) {
                // 新規作成
                const partDocRef = doc(partsRef);
                partId = partDocRef.id;

                const newPart: Part = {
                    id: partId,
                    part_number: partNumber,
                    project_id: projectId
                };

                transaction.set(partDocRef, newPart);
            } else {
                partId = partQuerySnapshot.docs[0].id;
            }

            // 2b. PartItem の作成
            for (let i = 0; i < quantity; i++) {
                const itemRef = doc(collection(db, 'partItems'));

                // BoxServiceを使用して空きボックスを確保
                // findAndOccupyEmptyBox は内部で getDocs (非トランザクション読込) を行うが、
                // トランザクションを渡すことで、実際の占有更新はアトミックに行われる
                const box = await BoxService.findAndOccupyEmptyBox(itemRef.id, transaction);

                const newItemStub = {
                    id: itemRef.id,
                    part_id: partId,
                    box_id: box.id,
                    storage_case: box.name, // 互換性のためにボックス名をセット
                    status: targetStatus,
                    completed_at: null,
                    updated_at: serverTimestamp(),
                    stl_url: downloadUrl
                };

                transaction.set(itemRef, newItemStub);
            }
        });

        return { success: true, partNumber, downloadUrl };
    } catch (error: any) {
        console.error('[ProductionService] Failed to register items:', error);
        // ボックスが足りない場合などのエラーを再スローし、アクション側でハンドルさせる
        throw error;
    }
}

