// ─────────────────────────────────────────────────────────────
// src/services/treinos.js
//
// Operações de CRUD para treinos e exercícios.
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase'

// ── TREINOS ──────────────────────────────────────────────────

// Lista todos os treinos (com nome do aluno)
export async function listarTreinos() {
  const { data, error } = await supabase
    .from('treinos')
    .select(`*, alunos(nome)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Lista treinos de um aluno específico
export async function listarTreinosDoAluno(alunoId) {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('created_at', { ascending: false })

  console.log('TREINOS:', data)
  console.log('ERRO TREINOS:', error)

  if (error) throw error
  return data
}

// Cria um novo treino
export async function criarTreino({ nome, descricao, alunoId }) {
  const { data, error } = await supabase
    .from('treinos')
    .insert({ nome, descricao, aluno_id: alunoId })
    .select()
    .single()

  if (error) throw error
  return data
}

// Remove um treino (exercícios são removidos via CASCADE no banco)
export async function removerTreino(treinoId) {
  const { error } = await supabase
    .from('treinos')
    .delete()
    .eq('id', treinoId)

  if (error) throw error
}

// ── EXERCÍCIOS ───────────────────────────────────────────────

// Lista exercícios de um treino
export async function listarExercicios(treinoId) {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .eq('treino_id', treinoId)
    .order('ordem')

  if (error) throw error
  return data
}

// Cria um exercício
export async function criarExercicio({ treinoId, nome, series, repeticoes, observacoes, videoUrl, ordem }) {
  const { data, error } = await supabase
    .from('exercicios')
    .insert({
      treino_id: treinoId,
      nome,
      series,
      repeticoes,
      observacoes,
      video_url: videoUrl,
      ordem: ordem ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Remove um exercício
export async function removerExercicio(exercicioId) {
  const { error } = await supabase
    .from('exercicios')
    .delete()
    .eq('id', exercicioId)

  if (error) throw error
}

// ── UPLOAD DE VÍDEO ──────────────────────────────────────────

// Faz upload de vídeo e retorna a URL pública
export async function uploadVideo(file) {
  const ext = file.name.split('.').pop()

  const fileName =
    `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const path = `videos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('exercicios')
    .upload(path, file)

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('exercicios')
    .getPublicUrl(path)

  return publicUrl
}

// ── TREINO REALIZADO ─────────────────────────────────────────

// Marca treino como concluído
export async function marcarTreinoConcluido(treinoId, alunoId) {
  const { data, error } = await supabase
    .from('treino_realizado')
    .insert({ treino_id: treinoId, aluno_id: alunoId })
    .select()
    .single()

  if (error) throw error
  return data
}

// Verifica se um treino já foi concluído hoje
export async function treinoConcluidoHoje(treinoId, alunoId) {
  const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { data, error } = await supabase
    .from('treino_realizado')
    .select('id')
    .eq('treino_id', treinoId)
    .eq('aluno_id', alunoId)
    .gte('realizado_em', `${hoje}T00:00:00`)
    .lte('realizado_em', `${hoje}T23:59:59`)
    .maybeSingle()

  if (error) throw error
  return !!data
}
