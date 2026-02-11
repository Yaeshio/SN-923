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

export interface Unit {
  id: string;
  name: string;
  project_id: number;
  description?: string;
}

export interface Part {
  id: number;
  part_number: string;
  project_id: number;
  unit_id?: string | null;
}

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