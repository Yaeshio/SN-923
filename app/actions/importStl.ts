'use server'

import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { parseFileName, ParsedFileInfo } from '@/lib/utils/parseFileName';
import { Part, PartItem, ProcessStatus } from '@/app/types';

export interface ImportResult {
    success: boolean;
    fileName: string;
    partNumber?: string;
    partId?: number;
    itemsCreated?: number;
    error?: string;
}

/**
 * 単一のSTLファイルをインポートする
 * 
 * @param file - アップロードするファイル（FormData経由）
 * @param projectId - プロジェクトID
 * @param defaultStatus - 初期ステータス（デフォルト: 'CUTTING'）
 * @returns インポート結果
 */
export async function importSingleStl(
    fileBuffer: ArrayBuffer,
    fileName: string,
    projectId: number,
    defaultStatus: ProcessStatus = 'CUTTING'
): Promise<ImportResult> {
    try {
        // 1. ファイル名を解析
        const parsed = parseFileName(fileName);

        if (!parsed.isValid) {
            return {
                success: false,
                fileName,
                error: parsed.errorMessage || 'ファイル名の解析に失敗しました'
            };
        }

        const { partNumber, quantity } = parsed;

        // 2. Firebase Storage にアップロード
        const timestamp = Date.now();
        const storagePath = `projects/${projectId}/stl/${partNumber}_${timestamp}.stl`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, fileBuffer);
        const downloadUrl = await getDownloadURL(storageRef);

        // 3. Firestore で該当する part_number を検索
        const partsRef = collection(db, 'parts');
        const q = query(
            partsRef,
            where('part_number', '==', partNumber),
            where('project_id', '==', projectId)
        );
        const snapshot = await getDocs(q);

        let partId: number;

        if (snapshot.empty) {
            // 4a. 該当する Part がなければ新規作成
            const allPartsSnapshot = await getDocs(collection(db, 'parts'));
            const existingIds = allPartsSnapshot.docs.map(d => Number(d.id));
            partId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

            const newPart: Part = {
                id: partId,
                part_number: partNumber,
                project_id: projectId
            };

            await setDoc(doc(db, 'parts', String(partId)), newPart);
            console.log(`Created new Part: ${partNumber} (ID: ${partId})`);
        } else {
            // 4b. 既存の Part を使用
            partId = Number(snapshot.docs[0].id);
            console.log(`Using existing Part: ${partNumber} (ID: ${partId})`);
        }

        // 5. 指定された個数分の PartItem を作成
        const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
        const existingItemIds = allItemsSnapshot.docs.map(d => Number(d.id));
        let nextItemId = existingItemIds.length > 0 ? Math.max(...existingItemIds) + 1 : 1;

        // 使用中のボックス番号を取得
        const usedBoxes = new Set<string>();
        allItemsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.storage_case && data.storage_case.trim() !== '') {
                usedBoxes.add(data.storage_case);
            }
        });

        // 空きボックス番号を探す関数
        const findNextAvailableBox = (): string => {
            let boxNumber = 1;
            while (true) {
                const boxId = `BOX-${String(boxNumber).padStart(3, '0')}`;
                if (!usedBoxes.has(boxId)) {
                    usedBoxes.add(boxId); // 次の検索で重複しないように追加
                    return boxId;
                }
                boxNumber++;
            }
        };

        for (let i = 0; i < quantity; i++) {
            const assignedBox = findNextAvailableBox();

            const newItem: PartItem = {
                id: nextItemId,
                part_id: partId,
                storage_case: assignedBox,
                status: defaultStatus,
                completed_at: null,
                updated_at: serverTimestamp()
            };

            await setDoc(doc(db, 'partItems', String(nextItemId)), newItem);
            nextItemId++;
        }

        console.log(`Created ${quantity} PartItems for Part ${partId}`);

        // 6. キャッシュを再検証
        revalidatePath('/');
        revalidatePath(`/project/${projectId}`);

        return {
            success: true,
            fileName,
            partNumber,
            partId,
            itemsCreated: quantity
        };

    } catch (error) {
        console.error('Error importing STL:', error);
        return {
            success: false,
            fileName,
            error: error instanceof Error ? error.message : '不明なエラーが発生しました'
        };
    }
}

/**
 * 複数のSTLファイルを一括インポートする
 * 
 * @param files - アップロードするファイルの配列
 * @param projectId - プロジェクトID
 * @param defaultStatus - 初期ステータス
 * @returns インポート結果の配列
 */
export async function importMultipleStl(
    filesData: Array<{ buffer: ArrayBuffer; name: string }>,
    projectId: number,
    defaultStatus: ProcessStatus = 'CUTTING'
): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const fileData of filesData) {
        const result = await importSingleStl(
            fileData.buffer,
            fileData.name,
            projectId,
            defaultStatus
        );
        results.push(result);
    }

    return results;
}

/**
 * ファイル名のプレビュー解析（実際のインポートは行わない）
 * 
 * @param fileNames - ファイル名の配列
 * @returns 解析結果の配列
 */
export async function previewFileNames(fileNames: string[]): Promise<ParsedFileInfo[]> {
    // 1. 各ファイル名を解析
    const parsedResults = fileNames.map(parseFileName);

    // 2. 現在の保管ケースの使用状況を取得
    const allItemsSnapshot = await getDocs(collection(db, 'partItems'));
    const usedBoxes = new Set<string>();
    allItemsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.storage_case && data.storage_case.trim() !== '') {
            usedBoxes.add(data.storage_case);
        }
    });

    // 3. 空きボックス番号を探す関数
    const findNextAvailableBox = (): string => {
        let boxNumber = 1;
        while (true) {
            const boxId = `BOX-${String(boxNumber).padStart(3, '0')}`;
            if (!usedBoxes.has(boxId)) {
                usedBoxes.add(boxId); // プレビュー中に重複しないように追加
                return boxId;
            }
            boxNumber++;
        }
    };

    // 4. 解析結果ごとにボックスを割り当て
    return parsedResults.map(parsed => {
        if (!parsed.isValid) return parsed;

        const storageBoxes: string[] = [];
        for (let i = 0; i < parsed.quantity; i++) {
            storageBoxes.push(findNextAvailableBox());
        }

        return {
            ...parsed,
            storageBoxes
        };
    });
}
