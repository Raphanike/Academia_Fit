// supabase/functions/criar-aluno/index.ts
//
// Edge Function — cria um aluno sem deslogar a personal
// Roda no servidor do Supabase usando a service_role key

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Responde ao preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verifica se quem chamou é a personal ──────────────
    // Pega o token do header Authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    // Cliente com a chave do usuário atual (para verificar o role)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verifica se o usuário logado é personal
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'personal') {
      throw new Error('Apenas a personal pode cadastrar alunos')
    }

    // ── 2. Lê os dados do novo aluno ─────────────────────────
    const { nome, email, senha, telefone } = await req.json()

    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios')
    }

    // ── 3. Cria o usuário usando service_role (sem trocar sessão) ──
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // chave admin
    )

    console.log('EMAIL RECEBIDO:', email)

    const { data: novoUsuario, error: erroAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,  // já confirma o email automaticamente
      user_metadata: { nome, role: 'aluno' }
    })

    if (erroAuth) throw erroAuth

    const userId = novoUsuario.user.id

    // ── 4. Cria o perfil na tabela profiles ──────────────────
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      nome,
      role: 'aluno',
    })

    // ── 5. Cria o registro na tabela alunos ──────────────────
    const { data: aluno, error: erroAluno } = await supabaseAdmin
      .from('alunos')
      .insert({ user_id: userId, nome, email, telefone })
      .select()
      .single()

    if (erroAluno) throw erroAluno

     // ── 6. Retorna o aluno criado ─────────────────────────────
    return new Response(
      JSON.stringify({ aluno }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (err) {
    console.error('ERRO COMPLETO EDGE:', err)

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})