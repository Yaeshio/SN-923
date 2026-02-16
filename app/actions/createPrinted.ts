'use server'

/**
 * 後方互換性のためのラッパー
 * 新しいモジュラーモノリス構造の Production Module に委譲
 */

import { ProcessStatus } from '@/app/types';

// 新しいモジュール構造から関数をインポート
import { createPrinted as createPrintedNew } from '@/src/modules/production/actions/createPrinted';

/**
 * 3Dプリントされた新しい部品アイテムを作成するサーバーアクション
 * @deprecated 新しいモジュール構造の createPrinted を使用してください
 */
export async function createPrinted(
  fileBuffer: ArrayBuffer,
  fileName: string,
  projectId: string,
  qty: number,
  targetStatus: ProcessStatus = 'PRINTED'
): Promise<{ success: boolean; partNumber: string }> {
  return createPrintedNew(
    fileBuffer,
    fileName,
    projectId,
    qty,
    targetStatus
  );
}
