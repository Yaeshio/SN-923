/**
 * Production Module - 型定義
 * 工程アイテムと進捗に関する型
 */

import { ProcessStatus } from '@/src/shared/types';

export interface PartItem {
    id: string;
    part_id: string;
    storage_case: string;
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
