// Estado vazio — exibido quando uma lista não tem itens
export default function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
