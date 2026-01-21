import { createPrinted } from '../actions/createPrinted'
import { supabase } from '@/lib/supabase'

export default async function PrintPage() {
  const { data: parts } = await supabase.from('parts').select() as any
  const { data: cases } = await supabase.from('storage_cases').select() as any

  return (
    <form action={async (formData: any) => {
      'use server'
      await createPrinted(
        formData.get('part') as string,
        Number(formData.get('qty')),
        formData.get('case') as string
      )
    }}>
      <h1>3Dプリント完了</h1>

      <select name="part">
        {parts?.map((p: any) => (
          <option key={p.id} value={p.id}>{p.part_number}</option>
        ))}
      </select>

      <input name="qty" type="number" defaultValue={1} />

      <select name="case">
        {cases?.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button type="submit">登録</button>
    </form>
  )
}
