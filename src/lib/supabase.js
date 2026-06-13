import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rthxlprgtfuhntpcdhsh.supabase.co'
const supabaseAnonKey = 'sb_publishable_26gFNnobXngam2_pe-TQOQ_5F43RKrp'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
