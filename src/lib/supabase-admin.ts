import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Admin client with service role key for user management
const globalAny = globalThis as any

export const supabaseAdmin = globalAny.__supabaseAdmin ?? (globalAny.__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    // Use a unique storage key so it doesn't collide with the public client
    storageKey: 'sb-admin'
  }
}))
