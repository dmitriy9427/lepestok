/**
 * Страница букета: фото, размер S/M/L (меняются цена и состав), состав,
 * открытка с предпросмотром,
 * «в корзину», «собрать похожий» (состав уходит в конструктор через адрес).
 * Размер — в адресе (?size=L), чтобы ссылка вела на тот же вариант.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'kit/js/modules/toast/index.js'
import { Expand, useModule } from 'kit/react/index.js'
import charCounter from 'kit/js/modules/char-counter/index.js'
import { BOUQUETS, OCCASIONS, bouquetById } from '../data/bouquets'
import { CARD_PRICE, ribbonById, wrapById } from '../data/flowers'
import { SIZE_LABEL, formatPrice, priceOf, resize, stemLabel, toParams, type Size } from '../lib/bouquet'
import { addItem, cart } from '../lib/cart'
import { BouquetCard } from '../components/BouquetCard'
import { FavButton } from '../components/FavButton'
import { QtyStepper } from '../components/QtyStepper'
import { NotFound } from './NotFound'

const SIZES: Size[] = ['S', 'M', 'L']
const CARD_MAX = 200

export function BouquetPage() {
  const { id = '' } = useParams()
  const bouquet = bouquetById(id)
  if (!bouquet) return <NotFound />
  // key: другой букет — чистое состояние (размер, открытка, количество).
  return <BouquetView key={id} id={id} />
}

function BouquetView({ id }: { id: string }) {
  const bouquet = bouquetById(id)!
  const [params, setParams] = useSearchParams()
  const size = (SIZES as string[]).includes(params.get('size') ?? '') ? (params.get('size') as Size) : 'M'
  const composition = useMemo(() => resize(bouquet.composition, size), [bouquet, size])
  const [withCard, setWithCard] = useState(false)
  const [card, setCard] = useState('')
  const [qty, setQty] = useState(1)

  const price = priceOf(composition) + (withCard && card.trim() ? CARD_PRICE : 0)

  // App ставит общий заголовок «Букет — Лепесток»; здесь — с названием.
  useEffect(() => {
    document.title = `${bouquet.title} — букет с доставкой — Лепесток`
  }, [bouquet.title])
  const similar = BOUQUETS.filter((b) => b.id !== id && b.occasions.some((o) => bouquet.occasions.includes(o))).slice(
    0,
    3,
  )

  const add = () => {
    cart.set((items) =>
      addItem(
        items,
        { title: bouquet.title, composition, bouquetId: id, size, card: withCard ? card.trim() : '' },
        qty,
      ),
    )
    toast(`«${bouquet.title}» (${SIZE_LABEL[size].toLowerCase()}) в корзине`, { type: 'success', duration: 2500 })
  }

  return (
    <main id="main">
      <section className="section product">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Хлебные крошки">
            <Link to="/">Главная</Link> / <Link to="/catalog">Букеты</Link> /{' '}
            <span aria-current="page">{bouquet.title}</span>
          </nav>
          <div className="product__grid">
            <figure className="product__photo">
              <img src={bouquet.photo} alt={`Букет «${bouquet.title}»`} width="1200" height="1500" />
              {bouquet.badge && <span className="product__badge">{bouquet.badge}</span>}
              <figcaption>
                На фото — стандартный размер. Фото:{' '}
                <a href={bouquet.credit.url} target="_blank" rel="noopener noreferrer">
                  {bouquet.credit.author} / Pexels
                </a>
              </figcaption>
            </figure>
            <div className="product__info">
              <p className="product__tags">
                {bouquet.occasions.map((o) => (
                  <Link key={o} className="tag" to={`/catalog?occasion=${o}`}>
                    {OCCASIONS[o].title}
                  </Link>
                ))}
              </p>
              <h1 className="product__title">{bouquet.title}</h1>
              <p className="product__price" aria-live="polite">
                {formatPrice(price * qty)}
              </p>
              <p className="lead">{bouquet.text}</p>

              <fieldset className="product__sizes">
                <legend className="field__label">Размер</legend>
                <div className="pills">
                  {SIZES.map((s) => (
                    <label className="pill" key={s}>
                      <input
                        type="radio"
                        name="size"
                        value={s}
                        checked={size === s}
                        onChange={() =>
                          setParams(s === 'M' ? {} : { size: s }, { replace: true, preventScrollReset: true })
                        }
                      />
                      <span>
                        {SIZE_LABEL[s]} <small>{formatPrice(priceOf(resize(bouquet.composition, s)))}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="product__composition">
                <p className="field__label">Состав</p>
                <ul>
                  {composition.stems.map((s) => (
                    <li key={`${s.flower}.${s.color}`}>{stemLabel(s)}</li>
                  ))}
                  <li>Упаковка: {wrapById(composition.wrap).name.toLowerCase()}</li>
                  <li>Лента: {ribbonById(composition.ribbon).name.toLowerCase()}</li>
                </ul>
              </div>

              <div className="product__card">
                <label className="checkbox">
                  <input type="checkbox" checked={withCard} onChange={(e) => setWithCard(e.currentTarget.checked)} />
                  <span>Добавить открытку · {formatPrice(CARD_PRICE)}</span>
                </label>
                {/* Раскрывается плавно (Expand), поле всегда в DOM — счётчик символов запущен один раз. */}
                <Expand open={withCard}>
                  <Greeting value={card} onChange={setCard} />
                </Expand>
              </div>

              <div className="product__buy">
                <QtyStepper value={qty} onChange={setQty} min={1} max={20} label="Количество букетов" />
                <button className="btn btn--lg" type="button" onClick={add}>
                  В корзину
                </button>
                <FavButton favKey={`b:${id}`} className="fav-button--round" />
              </div>
              <Link className="product__similar-link" to={`/builder?${toParams(composition)}`}>
                Собрать похожий в конструкторе →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <h2 className="section-title">Похожие букеты</h2>
            <div className="catalog__grid">
              {similar.map((b) => (
                <BouquetCard key={b.id} bouquet={b} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

/**
 * Текст открытки с предпросмотром (внутри Expand — показывается по галочке).
 * Модуль char-counter (счётчик «12 / 200») — через useModule.
 */
function Greeting({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const counter = useModule<HTMLTextAreaElement>(charCounter)
  return (
    <div className="greeting">
      <label className="field">
        <span className="field__label">Текст открытки</span>
        <textarea
          ref={counter}
          className="field__input"
          rows={3}
          maxLength={CARD_MAX}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder="С днём рождения! Пусть каждый день будет как этот букет."
        />
      </label>
      <div className="greeting__preview" aria-label="Так будет выглядеть открытка">
        <p>{value.trim() || 'Ваш текст появится здесь'}</p>
      </div>
    </div>
  )
}
