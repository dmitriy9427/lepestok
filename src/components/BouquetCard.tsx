/**
 * Карточка готового букета: картинка, название, цена, ♥ и «в корзину».
 * При наведении из-за карточки «выползает» цветок цвета главного цветка
 * букета — у каждой карточки со своей стороны (стабильно, по id).
 */
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { toast } from 'kit/js/modules/toast/index.js'
import type { Bouquet } from '../data/bouquets'
import { formatPrice, priceOf } from '../lib/bouquet'
import { addItem, cart } from '../lib/cart'
import { COLORS, flowerById } from '../data/flowers'
import { FavButton } from './FavButton'
import { Bloom } from './Bloom'

/**
 * Откуда выглядывает цветок: точка на краю карточки (ax/ay, %) и направление
 * «наружу» (dx/dy). Бока на уровне фото и низ у углов — там цветок
 * перекрывает у соседей только край фото, а не цену и кнопки.
 */
const SPOTS = [
  { ax: 100, ay: 18, dx: 1, dy: 0 },
  { ax: 16, ay: 100, dx: -0.4, dy: 1 },
  { ax: 0, ay: 30, dx: -1, dy: 0 },
  { ax: 100, ay: 46, dx: 1, dy: 0 },
  { ax: 84, ay: 100, dx: 0.4, dy: 1 },
  { ax: 0, ay: 52, dx: -1, dy: 0 },
]

function hash(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

function bloomOf(bouquet: Bouquet) {
  const main =
    bouquet.composition.stems.find((s) => flowerById(s.flower).role !== 'green') ?? bouquet.composition.stems[0]
  const h = hash(bouquet.id)
  const spot = SPOTS[h % SPOTS.length]
  return {
    palette: COLORS[main.color],
    petals: 5 + (h % 4),
    style: {
      '--ax': `${spot.ax}%`,
      '--ay': `${spot.ay}%`,
      '--dx': spot.dx,
      '--dy': spot.dy,
      '--spin': `${(h % 2 ? 1 : -1) * (25 + (h % 40))}deg`,
    } as CSSProperties,
  }
}

export function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  const price = priceOf(bouquet.composition)
  const add = () => {
    cart.set((items) =>
      addItem(items, {
        title: bouquet.title,
        composition: bouquet.composition,
        bouquetId: bouquet.id,
        size: 'M',
        card: '',
      }),
    )
    toast(`«${bouquet.title}» в корзине`, { type: 'success', duration: 2500 })
  }
  const bloom = bloomOf(bouquet)
  return (
    // Обёртка: цветок — СОСЕД карточки и лежит за ней. Внутри карточки он
    // оказался бы поверх её фона (стек контекстов при transform).
    <div className="bouquet-card-wrap" data-flip-id={bouquet.id}>
      <span className="bouquet-card__bloom" style={bloom.style}>
        <Bloom
          petal={bloom.palette.petal}
          shade={bloom.palette.shade}
          center={bloom.palette.center}
          petals={bloom.petals}
        />
      </span>
      <article className="bouquet-card">
        <Link
          className="bouquet-card__link"
          to={`/bouquet/${bouquet.id}`}
          aria-label={`${bouquet.title}, ${formatPrice(price)}`}
        />
        <div className="bouquet-card__photo">
          <img src={bouquet.photo} alt="" width="600" height="750" loading="lazy" decoding="async" />
        </div>
        {bouquet.badge && <span className="bouquet-card__badge">{bouquet.badge}</span>}
        <FavButton favKey={`b:${bouquet.id}`} className="bouquet-card__fav" />
        <div className="bouquet-card__body">
          <h3 className="bouquet-card__title">{bouquet.title}</h3>
          <p className="bouquet-card__price">{formatPrice(price)}</p>
          <button className="btn btn--sm btn--secondary bouquet-card__add" type="button" onClick={add}>
            В корзину
          </button>
        </div>
      </article>
    </div>
  )
}
