/**
 * Production Module - 型定義
 * 工程アイテムと進捗に関する型
 */

import { ProcessStatus } from '@/src/shared/types';

export interface PartItem {
    id: string;
    part_id: string;
    /** 
     * @deprecated 今後は box_id を優先して使用してください。
     * このフィールドは既存コードとの互換性のために保持されています。
     */
    storage_case: string;
    /** 新しく導入する Box の ID */
    box_id: string | null;
    status: ProcessStatus;
    completed_at: Date | null;
    updated_at?: any;
    stl_url?: string;
}

export interface ProgressData {
    part_number: string;
    storage_cases: string[];
    counts: Record<ProcessStatus, number>;
}
