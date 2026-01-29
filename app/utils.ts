// app/utils.ts
import { Part, PartItem, ProgressData, Process } from './types';
import { PROCESSES } from './constants';

export const aggregateProgress = (parts: Part[], partItems: PartItem[]): any[] => {
  return parts.map(part => {
    const items = partItems.filter(item => item.part_id === part.id);

    // この部品の中で最も「進んでいない」工程を現在の工程とする
    // (全て完了していれば READY となる)
    const processOrder = PROCESSES.map(p => p.key);
    const currentProcess = items.length > 0
      ? items.reduce((earliest, item) => {
        return processOrder.indexOf(item.current_process) < processOrder.indexOf(earliest)
          ? item.current_process
          : earliest;
      }, 'READY' as Process)
      : 'UNPRINTED';

    return {
      id: part.id,
      part_number: part.part_number,
      current_process: currentProcess,
      storage_cases: Array.from(new Set(items.map(i => i.storage_case))),
      count: items.length
    };
  });
};