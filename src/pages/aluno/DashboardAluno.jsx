// ─────────────────────────────────────────────────────────────
// Painel do Aluno — lista seus treinos e permite marcar como feito
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { buscarAlunoPorUserId } from '../../services/alunos'
import { listarTreinosDoAluno } from '../../services/treinos'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'


export default function DashboardAluno() {
  const { user, profile } = useAuth()

  const [aluno, setAluno]         = useState(null)
  const [treinos, setTreinos]     = useState([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast]         = useState(null)

    console.log("USER:", user)
  console.log("ALUNO:", aluno)
  console.log("TREINOS:", treinos)


const carregar = useCallback(async () => {
  if (!user) return

  try {
    const a = await buscarAlunoPorUserId(user.id)

    console.log('ALUNO ACHADO:', a)

    setAluno(a)

    if (!a) {
      setTreinos([])
      return
    }

    const t = await listarTreinosDoAluno(a.id)

    console.log('TREINOS:', t)

    setTreinos(t)
  } catch (err) {
    console.error(err)
    setToast({ message: 'Erro ao carregar treinos.', type: 'error' })
  } finally {
    setCarregando(false)
  }
}, [user])

useEffect(() => {
  carregar()
}, [carregar])


if (!user || carregando) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

  // Verifica se o treino foi concluído hoje
  function concluidoHoje(treino) {
    if (!treino.treino_realizado?.length) return false
    const hoje = new Date().toISOString().split('T')[0]
    return treino.treino_realizado.some(r =>
      r.realizado_em?.startsWith(hoje)
    )
  }

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Saudação */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Olá, {profile?.nome?.split(' ')[0]} 💪
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Você tem {treinos.length} treino{treinos.length !== 1 ? 's' : ''} disponível{treinos.length !== 1 ? 'is' : ''}.
          </p>
        </div>

        {treinos.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhum treino ainda"
            description="Aguarde sua personal trainer criar seus treinos."
          />
        ) : (
          <div className="space-y-3">
            {treinos.map(treino => {
              const feito = concluidoHoje(treino)
              const totalExercicios = treino.exercicios?.length ?? 0

              return (
                <Link
                  key={treino.id}
                  to={`/aluno/treino/${treino.id}`}
                  className={`card flex items-center justify-between gap-4 hover:border-gray-700 transition-all group ${
                    feito ? 'border-brand-500/40 bg-brand-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Ícone de status */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      feito ? 'bg-brand-500/20 border border-brand-500/40' : 'bg-gray-800'
                    }`}>
                      {feito ? '✅' : '🏋️'}
                    </div>

                    <div>
                      <h3 className={`font-semibold group-hover:text-brand-400 transition-colors ${
                        feito ? 'text-brand-400' : ''
                      }`}>
                        {treino.nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {totalExercicios} exercício{totalExercicios !== 1 ? 's' : ''}
                      </p>
                      {feito && (
                        <span className="text-xs text-brand-500 font-medium">Concluído hoje ✓</span>
                      )}
                    </div>
                  </div>

                  <span className="text-gray-600 group-hover:text-brand-400 transition-colors shrink-0">→</span>
                </Link>
              )
            })}
          </div>
        )}

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
