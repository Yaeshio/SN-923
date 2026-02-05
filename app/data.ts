// app/data.ts
import { Part, PartItem, Project } from './types';

export const projects: Project[] = [
  { id: 1, name: '次世代ドローン開発', description: '高解像度カメラ搭載の新型ドローン開発プロジェクト', deadline: '2026-06-30' },
  { id: 2, name: '搬送ロボット製作', description: '倉庫内自動配送を行う自律走行ロボットの試作', deadline: '2026-04-15' }
];

export const parts: Part[] = [
  { id: 1, part_number: 'PART-A', project_id: 1 },
  { id: 2, part_number: 'PART-B', project_id: 1 },
  { id: 3, part_number: 'PART-C', project_id: 2 }
];

export const partItems: PartItem[] = [
  { id: 101, part_id: 1, storage_case: 'Case-01', status: 'PRINTED', completed_at: null },
  { id: 102, part_id: 2, storage_case: 'Case-02', status: 'READY', completed_at: new Date() },
  { id: 103, part_id: 3, storage_case: 'Case-03', status: 'UNPRINTED', completed_at: null }
];