// ─────────────────────────────────────────────────────────────
// Barra de navegação superior — aparece em todas as telas
// ─────────────────────────────────────────────────────────────
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { profile, isPersonal, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-brand-400">💪</span>
          <span className="text-white">FitCoach</span>
        </Link>

        {/* Menu direito */}
        <div className="flex items-center gap-3">
          {profile && (
            <span className="hidden sm:block text-sm text-gray-400">
              {isPersonal ? '🏋️ Personal' : '👤 Aluno'} — {profile.nome}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>

      </div>
    </nav>
  )
}
