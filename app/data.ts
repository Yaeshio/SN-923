// app/data.ts
import { Part, PartItem, Project } from './types';

export const projects: Project[] = [
  { id: 1, name: '次世代ドローン開発', description: '高解像度カメラ搭載の新型ドローン開発プロジェクト', deadline: '2026-06-30' },
  { id: 2, name: '搬送ロボット製作', description: '倉庫内自動配送を行う自律走行ロボットの試作', deadline: '2026-04-15' }
];

export const parts: Part[] = [
  { id: 1, part_number: 'DRONE-ARM-01', project_id: 1 },
  { id: 2, part_number: 'DRONE-BODY-01', project_id: 1 },
  { id: 3, part_number: 'DRONE-PROP-01', project_id: 1 },
  { id: 4, part_number: 'ROBO-WHEEL-X', project_id: 2 }
];

export const partItems: PartItem[] = [
  // DRONE-ARM-01 (id: 1) - 分散配置
  { id: 101, part_id: 1, storage_case: 'Case-A1', status: 'UNPRINTED', completed_at: null },
  { id: 102, part_id: 1, storage_case: 'Case-A1', status: 'PRINTED', completed_at: null },
  { id: 103, part_id: 1, storage_case: 'Case-A2', status: 'PRINTED', completed_at: null },
  { id: 104, part_id: 1, storage_case: 'Case-A3', status: 'SURFACE_TREATMENT', completed_at: null },
  { id: 105, part_id: 1, storage_case: 'Case-A4', status: 'ASSEMBLED', completed_at: new Date() },

  // DRONE-BODY-01 (id: 2) - 特定工程に集中
  { id: 201, part_id: 2, storage_case: 'Case-B1', status: 'SURFACE_TREATMENT', completed_at: null },
  { id: 202, part_id: 2, storage_case: 'Case-B1', status: 'SURFACE_TREATMENT', completed_at: null },
  { id: 203, part_id: 2, storage_case: 'Case-B2', status: 'PAINTING', completed_at: null },

  // DRONE-PROP-01 (id: 3) - 少ないアイテム、不良あり
  { id: 301, part_id: 3, storage_case: 'Case-C1', status: 'UNPRINTED', completed_at: null },
  { id: 302, part_id: 3, storage_case: 'Case-C2', status: 'DEFECTIVE', completed_at: null },

  // ROBO-WHEEL-X (id: 4) - 別プロジェクト
  { id: 401, part_id: 4, storage_case: 'Case-R1', status: 'ASSEMBLED', completed_at: new Date(new Date().setDate(new Date().getDate() - 2)) }
];