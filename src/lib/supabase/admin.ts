import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * This client uses the SERVICE_ROLE_KEY to bypass Row Level Security (RLS).
 * MUST ONLY BE USED ON THE SERVER.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
