// ─────────────────────────────────────────────────────────────
// src/services/alunos.js
// Todas as operações relacionadas a alunos no banco de dados.
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase'

// Lista todos os alunos cadastrados
export async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .order('nome')

  if (error) throw error
  return data
}

// Cria um novo aluno via Edge Function (não desloga a personal)
export async function criarAluno({ nome, email, senha, telefone }) {
  const { data, error } = await supabase.functions.invoke('criar-aluno', {
    body: { nome, email, senha, telefone }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

// Busca um aluno pelo user_id
export async function buscarAlunoPorUserId(userId) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('BUSCANDO ALUNO:', userId)
  console.log('ALUNO ENCONTRADO:', data)
  console.log('ERRO ALUNO:', error)

  if (error) throw error

  return data
}
