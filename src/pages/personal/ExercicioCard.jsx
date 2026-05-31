// ─────────────────────────────────────────────────────────────
// Card de exercício — usado na visão da Personal e do Aluno
// ─────────────────────────────────────────────────────────────
import { useState } from 'react'
function getYoutubeId(url) {
  if (!url) return null

  const match = url.match(
    /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )

  return match ? match[1] : null
}

export default function ExercicioCard({
  exercicio,
  numero,
  onRemover,
  isPersonal = false,
  dadosExecucao,
  onAlterarExecucao
}) {

  const youtubeId = getYoutubeId(exercicio.video_url)
  const isUpload = exercicio.video_url && !youtubeId
  const [editando, setEditando] = useState(false)

  return (
    <div className="card space-y-3">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">

          <span className="shrink-0 w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            {numero}
          </span>

          <div>
            <h4 className="font-semibold leading-tight">
              {exercicio.nome}
            </h4>

            <div className="flex gap-3 mt-1">
              <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                {exercicio.series} séries
              </span>

              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                {exercicio.repeticoes} reps
              </span>
            </div>
          </div>

        </div>

        {isPersonal && onRemover && (
          <button
            onClick={onRemover}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
            title="Remover exercício"
          >
            🗑
          </button>
        )}
      </div>

      {/* Observações */}
      {exercicio.observacoes && (
        <p className="text-sm text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
          💬 {exercicio.observacoes}
        </p>
      )}

      {/* Área do aluno */}
{!isPersonal && (
  <div className="border-t border-gray-700 pt-4">

    {!editando ? (
      <button
        onClick={() => setEditando(true)}
        className="w-full py-2 rounded-lg bg-brand-500 text-white font-medium"
      >
        ✏️ Editar execução
      </button>
    ) : (
      <div className="space-y-3">

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Séries realizadas
            </label>

            <input
              type="number"
              value={dadosExecucao?.series || ''}
              onChange={(e) =>
                onAlterarExecucao?.('series', e.target.value)
              }
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Repetições realizadas
            </label>

            <input
              type="text"
              value={dadosExecucao?.repeticoes || ''}
              onChange={(e) =>
                onAlterarExecucao?.('repeticoes', e.target.value)
              }
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
            />
          </div>

        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Carga utilizada (kg)
          </label>

          <input
            type="number"
            step="0.5"
            value={dadosExecucao?.carga || ''}
            onChange={(e) =>
              onAlterarExecucao?.('carga', e.target.value)
            }
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Observação do aluno
          </label>

          <textarea
            rows={3}
            value={dadosExecucao?.observacao || ''}
            onChange={(e) =>
              onAlterarExecucao?.('observacao', e.target.value)
            }
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
            placeholder="Ex: aumentei a carga, senti dificuldade, etc."
          />
        </div>

        <div className="flex gap-2">

          <button
            onClick={() => setEditando(false)}
            className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium"
          >
            💾 Salvar alterações
          </button>

          <button
            onClick={() => setEditando(false)}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white"
          >
            Fechar
          </button>

        </div>

      </div>
    )}

  </div>
)}

      {/* Vídeo YouTube */}
      {youtubeId && (
        <div className="rounded-xl overflow-hidden aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={exercicio.nome}
          />
        </div>
      )}

      {/* Vídeo Storage */}
      {isUpload && (
        <video
          src={exercicio.video_url}
          controls
          className="w-full rounded-xl"
          preload="metadata"
        />
      )}

    </div>
  )
}