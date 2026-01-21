import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data } = await supabase
    .from('part_items')
    .select(`
      id,
      current_process,
      parts ( part_number )
    `)
    .eq('status', 'in_progress') as any

  return (
    <main>
      <h1>在庫一覧</h1>

      <Link href="/print">▶ 3Dプリント登録</Link>

      <ul>
        {data?.map((item: any) => (
          <li key={item.id}>
            {(item?.parts as any)?.[0]?.part_number || item?.parts?.part_number} | {item.current_process}
            {' '}
            <Link href={`/item/${item.id}`}>詳細</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
