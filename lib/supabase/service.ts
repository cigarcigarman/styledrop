import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// RLS 우회용 서비스 롤 클라이언트 — 서버에서만 사용
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
