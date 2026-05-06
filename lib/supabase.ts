// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente padrão: usado no lado do cliente e componentes normais. 
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pega a chave admin (o Next.js só libera isso no backend)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente Admin: ignora segurança.
// A condição "??" evita que o navegador tente criar e trave a tela.
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null