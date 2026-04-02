import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

// 브라우저 렌더링 시 서버 환경변수 접근 에러를 방지하기 위해 예외 처리
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '') 
  : ({} as any);

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
