/** Карточка готового букета: картинка, название, цена, ♥ и «в корзину». */
import { Link } from 'react-router'
import { toast } from 'kit/js/modules/toast/index.js'
import type { Bouquet } from '../data/bouquets'
import { formatPrice, priceOf } from '../lib/bouquet'
import { addItem, cart } from '../lib/cart'
import { FavButton } from './FavButton'

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
  return (
    <article className="bouquet-card" data-flip-id={bouquet.id}>
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
  )
}
