import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 서버 전용 — RLS 우회. API Route에서만 사용할 것.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 클라이언트용 — 향후 인증 흐름에서 사용
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
