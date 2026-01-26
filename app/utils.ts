import { Part, PartItem, ProgressData, Process } from './types';

export const aggregateProgress = (parts: Part[], partItems: PartItem[]): ProgressData[] => {
  const progressMap = new Map<string, { storage_cases: Set<string>; counts: Record<Process, number> }>();

  parts.forEach(part => {
    progressMap.set(part.part_number, {
      storage_cases: new Set(),
      counts: {
        UNPRINTED: 0, PRINTED: 0, SURFACE_TREATMENT: 0,
        CUTTING: 0, PAINTING: 0, READY: 0,
      },
    });
  });

  partItems.forEach(item => {
    const part = parts.find(p => p.id === item.part_id);
    if (part) {
      const currentData = progressMap.get(part.part_number);
      if (currentData) {
        currentData.counts[item.current_process]++;
        currentData.storage_cases.add(item.storage_case);
      }
    }
  });

  return Array.from(progressMap.entries()).map(([part_number, data]) => ({
    part_number,
    storage_cases: Array.from(data.storage_cases).sort(),
    counts: data.counts,
  }));
};