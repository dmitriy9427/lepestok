/**
 * Корзина: количество, удаление, открытка, итог и переход к оформлению.
 * Цены пересчитываются из состава при каждом показе (lib/cart.ts).
 */
import { Link } from 'react-router'
import { useFlip } from 'kit/react/index.js'
import { plural } from 'kit/js/form/schema.js'
import { CARD_PRICE } from '../data/flowers'
import { SIZE_LABEL, formatPrice, stemLabel, toParams } from '../lib/bouquet'
import { cart, cartCount, cartTotal, lineTotal, removeItem, setQty, type CartItem } from '../lib/cart'
import { FREE_DELIVERY_FROM } from '../lib/delivery'
import { ItemImage } from '../components/Collage'
import { QtyStepper } from '../components/QtyStepper'

export function Cart() {
  const items = cart.use()
  // Удалили строку — остальные плавно поднимаются на её место.
  const [listRef, captureList] = useFlip<HTMLUListElement>(items.map((i) => i.id).join())
  const total = cartTotal(items)
  const count = cartCount(items)

  if (!items.length) {
    return (
      <main id="main" className="section">
        <div className="container state state--page">
          <p className="state__title">Корзина пуста</p>
          <p className="muted">Выберите готовый букет или соберите свой — это пара минут.</p>
          <div className="cluster">
            <Link className="btn" to="/catalog">
              В каталог
            </Link>
            <Link className="btn btn--ghost" to="/builder">
              В конструктор
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const toFree = FREE_DELIVERY_FROM - total

  return (
    <main id="main" className="section">
      <div className="container">
        <h1 className="section-title">Корзина</h1>
        <div className="checkout__grid">
          <ul className="cart-list" ref={listRef}>
            {items.map((item) => (
              <CartRow key={item.id} item={item} onRemove={captureList} />
            ))}
          </ul>
          <aside className="order-summary">
            <p className="order-summary__row">
              <span>
                {count} {plural(count, ['букет', 'букета', 'букетов'])}
              </span>
              <strong>{formatPrice(total)}</strong>
            </p>
            <p className="small muted">
              {toFree > 0 ? `До бесплатной доставки — ${formatPrice(toFree)}` : 'Доставка бесплатная'}
            </p>
            <Link className="btn btn--lg btn--block" to="/checkout">
              Оформить заказ
            </Link>
            <Link className="small" to="/catalog">
              Продолжить покупки
            </Link>
          </aside>
        </div>
      </div>
    </main>
  )
}

function CartRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const href = item.bouquetId
    ? `/bouquet/${item.bouquetId}${item.size && item.size !== 'M' ? `?size=${item.size}` : ''}`
    : `/builder?${toParams(item.composition)}`
  return (
    <li className="cart-item">
      <Link className="cart-item__art" to={href} aria-label={item.title}>
        <ItemImage composition={item.composition} bouquetId={item.bouquetId} />
      </Link>
      <div className="cart-item__info">
        <h2 className="cart-item__title">
          <Link to={href}>{item.title}</Link>
          {item.size && <span className="muted"> · {SIZE_LABEL[item.size].toLowerCase()}</span>}
        </h2>
        <p className="small muted">{item.composition.stems.map(stemLabel).join(', ')}</p>
        {item.card && (
          <p className="cart-item__card small">
            Открытка (+{formatPrice(CARD_PRICE)}): «{item.card}»
          </p>
        )}
      </div>
      <QtyStepper
        small
        value={item.qty}
        min={1}
        max={20}
        label={`Количество: ${item.title}`}
        onChange={(v) => cart.set((list) => setQty(list, item.id, v))}
      />
      <p className="cart-item__price">{formatPrice(lineTotal(item))}</p>
      <button
        className="cart-item__remove"
        type="button"
        aria-label={`Удалить «${item.title}»`}
        onClick={() => {
          onRemove()
          cart.set((list) => removeItem(list, item.id))
        }}
      >
        ×
      </button>
    </li>
  )
}
