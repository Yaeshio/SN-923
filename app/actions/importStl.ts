'use server'

/**
 * 後方互換性のためのラッパー
 * 新しいモジュラーモノリス構造の Engineering Module に委譲
 */

import { ProcessStatus } from '@/app/types';
import { ParsedFileInfo } from '@/lib/utils/parseFileName';

// 新しいモジュール構造から関数をインポート
import {
    importSingleStl as importSingleStlNew,
    importMultipleStl as importMultipleStlNew,
    previewFileNames as previewFileNamesNew,
    type ImportResult
} from '@/src/modules/engineering/actions/importStl';

// 既存のインターフェースをエクスポート（後方互換性）
export type { ImportResult };

/**
 * 単一のSTLファイルをインポートする
 * @deprecated 新しいモジュール構造の importSingleStl を使用してください
 */
export async function importSingleStl(
    fileBuffer: ArrayBuffer,
    fileName: string,
    projectId: number,
    defaultStatus: ProcessStatus = 'CUTTING'
): Promise<ImportResult> {
    return importSingleStlNew(fileBuffer, fileName, projectId, defaultStatus);
}

/**
 * 複数のSTLファイルを一括インポートする
 * @deprecated 新しいモジュール構造の importMultipleStl を使用してください
 */
export async function importMultipleStl(
    filesData: Array<{ buffer: ArrayBuffer; name: string }>,
    projectId: number,
    defaultStatus: ProcessStatus = 'CUTTING'
): Promise<ImportResult[]> {
    return importMultipleStlNew(filesData, projectId, defaultStatus);
}

/**
 * ファイル名のプレビュー解析（実際のインポートは行わない）
 * @deprecated 新しいモジュール構造の previewFileNames を使用してください
 */
export async function previewFileNames(fileNames: string[]): Promise<ParsedFileInfo[]> {
    return previewFileNamesNew(fileNames);
}
