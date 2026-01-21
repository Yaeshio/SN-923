import { supabase } from '@/lib/supabase'
import { updateProcess } from '@/app/actions/updateProcess'
import { consumeItem } from '@/app/actions/consumeItem'

const PROCESS = [
  'printed',
  'surface',
  'machining',
  'painting',
  'ready'
]

export default async function ItemPage({ params }: any) {
  const { data } = await supabase
    .from('part_items')
    .select(`
      id,
      current_process,
      parts ( part_number )
    `)
    .eq('id', params.id)
    .single() as any

  return (
    <div>
      <h1>{(data?.parts as any)?.[0]?.part_number || data?.parts?.part_number}</h1>
      <p>現在工程: {data?.current_process}</p>

      <form action={async (formData) => {
        'use server'
        await updateProcess(
          data.id,
          formData.get('next') as string
        )
      }}>
        <select name="next">
          {PROCESS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button>工程更新</button>
      </form>

      <form action={async () => {
        'use server'
        await consumeItem(data.id)
      }}>
        <button>組み込み完了</button>
      </form>
    </div>
  )
}
