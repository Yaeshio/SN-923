export type Process =
  | 'UNPRINTED'
  | 'PRINTED'
  | 'SURFACE_TREATMENT'
  | 'CUTTING'
  | 'PAINTING'
  | 'READY';

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
}

export interface PartItem {
  id: number;
  part_id: number;
  storage_case: string;
  current_process: Process;
  completed_at: Date | null;
}

export interface ProgressData {
  part_number: string;
  storage_cases: string[];
  counts: Record<Process, number>;
}