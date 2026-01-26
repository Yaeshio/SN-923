// app/dashboad/data.ts
import { Part, PartItem } from './types';

export const parts: Part[] = [
  { id: 1, part_number: 'PART-A' },
  { id: 2, part_number: 'PART-B' }
];

export const partItems: PartItem[] = [
  { id: 101, part_id: 1, storage_case: 'Case-01', current_process: 'PRINTED', completed_at: null },
  { id: 102, part_id: 2, storage_case: 'Case-02', current_process: 'READY', completed_at: new Date() }
];