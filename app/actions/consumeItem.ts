'use server'

import { consumeItem as consumeItemNew } from '@/src/modules/production/actions/consumeItem';

/**
 * @deprecated Use src/modules/production/actions/consumeItem
 */
export async function consumeItem(itemId: string | number) {
  return consumeItemNew(itemId);
}
