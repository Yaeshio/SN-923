import { ProcessStatus } from './types';

export const PROCESSES: { key: ProcessStatus; name: string }[] = [
  { key: 'UNPRINTED', name: '未プリント' },
  { key: 'PRINTED', name: 'プリント済' },
  { key: 'CUTTING', name: '切削' },
  { key: 'SURFACE_TREATMENT', name: '表面処理' },
  { key: 'PAINTING', name: '塗装' },
  { key: 'ASSEMBLED', name: '組付け済み' },
];