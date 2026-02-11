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
