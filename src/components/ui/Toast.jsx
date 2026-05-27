// ─────────────────────────────────────────────────────────────
// Componente de notificações (sucesso / erro)
// Uso: <Toast message="Treino salvo!" type="success" onClose={() => setToast(null)} />
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-brand-500 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-blue-600 text-white',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-3 animate-fade-in ${styles[type]}`}>
      {type === 'success' && <span>✅</span>}
      {type === 'error'   && <span>❌</span>}
      {type === 'info'    && <span>ℹ️</span>}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}
