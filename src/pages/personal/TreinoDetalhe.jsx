// ─────────────────────────────────────────────────────────────
// Página de detalhe do treino (visão da Personal)
// Permite adicionar, visualizar e remover exercícios
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { listarExercicios, criarExercicio, removerExercicio, removerTreino, uploadVideo } from '../../services/treinos'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import EmptyState from '../../components/ui/EmptyState'
import ExercicioCard from './ExercicioCard'

const FORM_VAZIO = {
  nome: '', series: '', repeticoes: '', observacoes: '',
  videoUrl: '', videoFile: null, tipoVideo: 'link'  // 'link' | 'upload'
}

export default function TreinoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [treino, setTreino]         = useState(null)
  const [exercicios, setExercicios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm]             = useState(FORM_VAZIO)
  const [salvando, setSalvando]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const { data: t } = await supabase
        .from('treinos')
        .select('*, alunos(nome)')
        .eq('id', id)
        .single()

      setTreino(t)
      const ex = await listarExercicios(id)
      setExercicios(ex)
    } catch {
      setToast({ message: 'Erro ao carregar treino.', type: 'error' })
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function handleAddExercicio(e) {
    e.preventDefault()
    setSalvando(true)

    try {
      let videoUrl = form.videoUrl

      // Upload do arquivo de vídeo se necessário
      if (form.tipoVideo === 'upload' && form.videoFile) {
        videoUrl = await uploadVideo(form.videoFile)
      }

      await criarExercicio({
        treinoId:    id,
        nome:        form.nome,
        series:      Number(form.series),
        repeticoes:  form.repeticoes,
        observacoes: form.observacoes,
        videoUrl,
        ordem:       exercicios.length,
      })

      setForm(FORM_VAZIO)
      setMostrarForm(false)
      setToast({ message: 'Exercício adicionado!', type: 'success' })
      await carregar()
    } catch (err) {
      setToast({ message: err.message ?? 'Erro ao salvar exercício.', type: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  async function handleRemoverExercicio(exercicioId) {
    if (!confirm('Remover este exercício?')) return
    try {
      await removerExercicio(exercicioId)
      setExercicios(prev => prev.filter(e => e.id !== exercicioId))
      setToast({ message: 'Exercício removido.', type: 'info' })
    } catch {
      setToast({ message: 'Erro ao remover.', type: 'error' })
    }
  }

  async function handleRemoverTreino() {
    if (!confirm(`Remover o treino "${treino?.nome}" e todos os exercícios?`)) return
    try {
      await removerTreino(id)
      navigate('/personal')
    } catch {
      setToast({ message: 'Erro ao remover treino.', type: 'error' })
    }
  }

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <button onClick={() => navigate('/personal')} className="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
          ← Voltar ao painel
        </button>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{treino?.nome}</h1>
            <p className="text-gray-400 text-sm mt-1">👤 {treino?.alunos?.nome}</p>
            {treino?.descricao && (
              <p className="text-gray-500 text-sm mt-2">{treino.descricao}</p>
            )}
          </div>
          <button onClick={handleRemoverTreino} className="text-xs text-red-500 hover:text-red-400 shrink-0">
            Excluir treino
          </button>
        </div>

        {/* Lista de exercícios */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-300 mb-3">
            Exercícios ({exercicios.length})
          </h2>

          {exercicios.length === 0 ? (
            <EmptyState
              icon="🏋️"
              title="Nenhum exercício ainda"
              description="Adicione o primeiro exercício a este treino."
            />
          ) : (
            <div className="space-y-3">
              {exercicios.map((ex, i) => (
                <ExercicioCard
                  key={ex.id}
                  exercicio={ex}
                  numero={i + 1}
                  onRemover={() => handleRemoverExercicio(ex.id)}
                  isPersonal
                />
              ))}
            </div>
          )}
        </div>

        {/* Formulário para adicionar exercício */}
        {mostrarForm ? (
          <div className="card border-brand-500/30">
            <h3 className="font-semibold mb-4">Adicionar exercício</h3>
            <form onSubmit={handleAddExercicio} className="space-y-4">

              <div>
                <label className="label">Nome do exercício *</label>
                <input className="input" placeholder="Ex: Supino reto com barra" value={form.nome}
                  onChange={e => atualizar('nome', e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Séries *</label>
                  <input type="number" className="input" placeholder="Ex: 4" min={1} value={form.series}
                    onChange={e => atualizar('series', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Repetições *</label>
                  <input className="input" placeholder="Ex: 10-12" value={form.repeticoes}
                    onChange={e => atualizar('repeticoes', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Observações</label>
                <textarea className="input resize-none" rows={2} placeholder="Tempo de descanso, dicas de execução..."
                  value={form.observacoes} onChange={e => atualizar('observacoes', e.target.value)} />
              </div>

              {/* Vídeo: link ou upload */}
              <div>
                <label className="label">Vídeo (opcional)</label>
                <div className="flex gap-2 mb-2">
                  {['link', 'upload'].map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => atualizar('tipoVideo', tipo)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        form.tipoVideo === tipo
                          ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                          : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {tipo === 'link' ? '🔗 Link YouTube' : '📤 Upload'}
                    </button>
                  ))}
                </div>

                {form.tipoVideo === 'link' ? (
                  <input className="input" placeholder="https://youtube.com/watch?v=..."
                    value={form.videoUrl} onChange={e => atualizar('videoUrl', e.target.value)} />
                ) : (
                  <input
                    type="file"
                    accept="video/*"
                    className="input text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-brand-500/20 file:text-brand-400 cursor-pointer"
                    onChange={e => atualizar('videoFile', e.target.files[0])}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setMostrarForm(false); setForm(FORM_VAZIO) }}
                  className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={salvando}>
                  {salvando ? <><Spinner size="sm" /> Salvando...</> : 'Adicionar'}
                </button>
              </div>

            </form>
          </div>
        ) : (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full border-2 border-dashed border-gray-700 hover:border-brand-500/50 rounded-xl py-5 text-gray-500 hover:text-brand-400 transition-all text-sm font-medium"
          >
            + Adicionar exercício
          </button>
        )}

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
