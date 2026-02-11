'use server'

/**
 * 後方互換性のためのラッパー
 * 新しいモジュラーモノリス構造の Production Module に委譲
 */

import { ProcessStatus } from '@/app/types';

// 新しいモジュール構造から関数をインポート
import { updateProcess as updateProcessNew } from '@/src/modules/production/actions/updateProcess';

/**
 * 部品アイテムの工程を更新するサーバーアクション
 * @deprecated 新しいモジュール構造の updateProcess を使用してください
 */
export async function updateProcess(
  itemId: string | number,
  nextProcess: string,
  projectId?: number
) {
  return updateProcessNew(itemId, nextProcess, projectId);
}
