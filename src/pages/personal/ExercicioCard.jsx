// ─────────────────────────────────────────────────────────────
// Card de exercício — usado na visão da Personal e do Aluno
// ─────────────────────────────────────────────────────────────

// Extrai o ID do vídeo do YouTube para gerar embed
function getYoutubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function ExercicioCard({ exercicio, numero, onRemover, isPersonal = false }) {
  const youtubeId = getYoutubeId(exercicio.video_url)
  const isUpload  = exercicio.video_url && !youtubeId  // URL do Supabase Storage

  return (
    <div className="card space-y-3">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            {numero}
          </span>
          <div>
            <h4 className="font-semibold leading-tight">{exercicio.nome}</h4>
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

      {/* Vídeo YouTube embed */}
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

      {/* Vídeo do Storage */}
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
