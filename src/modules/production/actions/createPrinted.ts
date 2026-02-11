'use server'

/**
 * Production Module - Create Printed Action
 * 3Dプリントされたアイテムの登録
 */

import { revalidatePath } from 'next/cache';
import { ProcessStatus } from '@/src/shared/types';
import { registerPrintedItems } from '@/src/modules/production/services/productionService';
import { parseFileName } from '@/src/modules/engineering/services/stlService';

/**
 * 3Dプリントされた新しい部品アイテムを作成するサーバーアクション
 * 
 * @param fileBuffer - STLファイルのArrayBuffer
 * @param fileName - ファイル名
 * @param projectId - プロジェクトID
 * @param qty - 数量
 * @param targetStatus - 初期ステータス（デフォルト: 'PRINTED'）
 */
export async function createPrinted(
    fileBuffer: ArrayBuffer,
    fileName: string,
    projectId: number,
    qty: number,
    targetStatus: ProcessStatus = 'PRINTED'
): Promise<{ success: boolean; partNumber: string }> {
    try {
        // 1. Engineering: ファイル名を解析して部品番号を取得
        const parsed = parseFileName(fileName);
        if (!parsed.isValid) {
            throw new Error(parsed.errorMessage || 'ファイル名の解析に失敗しました');
        }
        const partNumber = parsed.partNumber;

        // 2. Production: 印刷済みアイテムとして登録（トランザクション）
        const result = await registerPrintedItems(
            fileBuffer,
            partNumber,
            projectId,
            qty,
            targetStatus
        );

        console.log(`[CreatePrinted] Successfully created ${qty} items for part ${partNumber}`);
        revalidatePath('/');
        if (projectId) revalidatePath(`/project/${projectId}`);

        return { success: true, partNumber: result.partNumber };

    } catch (error) {
        console.error('[CreatePrinted] Error:', error);
        throw error;
    }
}
