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

export interface Unit {
  id: string;
  name: string;
  project_id: string;
  description?: string;
}

export interface Part {
  id: string;
  part_number: string;
  project_id: string;
  unit_id?: string | null;
}

export interface PartItem {
  id: string;
  part_id: string;
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