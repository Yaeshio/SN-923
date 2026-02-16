'use server'

/**
 * Engineering Module - Import STL Action
 * STLファイルのインポートを統括するオーケストレーター
 */

import { revalidatePath } from 'next/cache';
import { ProcessStatus } from '@/src/shared/types';
import { ParsedFileInfo } from '@/src/modules/inventory/types';

// Engineering Services
import {
    parseFileName,
    uploadStlFile
} from '@/src/modules/engineering/services/stlService';

// Inventory Services
import { ensurePartExists } from '@/src/modules/inventory/services/partService';
import {
    allocateBoxes,
    previewBoxAllocation
} from '@/src/modules/inventory/services/boxService';

// Production Services
import { createItems } from '@/src/modules/production/services/itemService';

export interface ImportResult {
    success: boolean;
    fileName: string;
    partNumber?: string;
    partId?: string;
    itemsCreated?: number;
    error?: string;
}

/**
 * 単一のSTLファイルをインポートする
 * 
 * @param fileBuffer - アップロードするファイル（ArrayBuffer）
 * @param fileName - ファイル名
 * @param projectId - プロジェクトID
 * @param defaultStatus - 初期ステータス（デフォルト: 'CUTTING'）
 * @returns インポート結果
 */
export async function importSingleStl(
    fileBuffer: ArrayBuffer,
    fileName: string,
    projectId: string,
    defaultStatus: ProcessStatus = 'CUTTING'
): Promise<ImportResult> {
    try {
        // 1. Engineering: ファイル名を解析
        const parsed = parseFileName(fileName);

        if (!parsed.isValid) {
            return {
                success: false,
                fileName,
                error: parsed.errorMessage || 'ファイル名の解析に失敗しました'
            };
        }

        const { partNumber, quantity } = parsed;

        // 2. Engineering: Firebase Storage にアップロード
        const downloadUrl = await uploadStlFile(fileBuffer, partNumber, projectId as any);
        console.log(`[ImportSTL] Uploaded file: ${downloadUrl}`);

        // 3. Inventory: 部品マスタの確認・作成
        const part = await ensurePartExists(partNumber, projectId);

        // 4. Inventory: ボックスの確保（空き箱を探す）
        const boxes = await allocateBoxes(quantity);

        // 5. Production: アイテムの生成とステータス初期化
        await createItems(part.id, quantity, boxes, defaultStatus);

        // 6. キャッシュを再検証
        revalidatePath('/');
        revalidatePath(`/project/${projectId}`);

        return {
            success: true,
            fileName,
            partNumber,
            partId: part.id,
            itemsCreated: quantity
        };

    } catch (error) {
        console.error('[ImportSTL] Error importing STL:', error);
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
 * @param filesData - アップロードするファイルの配列
 * @param projectId - プロジェクトID
 * @param defaultStatus - 初期ステータス
 * @returns インポート結果の配列
 */
export async function importMultipleStl(
    filesData: Array<{ buffer: ArrayBuffer; name: string }>,
    projectId: string,
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
 * @returns 解析結果の配列（ボックス割り当て情報付き）
 */
export async function previewFileNames(fileNames: string[]): Promise<ParsedFileInfo[]> {
    // 1. 各ファイル名を解析
    const parsedResults = fileNames.map(parseFileName);

    // 2. 有効な解析結果のみを抽出
    const validResults = parsedResults.filter(r => r.isValid);
    const quantities = validResults.map(r => r.quantity);

    // 3. ボックス割り当てをシミュレート
    const boxAllocations = await previewBoxAllocation(quantities);

    // 4. 解析結果にボックス情報を追加
    let validIndex = 0;
    return parsedResults.map(parsed => {
        if (!parsed.isValid) {
            return parsed;
        }

        const storageBoxes = boxAllocations[validIndex];
        validIndex++;

        return {
            ...parsed,
            storageBoxes
        };
    });
}
