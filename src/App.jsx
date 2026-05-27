import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Páginas
import LoginPage from './pages/LoginPage.jsx'
import DashboardPersonal from './pages/personal/DashboardPersonal.jsx'
import TreinoDetalhe from './pages/personal/TreinoDetalhe.jsx'
import DashboardAluno from './pages/aluno/DashboardAluno.jsx'
import TreinoAluno from './pages/aluno/TreinoAluno.jsx'

// Componentes
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import Spinner from './components/ui/Spinner.jsx'

// HOME SIMPLES (SEM REDIRECIONAR AUTOMÁTICO)
function Home() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Só mostra algo simples na home
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">Bem-vindo ao FitCoach 💪</h1>

      {!profile ? (
        <a href="/login" className="text-blue-500 underline">
          Ir para login
        </a>
      ) : (
        <p className="text-gray-400">
          Logado como: {profile.role}
        </p>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Público */}
        <Route path="/login" element={<LoginPage />} />

        {/* HOME SEM REDIRECIONAMENTO AUTOMÁTICO */}
        <Route path="/" element={<Home />} />

        {/* Personal */}
        <Route
          path="/personal"
          element={
            <ProtectedRoute role="personal">
              <DashboardPersonal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/personal/treino/:id"
          element={
            <ProtectedRoute role="personal">
              <TreinoDetalhe />
            </ProtectedRoute>
          }
        />

        {/* Aluno */}
        <Route
          path="/aluno"
          element={
            <ProtectedRoute role="aluno">
              <DashboardAluno />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/treino/:id"
          element={
            <ProtectedRoute role="aluno">
              <TreinoAluno />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Home />} />

      </Routes>
    </BrowserRouter>
  )
}