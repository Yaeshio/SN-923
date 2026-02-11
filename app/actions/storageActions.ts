'use server'

import {
    releaseStorageCase as releaseNew,
    getStorageBoxStatus as getStatusNew
} from '@/src/modules/inventory/actions/storageActions';

/**
 * @deprecated Use src/modules/inventory/actions/storageActions
 */
export async function releaseStorageCase(itemId: number) {
    return releaseNew(itemId);
}

/**
 * @deprecated Use src/modules/inventory/actions/storageActions
 */
export async function getStorageBoxStatus(maxBoxNumber: number = 100) {
    return getStatusNew(maxBoxNumber);
}
