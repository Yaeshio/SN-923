/**
 * Inventory Module - 型定義
 * 部品マスタと在庫に関する型
 */

export interface Part {
    id: string;
    part_number: string;
    project_id: string;
    unit_id?: string | null;
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

/**
 * 物理的な箱（パーツ保管用）の型定義
 */
export interface Box {
    /** FirestoreのドキュメントID (例: "BOX-001") */
    id: string;
    /** 物理的な箱の名称 (例: "棚A-1") */
    name: string;
    /** 現在部品が入っているかどうか */
    is_occupied: boolean;
    /** 紐付いている PartItem の ID */
    current_item_id: string | null;
    /** 最終更新日時（FirestoreのTimestamp想定） */
    last_used_at?: any;
}
