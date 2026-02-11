// app/utils.ts
import { Part, PartItem, ProgressData, ProcessStatus } from './types';
import { PROCESSES } from './constants';

export const aggregateProgress = (parts: Part[], partItems: PartItem[]): any[] => {
  return parts.map(part => {
    const items = partItems.filter(item => item.part_id === part.id);

    // この部品の中で最も「進んでいない」工程を現在の工程とする
    // (全て完了していれば READY となる)
    const processOrder = PROCESSES.map(p => p.key);
    const currentProcess = items.length > 0
      ? items.reduce((earliest, item) => {
        return processOrder.indexOf(item.status) < processOrder.indexOf(earliest)
          ? item.status
          : earliest;
      }, 'READY' as ProcessStatus)
      : 'UNPRINTED';

    return {
      id: part.id,
      part_number: part.part_number,
      status: currentProcess, // Rename field
      storage_cases: Array.from(new Set(items.map(i => i.storage_case))),
      count: items.length,
      unit_id: part.unit_id
    };
  });
};

export const calculateUnitProgress = (parts: Part[], partItems: PartItem[]): number => {
  if (parts.length === 0) return 0;

  const aggregated = aggregateProgress(parts, partItems);
  const readyCount = aggregated.filter(p => p.status === 'READY').length;

  return Math.round((readyCount / parts.length) * 100);
};