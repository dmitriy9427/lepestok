/** Кнопка ♥: favKey — «b:<id>» для готового букета или «c:<код>» для собранного. */
import { favorites, toggleFavorite } from '../lib/cart'

export function FavButton({
  favKey,
  className = '',
  withText = false,
}: {
  favKey: string
  className?: string
  withText?: boolean
}) {
  const on = favorites.use().includes(favKey)
  return (
    <button
      className={`fav-button ${className}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Убрать из избранного' : 'В избранное'}
      onClick={() => toggleFavorite(favKey)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20z" />
      </svg>
      {withText && <span>{on ? 'В избранном' : 'В избранное'}</span>}
    </button>
  )
}
