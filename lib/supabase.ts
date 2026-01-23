// Supabaseクライアントをインポート
import { createClient } from '@supabase/supabase-js'

// SupabaseのURLとサービスロールキーを環境変数から取得
// 環境変数が設定されていない場合は、プレースホルダーの値を使用
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Supabaseクライアントを作成
export const supabase = createClient(
  supabaseUrl,
  supabaseKey, // PoCなのでOK
  { auth: { persistSession: false } } // サーバーサイドでのみ使用するため、セッションの永続化は無効にする
)
