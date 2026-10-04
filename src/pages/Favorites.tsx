/**
 * Избранное: готовые букеты («b:<id>») и собранные в конструкторе («c:<код>»).
 * Хранится в браузере (lib/cart.ts → favorites).
 */
import { Link } from 'react-router'
import { toast } from 'kit/js/modules/toast/index.js'
import { bouquetById } from '../data/bouquets'
import { formatPrice, fromCode, priceOf, stemLabel, type Composition } from '../lib/bouquet'
import { addItem, cart, favorites, toggleFavorite } from '../lib/cart'
import { BouquetCard } from '../components/BouquetCard'
import { BouquetImage } from '../components/BouquetArt'

const EMPTY: Composition = { stems: [], wrap: 'kraft', ribbon: 'satin-blush' }

export function Favorites() {
  const keys = favorites.use()
  const ready = keys.filter((k) => k.startsWith('b:')).flatMap((k) => bouquetById(k.slice(2)) ?? [])
  const custom = keys
    .filter((k) => k.startsWith('c:'))
    .map((k) => ({ key: k, code: k.slice(2), composition: fromCode(k.slice(2), EMPTY) }))
    .filter((c) => c.composition.stems.length)

  return (
    <main id="main" className="section">
      <div className="container">
        <p className="eyebrow">Избранное</p>
        <h1 className="section-title">Понравившиеся букеты</h1>

        {!ready.length && !custom.length && (
          <div className="state">
            <p className="state__title">Пока пусто</p>
            <p className="muted">Нажмите ♥ на букете или сохраните свой в конструкторе.</p>
            <Link className="btn" to="/catalog">
              В каталог
            </Link>
          </div>
        )}

        {custom.length > 0 && (
          <>
            <h2 className="h3 favorites__heading">Собранные вами</h2>
            <div className="catalog__grid">
              {custom.map(({ key, code, composition }) => (
                <article className="bouquet-card" key={key}>
                  <Link className="bouquet-card__link" to={`/builder?${code}`} aria-label="Открыть в конструкторе" />
                  <div className="bouquet-card__art">
                    <BouquetImage composition={composition} />
                  </div>
                  <button
                    className="fav-button bouquet-card__fav"
                    type="button"
                    aria-pressed="true"
                    aria-label="Убрать из избранного"
                    onClick={() => toggleFavorite(key)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20z" />
                    </svg>
                  </button>
                  <div className="bouquet-card__body">
                    <h3 className="bouquet-card__title">Мой букет</h3>
                    <p className="small muted">{composition.stems.map(stemLabel).join(', ')}</p>
                    <p className="bouquet-card__price">{formatPrice(priceOf(composition))}</p>
                    <button
                      className="btn btn--sm btn--secondary bouquet-card__add"
                      type="button"
                      onClick={() => {
                        cart.set((items) => addItem(items, { title: 'Мой букет', composition, card: '' }))
                        toast('Букет в корзине', { type: 'success', duration: 2500 })
                      }}
                    >
                      В корзину
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {ready.length > 0 && (
          <>
            {custom.length > 0 && <h2 className="h3 favorites__heading">Из каталога</h2>}
            <div className="catalog__grid">
              {ready.map((b) => (
                <BouquetCard key={b.id} bouquet={b} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
