'use server'

import { supabase } from '@/lib/supabase'

export async function consumeItem(itemId: string) {
  await supabase
    .from('part_items')
    .update({
      status: 'consumed',
      current_process: 'assembled',
      storage_case_id: null
    })
    .eq('id', itemId)
}
