/**
 * Inventory Module - 型定義
 * 部品マスタと在庫に関する型
 */

export interface Part {
    id: number;
    part_number: string;
    project_id: number;
}

export interface ParsedFileInfo {
    /** 元のファイル名 */
    originalFileName: string;
    /** 抽出された部品番号 */
    partNumber: string;
    /** 個数（デフォルト: 1） */
    quantity: number;
    /** 解析が成功したか */
    isValid: boolean;
    /** エラーメッセージ（解析失敗時） */
    errorMessage?: string;
    /** 割り当てられる保管ボックスのリスト */
    storageBoxes?: string[];
}
