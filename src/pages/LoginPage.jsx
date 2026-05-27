// ─────────────────────────────────────────────────────────────
// Tela de Login
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner.jsx'

export default function LoginPage() {
  const { signIn, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro]       = useState('')

  // Redireciona se já estiver logado
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'personal') navigate('/personal', { replace: true })
      else navigate('/aluno', { replace: true })
    }
  }, [profile, loading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      await signIn(email, senha)
      // O useEffect acima vai redirecionar quando o profile carregar
    } catch (err) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">

      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">💪</span>
          <h1 className="text-3xl font-bold mt-3 text-white">FitCoach</h1>
          <p className="text-gray-400 mt-1 text-sm">Seu sistema de treinos online</p>
        </div>

        {/* Card de login */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={enviando}
            >
              {enviando ? <><Spinner size="sm" /> Entrando...</> : 'Entrar'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Acesso apenas por convite. Fale com sua personal trainer.
        </p>

      </div>
    </div>
  )
}
