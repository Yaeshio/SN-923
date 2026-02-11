/**
 * Production Module - 型定義
 * 工程アイテムと進捗に関する型
 */

import { ProcessStatus } from '@/src/shared/types';

export interface PartItem {
    id: number;
    part_id: number;
    storage_case: string;
    status: ProcessStatus;
    completed_at: Date | null;
    updated_at?: any;
}

export interface ProgressData {
    part_number: string;
    storage_cases: string[];
    counts: Record<ProcessStatus, number>;
}
