// Modal para criar um novo treino e atribuir a um aluno
import { useState } from 'react'
import { criarTreino } from '../../services/treinos'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function ModalNovoTreino({ alunos, onClose, onSuccess }) {
  const [form, setForm]       = useState({ nome: '', descricao: '', alunoId: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!form.alunoId) return setErro('Selecione um aluno.')
    setLoading(true)

    try {
      await criarTreino({ nome: form.nome, descricao: form.descricao, alunoId: form.alunoId })
      onSuccess(`Treino "${form.nome}" criado com sucesso!`)
    } catch (err) {
      setErro(err.message ?? 'Erro ao criar treino.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Novo Treino" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="label">Nome do treino</label>
          <input
            className="input"
            placeholder="Ex: Treino A – Peito e Tríceps"
            value={form.nome}
            onChange={e => atualizar('nome', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Descrição (opcional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Instruções gerais, objetivo do treino..."
            value={form.descricao}
            onChange={e => atualizar('descricao', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Aluno</label>
          <select
            className="input"
            value={form.alunoId}
            onChange={e => atualizar('alunoId', e.target.value)}
            required
          >
            <option value="">Selecione um aluno...</option>
            {alunos.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </div>

        {erro && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Criando...</> : 'Criar treino'}
          </button>
        </div>

      </form>
    </Modal>
  )
}
