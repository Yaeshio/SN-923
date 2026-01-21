'use server'

import { supabase } from '@/lib/supabase'

export async function createPrinted(
  partId: string,
  qty: number,
  storageCaseId: string
) {
  for (let i = 0; i < qty; i++) {
    const { data, error } = await supabase
      .from('part_items')
      .insert({
        part_id: partId,
        current_process: 'printed',
        storage_case_id: storageCaseId
      })
      .select()
      .single()

    if (data) {
      await supabase.from('part_process_logs').insert({
        part_item_id: data.id,
        process: 'printed'
      })
    }

    if (error) throw error
  }
}
