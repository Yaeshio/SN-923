'use server'

import { supabase } from '@/lib/supabase'

export async function updateProcess(
  itemId: string,
  nextProcess: string
) {
  await supabase
    .from('part_items')
    .update({ current_process: nextProcess })
    .eq('id', itemId)

  await supabase.from('part_process_logs').insert({
    part_item_id: itemId,
    process: nextProcess
  })
}
