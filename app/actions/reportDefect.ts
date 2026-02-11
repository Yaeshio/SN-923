'use server'

import { reportDefect as reportDefectNew } from '@/src/modules/production/actions/reportDefect';

/**
 * @deprecated Use src/modules/production/actions/reportDefect
 */
export async function reportDefect(itemId: number | string, reason: string) {
    return reportDefectNew(itemId, reason);
}