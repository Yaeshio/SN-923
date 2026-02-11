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
    id: number;
    name: string;
    description: string;
    deadline: string;
}

export interface Part {
    id: number;
    part_number: string;
    project_id: number;
    unit_id?: string | null;
}

export interface Unit {
    id: string;
    name: string;
    project_id: number;
    description?: string;
}
