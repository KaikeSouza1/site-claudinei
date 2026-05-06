// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente padrão: usado no lado do cliente e componentes normais. 
// Respeita as políticas de segurança (RLS) do Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente Admin: ignora segurança. 
// USE APENAS no lado do servidor (Server Actions, Route Handlers).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)