import { ProcessStatus } from './types';

export const PROCESSES: { key: ProcessStatus; name: string }[] = [
  { key: 'UNPRINTED', name: '未プリント' },
  { key: 'PRINTED', name: 'プリント済み' },
  { key: 'SURFACE_TREATMENT', name: '表面処理' },
  { key: 'CUTTING', name: '切削' },
  { key: 'PAINTING', name: '塗装' },
  { key: 'READY', name: '準備完了' },
];