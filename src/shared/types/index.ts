/**
 * 共通型定義
 * プロジェクト全体で使用される基本的な型
 */

export type ProcessStatus =
    | 'UNPRINTED'
    | 'PRINTED'
    | 'CUTTING'
    | 'SURFACE_TREATMENT'
    | 'PAINTING'
    | 'ASSEMBLED'
    | 'DEFECTIVE';

export interface Project {
    id: string;
    name: string;
    description: string;
    deadline: string;
    created_at?: any;
    updated_at?: any;
}

export interface Part {
    id: string;
    part_number: string;
    project_id: string;
    unit_id?: string | null;
}

export interface Unit {
    id: string;
    name: string;
    project_id: string;
    description?: string;
}

export interface Box {
    id: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
    updated_at: any;
}
