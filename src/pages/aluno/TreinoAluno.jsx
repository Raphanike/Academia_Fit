// ─────────────────────────────────────────────────────────────
// Página de treino do Aluno
// Exibe exercícios e botão para marcar como concluído
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
import ExercicioCard from '../personal/ExercicioCard'

export default function TreinoAluno() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [treino, setTreino]         = useState(null)
  const [exercicios, setExercicios] = useState([])
  const [aluno, setAluno]           = useState(null)
  const [feito, setFeito]           = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [concluindo, setConcluindo] = useState(false)
  const [toast, setToast]           = useState(null)

  const carregar = useCallback(async () => {
    try {
      // Busca dados do aluno
     if (!user) return

const a = await buscarAlunoPorUserId(user.id)
      setAluno(a)

      // Busca dados do treino
      const { data: t } = await supabase
        .from('treinos')
        .select('*')
        .eq('id', id)
        .single()
      setTreino(t)

      // Busca exercícios
      const ex = await listarExercicios(id)
      setExercicios(ex)

      // Verifica se já foi concluído hoje
      const concluidoHoje = await treinoConcluidoHoje(id, a.id)
      setFeito(concluidoHoje)
    } catch {
      setToast({ message: 'Erro ao carregar treino.', type: 'error' })
    } finally {
      setCarregando(false)
    }
 }, [id, user])

  useEffect(() => { carregar() }, [carregar])

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

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <button onClick={() => navigate('/aluno')} className="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
          ← Meus treinos
        </button>

        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{treino?.nome}</h1>
            {feito && (
              <span className="shrink-0 bg-brand-500/20 border border-brand-500/40 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Concluído hoje
              </span>
            )}
          </div>
          {treino?.descricao && (
            <p className="text-gray-400 text-sm mt-2">{treino.descricao}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-3 mb-8">
          {exercicios.map((ex, i) => (
            <ExercicioCard
              key={ex.id}
              exercicio={ex}
              numero={i + 1}
              isPersonal={false}
            />
          ))}
        </div>

        {/* Botão de conclusão */}
        <div className="sticky bottom-4">
          <button
            onClick={handleConcluir}
            disabled={feito || concluindo}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              feito
                ? 'bg-brand-500/20 border-2 border-brand-500/40 text-brand-400 cursor-default'
                : 'bg-brand-500 hover:bg-brand-400 text-white active:scale-[0.98]'
            }`}
          >
            {concluindo ? (
              <><Spinner size="sm" /> Registrando...</>
            ) : feito ? (
              <>✅ Treino concluído!</>
            ) : (
              <>💪 Marcar como concluído</>
            )}
          </button>
        </div>

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
