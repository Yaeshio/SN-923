'use server'

import { updateItemStatus as updateNew } from '@/src/modules/production/actions/updateItemStatus';

/**
 * @deprecated Use src/modules/production/actions/updateItemStatus
 */
export async function updateItemStatus(itemId: string | number, newStatus: string) {
    return updateNew(itemId, newStatus);
}
