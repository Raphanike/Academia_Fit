// ─────────────────────────────────────────────────────────────
// Painel da Personal Trainer
// Lista alunos + treinos com Realtime para atualizações ao vivo
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { listarAlunos } from '../../services/alunos'
import { listarTreinos } from '../../services/treinos'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'
import ModalNovoAluno from './ModalNovoAluno'
import ModalNovoTreino from './ModalNovoTreino'

export default function DashboardPersonal() {
  const { profile } = useAuth()

  const [alunos, setAlunos]             = useState([])
  const [treinos, setTreinos]           = useState([])
  const [carregando, setCarregando]     = useState(true)
  const [modalAluno, setModalAluno]     = useState(false)
  const [modalTreino, setModalTreino]   = useState(false)
  const [toast, setToast]               = useState(null)
  const [abaAtiva, setAbaAtiva]         = useState('treinos')  // 'treinos' | 'alunos'

  const carregar = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([listarAlunos(), listarTreinos()])
      setAlunos(a)
      setTreinos(t)
    } catch {
      setToast({ message: 'Erro ao carregar dados.', type: 'error' })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()

    // ── Realtime: escuta treinos concluídos ─────────────────
    const channel = supabase
      .channel('treino_realizado_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'treino_realizado' },
        (payload) => {
          // Busca o nome do aluno para exibir na notificação
          const treinoId = payload.new.treino_id
          const treino   = treinos.find(t => t.id === treinoId)
          const aluno    = alunos.find(a => a.id === payload.new.aluno_id)

          setToast({
            message: `🎉 ${aluno?.nome ?? 'Um aluno'} concluiu um treino!`,
            type: 'success'
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [carregar, alunos, treinos])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Olá, {profile?.nome?.split(' ')[0]} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} · {treinos.length} treino{treinos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalAluno(true)} className="btn-secondary text-sm">
              + Novo aluno
            </button>
            <button onClick={() => setModalTreino(true)} className="btn-primary text-sm">
              + Novo treino
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 p-1 bg-gray-900 rounded-xl mb-6 w-fit">
          {['treinos', 'alunos'].map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                abaAtiva === aba
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {aba.charAt(0).toUpperCase() + aba.slice(1)}
            </button>
          ))}
        </div>

        {/* ── LISTA DE TREINOS ── */}
        {abaAtiva === 'treinos' && (
          <div>
            {treinos.length === 0 ? (
              <EmptyState
                icon="🏋️"
                title="Nenhum treino criado"
                description="Crie seu primeiro treino e atribua a um aluno."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {treinos.map(treino => (
                  <Link
                    key={treino.id}
                    to={`/personal/treino/${treino.id}`}
                    className="card hover:border-brand-500/50 hover:bg-gray-800/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold group-hover:text-brand-400 transition-colors">
                          {treino.nome}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          👤 {treino.alunos?.nome ?? 'Sem aluno'}
                        </p>
                        {treino.descricao && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{treino.descricao}</p>
                        )}
                      </div>
                      <span className="text-gray-600 group-hover:text-brand-400 transition-colors">→</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      {new Date(treino.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LISTA DE ALUNOS ── */}
        {abaAtiva === 'alunos' && (
          <div>
            {alunos.length === 0 ? (
              <EmptyState
                icon="👥"
                title="Nenhum aluno cadastrado"
                description="Adicione seu primeiro aluno para começar."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {alunos.map(aluno => (
                  <div key={aluno.id} className="card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-lg font-bold text-brand-400">
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{aluno.nome}</p>
                        <p className="text-sm text-gray-500">{aluno.email}</p>
                        {aluno.telefone && (
                          <p className="text-xs text-gray-600">{aluno.telefone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modais */}
      {modalAluno && (
        <ModalNovoAluno
          onClose={() => setModalAluno(false)}
          onSuccess={(msg) => {
            setModalAluno(false)
            setToast({ message: msg, type: 'success' })
            carregar()
          }}
        />
      )}

      {modalTreino && (
        <ModalNovoTreino
          alunos={alunos}
          onClose={() => setModalTreino(false)}
          onSuccess={(msg) => {
            setModalTreino(false)
            setToast({ message: msg, type: 'success' })
            carregar()
          }}
        />
      )}

      {/* Toast de notificações */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
