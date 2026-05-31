// ─────────────────────────────────────────────────────────────
// Página de treino do Aluno
// - Exibe exercícios com edição + SALVAMENTO de carga/reps/séries
// - Botão para enviar feedback do treino via WhatsApp
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { buscarAlunoPorUserId } from '../../services/alunos'
import { listarExercicios, marcarTreinoConcluido, treinoConcluidoHoje } from '../../services/treinos'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────
function getYoutubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// ── Busca ajustes salvos do aluno no banco ────────────────────
async function buscarAjustes(exercicioIds, alunoId) {
  if (!exercicioIds.length) return {}
  const { data, error } = await supabase
    .from('exercicio_ajustes')
    .select('*')
    .eq('aluno_id', alunoId)
    .in('exercicio_id', exercicioIds)
  if (error) throw error
  // Transforma em mapa: { [exercicio_id]: { carga_kg, repeticoes } }
  return Object.fromEntries((data ?? []).map(r => [r.exercicio_id, r]))
}

// ── Salva ajuste de um exercício no banco (upsert) ────────────
async function salvarAjuste(exercicioId, alunoId, carga, repeticoes, series) {
  const { error } = await supabase
    .from('exercicio_ajustes')
    .upsert(
      {
        exercicio_id: exercicioId,
        aluno_id:     alunoId,
        carga_kg:     carga   !== '' ? Number(carga)  : null,
        repeticoes:   repeticoes || null,
        series:       series  !== '' ? Number(series) : null,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'exercicio_id,aluno_id' }
    )
  if (error) throw error
}

// ── Card de exercício com edição + botão salvar ───────────────
function ExercicioCardAluno({ exercicio, numero, ajuste, alunoId, onSalvo }) {
  const youtubeId = getYoutubeId(exercicio.video_url)
  const isUpload  = exercicio.video_url && !youtubeId

  // Valores locais do form (inicializam com o que está salvo no banco)
  const [editando,   setEditando]   = useState(false)
  const [carga,      setCarga]      = useState(ajuste?.carga_kg ?? '')
  const [repeticoes, setRepeticoes] = useState(ajuste?.repeticoes ?? '')
  const [series,     setSeries]     = useState(ajuste?.series ?? '')
  const [salvando,   setSalvando]   = useState(false)

  // Atualiza campos se o ajuste carregado do banco mudar
  useEffect(() => {
    setCarga(ajuste?.carga_kg ?? '')
    setRepeticoes(ajuste?.repeticoes ?? '')
    setSeries(ajuste?.series ?? '')
  }, [ajuste])

  async function handleSalvar() {
    setSalvando(true)
    try {
      await salvarAjuste(exercicio.id, alunoId, carga, repeticoes, series)
      setEditando(false)
      onSalvo(exercicio.id, {
        carga_kg:   carga   !== '' ? Number(carga)  : null,
        repeticoes: repeticoes || null,
        series:     series  !== '' ? Number(series) : null,
      })
    } finally {
      setSalvando(false)
    }
  }

  // Valores a exibir no card (banco > vazio)
  const cargaExibida = ajuste?.carga_kg ?? null
  const repsExibidas = ajuste?.repeticoes ?? exercicio.repeticoes
  const seriesExibidas = ajuste?.series ?? exercicio.series

  return (
    <div className="card space-y-3">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            {numero}
          </span>
          <div>
            <h4 className="font-semibold leading-tight">{exercicio.nome}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                {seriesExibidas} séries
              </span>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                {repsExibidas} reps
              </span>
              {cargaExibida !== null && (
                <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                  💪 {cargaExibida} kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botão abrir/fechar painel */}
        <button
          onClick={() => setEditando(e => !e)}
          className="text-xs text-gray-500 hover:text-brand-400 transition-colors shrink-0 flex items-center gap-1"
        >
          ✏️ <span className="hidden sm:inline">{editando ? 'Fechar' : 'Ajustar'}</span>
        </button>
      </div>

      {/* Painel de edição */}
      {editando && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Ajuste seus valores e salve:</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Séries</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder={String(exercicio.series)}
                value={series}
                onChange={e => setSeries(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Repetições</label>
              <input
                type="text"
                placeholder={exercicio.repeticoes}
                value={repeticoes}
                onChange={e => setRepeticoes(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Carga (kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 20"
                value={carga}
                onChange={e => setCarga(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {salvando ? (
              <><Spinner size="sm" /> Salvando...</>
            ) : (
              <>✅ Salvar ajuste</>
            )}
          </button>
        </div>
      )}

      {/* Observações */}
      {exercicio.observacoes && (
        <p className="text-sm text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
          💬 {exercicio.observacoes}
        </p>
      )}

      {/* Vídeo YouTube */}
      {youtubeId && (
        <div className="rounded-xl overflow-hidden aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={exercicio.nome}
          />
        </div>
      )}

      {/* Vídeo do Storage */}
      {isUpload && (
        <video src={exercicio.video_url} controls className="w-full rounded-xl" preload="metadata" />
      )}
    </div>
  )
}

// ── Modal de feedback para WhatsApp ──────────────────────────
function ModalFeedbackWpp({ treino, exercicios, ajustes, aluno, onClose }) {
  const [feedback, setFeedback] = useState('')
  const [melhoras, setMelhoras] = useState('')

  function gerarMensagem() {
    const data = new Date().toLocaleDateString('pt-BR')
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let msg = `💪 *Relatório de Treino — ${aluno?.nome ?? 'Aluno'}*\n`
    msg += `📅 ${data} às ${hora}\n`
    msg += `📋 Treino: *${treino?.nome ?? ''}*\n\n`
    msg += `*Exercícios realizados:*\n`

    exercicios.forEach((ex, i) => {
      const aj    = ajustes[ex.id]
      const carga  = aj?.carga_kg != null ? ` — ${aj.carga_kg} kg` : ''
      const reps   = aj?.repeticoes ?? ex.repeticoes
      const series = aj?.series     ?? ex.series
      msg += `${i + 1}. ${ex.nome} | ${series}x${reps}${carga}\n`
    })

    if (feedback.trim()) msg += `\n💬 *Como foi o treino:*\n${feedback.trim()}\n`
    if (melhoras.trim()) msg += `\n🎯 *O que posso melhorar:*\n${melhoras.trim()}\n`
    msg += `\n_Enviado pelo app FitCoach_ 🏋️`
    return msg
  }

function enviarWpp() {
  const encoded = encodeURIComponent(gerarMensagem())
  const url = `https://wa.me/5521997069570?text=${encoded}`
  window.open(url, '_blank')
  onClose()
}

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">📲 Enviar via WhatsApp</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-400">
          O resumo do treino de <span className="text-white font-medium">{aluno?.nome}</span> será enviado. Adicione um comentário:
        </p>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Como foi o treino? (opcional)</label>
          <textarea
            rows={3}
            placeholder="Ex: Aumentei a carga no supino, senti leve dor no joelho..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">O que quer melhorar? (opcional)</label>
          <textarea
            rows={2}
            placeholder="Ex: Quero melhorar minha resistência no cardio..."
            value={melhoras}
            onChange={e => setMelhoras(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={enviarWpp}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            📱 Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function TreinoAluno() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [treino,     setTreino]     = useState(null)
  const [exercicios, setExercicios] = useState([])
  const [aluno,      setAluno]      = useState(null)
  const [feito,      setFeito]      = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [concluindo, setConcluindo] = useState(false)
  const [toast,      setToast]      = useState(null)
  const [ajustes,    setAjustes]    = useState({})   // { [exercicioId]: { carga_kg, repeticoes } }
  const [modalWpp,   setModalWpp]   = useState(false)

  const carregar = useCallback(async () => {
    try {
      if (!user) return

      const a  = await buscarAlunoPorUserId(user.id)
      setAluno(a)

      const { data: t } = await supabase.from('treinos').select('*').eq('id', id).single()
      setTreino(t)

      const ex = await listarExercicios(id)
      setExercicios(ex)

      // Carrega ajustes salvos do aluno no banco
      const aj = await buscarAjustes(ex.map(e => e.id), a.id)
      setAjustes(aj)

      const concluidoHoje = await treinoConcluidoHoje(id, a.id)
      setFeito(concluidoHoje)
    } catch {
      setToast({ message: 'Erro ao carregar treino.', type: 'error' })
    } finally {
      setCarregando(false)
    }
  }, [id, user])

  useEffect(() => { carregar() }, [carregar])

  // Chamado pelo card após salvar com sucesso — atualiza estado local
  function handleAjusteSalvo(exercicioId, novoAjuste) {
    setAjustes(prev => ({ ...prev, [exercicioId]: { ...prev[exercicioId], ...novoAjuste } }))
    setToast({ message: '✅ Ajuste salvo!', type: 'success' })
  }

  async function handleConcluir() {
    if (feito) return
    setConcluindo(true)
    try {
      await marcarTreinoConcluido(id, aluno.id)
      setFeito(true)
      setToast({ message: '🎉 Treino concluído! Ótimo trabalho!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message ?? 'Erro ao registrar conclusão.', type: 'error' })
    } finally {
      setConcluindo(false)
    }
  }

  if (!user || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/aluno')} className="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
          ← Meus treinos
        </button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{treino?.nome}</h1>
            {feito && (
              <span className="shrink-0 bg-brand-500/20 border border-brand-500/40 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Concluído hoje
              </span>
            )}
          </div>
          {treino?.descricao && <p className="text-gray-400 text-sm mt-2">{treino.descricao}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            💡 Toque em ✏️ para ajustar sua carga e repetições — os valores são salvos no banco
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {exercicios.map((ex, i) => (
            <ExercicioCardAluno
              key={ex.id}
              exercicio={ex}
              numero={i + 1}
              ajuste={ajustes[ex.id]}
              alunoId={aluno?.id}
              onSalvo={handleAjusteSalvo}
            />
          ))}
        </div>

        <div className="space-y-3 sticky bottom-4">
          <button
            onClick={() => setModalWpp(true)}
            className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-green-600/40 bg-green-600/10 text-green-400 hover:bg-green-600/20 active:scale-[0.98]"
          >
            📲 Enviar relatório via WhatsApp
          </button>

          <button
            onClick={handleConcluir}
            disabled={feito || concluindo}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              feito
                ? 'bg-brand-500/20 border-2 border-brand-500/40 text-brand-400 cursor-default'
                : 'bg-brand-500 hover:bg-brand-400 text-white active:scale-[0.98]'
            }`}
          >
            {concluindo ? <><Spinner size="sm" /> Registrando...</> : feito ? <>✅ Treino concluído!</> : <>💪 Marcar como concluído</>}
          </button>
        </div>

      </main>

      {modalWpp && (
        <ModalFeedbackWpp
          treino={treino}
          exercicios={exercicios}
          ajustes={ajustes}
          aluno={aluno}
          onClose={() => setModalWpp(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
