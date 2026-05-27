// ─────────────────────────────────────────────────────────────
// Proteção de rotas — redireciona para /login se não autenticado
// role: 'personal' ou 'aluno' para restringir por tipo de usuário
// ─────────────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  // Enquanto verifica a sessão, mostra spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Sem usuário → vai para login
  if (!user) return <Navigate to="/login" replace />

  // Se exige um role específico e o perfil não bate → acesso negado
  if (role && profile?.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
          <p className="text-gray-400">Você não tem permissão para acessar essa página.</p>
        </div>
      </div>
    )
  }

  return children
}
