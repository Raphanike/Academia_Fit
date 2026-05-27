// ─────────────────────────────────────────────────────────────
// src/lib/supabase.js
// Cria e exporta o cliente único do Supabase.
// As credenciais vêm das variáveis de ambiente do .env
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.\n' +
    'Crie um arquivo .env na raiz do projeto com essas variáveis.\n' +
    'Veja o arquivo .env.example para referência.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)
