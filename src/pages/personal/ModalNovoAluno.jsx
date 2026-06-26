// ─────────────────────────────────────────────────────────────
// Modal para cadastrar um novo aluno
// Usa Edge Function para não deslogar a personal
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function ModalNovoAluno({ onClose, onSuccess }) {
  const [form, setForm]       = useState({ nome: '', email: '', telefone: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

async function handleSubmit(e) {
  e.preventDefault()
  setErro('')
  setLoading(true)

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

const { data, error } = await supabase.functions.invoke(
  'quick-worker',
  {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },

    body: {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      telefone: form.telefone,
    },
  }
)

console.log('RESPOSTA EDGE FUNCTION:', { data, error })

if (error) {
  console.error('Supabase function error:', error)

  try {
    const erroTexto = await error.context.text()

    console.error('ERRO INTERNO EDGE:', erroTexto)

    throw new Error(erroTexto)
  } catch (e) {
    throw new Error(error.message)
  }
}

    // 🔍 DEBUG COMPLETO
    console.log('RESPOSTA EDGE FUNCTION:', { data, error })

    if (error) {
      console.error('Supabase function error:', error)
      throw new Error(error.message || JSON.stringify(error))
    }

    if (data?.error) {
      console.error('Erro retornado pela função:', data.error)
      throw new Error(data.error)
    }

    console.log('Aluno criado com sucesso:', data)

    onSuccess(`Aluno "${form.nome}" cadastrado com sucesso!`)
  } catch (err) {
    // 🔍 DEBUG REAL DO ERRO
    console.error('ERRO COMPLETO:', err)

    setErro(
      err?.message ||
      err?.error ||
      JSON.stringify(err) ||
      'Erro ao cadastrar aluno.'
    )
  } finally {
    setLoading(false)
  }
}

  return (
    <Modal title="Novo Aluno" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="label">Nome completo</label>
          <input
            className="input"
            placeholder="Maria Silva"
            value={form.nome}
            onChange={e => atualizar('nome', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            className="input"
            placeholder="maria@email.com"
            value={form.email}
            onChange={e => atualizar('email', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Telefone (opcional)</label>
          <input
            className="input"
            placeholder="(11) 99999-9999"
            value={form.telefone}
            onChange={e => atualizar('telefone', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Senha inicial</label>
          <input
            type="password"
            className="input"
            placeholder="Mínimo 6 caracteres"
            value={form.senha}
            onChange={e => atualizar('senha', e.target.value)}
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            O aluno poderá alterar a senha depois.
          </p>
        </div>

        {erro && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Salvando...</> : 'Cadastrar'}
          </button>
        </div>

      </form>
    </Modal>
  )
}
