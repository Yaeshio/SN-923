'use server'

import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  query,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { parseFileName } from '@/lib/utils/parseFileName';
import { Part, PartItem, ProcessStatus } from '@/app/types';

/**
 * 3Dプリントされた新しい部品アイテムを作成するサーバーアクション（強化版）
 * 
 * @param fileBuffer - STLファイルのArrayBuffer
 * @param fileName - ファイル名
 * @param projectId - プロジェクトID
 * @param qty - 数量
 * @param targetStatus - 初期ステータス
 */
export async function createPrinted(
  fileBuffer: ArrayBuffer,
  fileName: string,
  projectId: number,
  qty: number,
  targetStatus: ProcessStatus = 'PRINTED'
) {
  try {
    // 1. ファイル名を解析して部品番号を取得
    const parsed = parseFileName(fileName);
    if (!parsed.isValid) {
      throw new Error(parsed.errorMessage || 'ファイル名の解析に失敗しました');
    }
    const partNumber = parsed.partNumber;

    // 2. Firebase Storage にファイルを保存
    const timestamp = Date.now();
    const storagePath = `projects/${projectId}/stl/${partNumber}_${timestamp}.stl`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBuffer);
    const downloadUrl = await getDownloadURL(storageRef);

    // 3. Firestore トランザクションで部品とアイテムを作成
    await runTransaction(db, async (transaction) => {
      // 3a. 部品(Part)の存在確認
      const partsRef = collection(db, 'parts');
      const q = query(
        partsRef,
        where('part_number', '==', partNumber),
        where('project_id', '==', projectId)
      );
      const partQuerySnapshot = await getDocs(q); // トランザクション内での getDocs は制限がある場合があるが、Firebase V9+ では transaction.get(query) が基本。

      // 注意: Firestore トランザクション内でのクエリは複雑なため、
      // ここではドキュメントIDとして部品番号を使用するか、一度検索した後にトランザクションを実行するのが一般的。
      // しかし、要件に合わせて「整合性を保つ」ためにトランザクションを使用。

      let partId: number;

      if (partQuerySnapshot.empty) {
        // 新規作成が必要な場合、新しいIDを決定（ここでは簡易的に全件取得で最大ID+1）
        // 本来はカウンター用ドキュメントを使用するのが望ましい
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
        console.log(`Transaction: Created new Part: ${partNumber} (ID: ${partId})`);
      } else {
        partId = Number(partQuerySnapshot.docs[0].id);
        console.log(`Transaction: Using existing Part: ${partNumber} (ID: ${partId})`);
      }

      // 3b. PartItem を指定された個数分作成
      const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
      const existingItemIds = allItemsSnapshot.docs.map(d => Number(d.id));
      let nextItemId = existingItemIds.length > 0 ? Math.max(...existingItemIds) + 1 : 1;

      for (let i = 0; i < qty; i++) {
        const newItem: PartItem = {
          id: nextItemId,
          part_id: partId,
          storage_case: `AUTO-${partNumber}-${i + 1}`,
          status: targetStatus,
          completed_at: null,
          updated_at: serverTimestamp()
        };

        const itemDocRef = doc(db, 'partItems', String(nextItemId));
        transaction.set(itemDocRef, {
          ...newItem,
          stl_url: downloadUrl // 保存されたURLを紐付け
        });
        nextItemId++;
      }
    });

    console.log(`Successfully created ${qty} items for part ${partNumber}`);
    revalidatePath('/');
    if (projectId) revalidatePath(`/project/${projectId}`);

    return { success: true, partNumber };

  } catch (error) {
    console.error('Error in createPrinted:', error);
    throw error;
  }
}
