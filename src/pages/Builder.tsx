/**
 * Конструктор букета.
 *
 * Состав — одно состояние (Composition), всё остальное из него считается:
 * рисунок (BouquetArt), цена с расшифровкой, подсказка по бюджету.
 * Состав пишется в адрес (replace — история не засоряется каждым кликом):
 * перезагрузка ничего не теряет, ссылкой можно поделиться, страница букета
 * ведёт сюда кнопкой «Собрать похожий».
 *
 * Логика (цена, лимит, бюджет, адрес) — lib/bouquet.ts, покрыта тестами.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'kit/js/modules/toast/index.js'
import { plural } from 'kit/js/form/schema.js'
import { BOUQUETS } from '../data/bouquets'
import { COLORS, FLOWERS, RIBBONS, WRAPS, flowerPhoto, type ColorId, type Flower, type FlowerId } from '../data/flowers'
import {
  MAX_STEMS,
  addStem,
  fitBudget,
  formatPrice,
  fromParams,
  priceBreakdown,
  priceOf,
  stemLabel,
  stemsCount,
  toCode,
  toParams,
  type Composition,
} from '../lib/bouquet'
import { addItem, cart, favorites, toggleFavorite } from '../lib/cart'
import { BouquetArt } from '../components/BouquetArt'
import { QtyStepper } from '../components/QtyStepper'

const EMPTY: Composition = { stems: [], wrap: 'kraft', ribbon: 'satin-blush' }
const PRESETS = ['utro-v-provanse', 'persikovyy-zakat', 'lavandovyy-son'].map((id) =>
  BOUQUETS.find((b) => b.id === id)!,
)

export function Builder() {
  const [params, setParams] = useSearchParams()
  const [composition, setComposition] = useState<Composition>(() => fromParams(params, EMPTY))
  const [budget, setBudget] = useState('')

  // Состав → адрес. Пустой букет — чистый адрес /builder.
  useEffect(() => {
    setParams(composition.stems.length ? toParams(composition) : {}, { replace: true, preventScrollReset: true })
  }, [composition, setParams])

  const price = priceBreakdown(composition)
  const count = stemsCount(composition)
  const empty = count === 0
  const favKey = `c:${toCode(composition)}`
  const saved = favorites.use().includes(favKey)

  const budgetValue = Number(budget.replace(/\D/g, ''))
  const fit = useMemo(
    () => (budgetValue > 0 && price.total > budgetValue ? fitBudget(composition, budgetValue) : null),
    [budgetValue, composition, price.total],
  )

  const change = (flower: FlowerId, color: ColorId, delta: number) => {
    if (delta > 0 && count >= MAX_STEMS) {
      toast(
        `В букете уже ${MAX_STEMS} ${plural(MAX_STEMS, ['цветок', 'цветка', 'цветов'])} — больше не соберём в одни руки`,
        { type: 'warning' },
      )
      return
    }
    setComposition((c) => addStem(c, flower, color, delta))
  }

  const addToCart = () => {
    cart.set((items) => addItem(items, { title: 'Мой букет', composition, card: '' }))
    toast('Ваш букет в корзине', { type: 'success', duration: 2500 })
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      toast('Ссылка на букет скопирована', { type: 'success', duration: 2500 })
    } catch {
      toast('Не удалось скопировать — скопируйте адрес из строки браузера', { type: 'warning' })
    }
  }

  return (
    <main id="main" className="section builder">
      <div className="container">
        <p className="eyebrow">Конструктор</p>
        <h1 className="section-title">Соберите свой букет</h1>

        <div className="builder__grid">
          <section className="builder__flowers" aria-labelledby="flowers-title">
            <h2 id="flowers-title" className="builder__heading">
              Цветы
            </h2>
            <ul className="flower-list">
              {FLOWERS.map((flower) => (
                <FlowerRow key={flower.id} flower={flower} composition={composition} onChange={change} />
              ))}
            </ul>
          </section>

          <div className="builder__stage">
            <div className="builder__art">
              <BouquetArt composition={composition} label="Ваш букет" />
              {empty && (
                <div className="builder__hint">
                  <p>Добавьте первый цветок — или начните с готового:</p>
                  <div className="cluster">
                    {PRESETS.map((b) => (
                      <button key={b.id} className="chip" type="button" onClick={() => setComposition(b.composition)}>
                        {b.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="builder__count" aria-live="polite">
              Цветов в букете: {count} из {MAX_STEMS}
            </p>
          </div>

          <section className="builder__side" aria-label="Упаковка и итог">
            <h2 className="builder__heading">Упаковка</h2>
            <div className="wraps" role="radiogroup" aria-label="Упаковка">
              {WRAPS.map((w) => (
                <label className="wrap-option" key={w.id}>
                  <input
                    type="radio"
                    name="wrap"
                    checked={composition.wrap === w.id}
                    onChange={() => setComposition((c) => ({ ...c, wrap: w.id }))}
                  />
                  <span className="wrap-option__swatch" style={{ background: w.color }} />
                  <span className="wrap-option__name">{w.name}</span>
                  <span className="wrap-option__price">{formatPrice(w.price)}</span>
                </label>
              ))}
            </div>

            <h2 className="builder__heading">Лента</h2>
            <div className="swatches" role="radiogroup" aria-label="Лента">
              {RIBBONS.map((r) => (
                <label
                  className="swatch swatch--radio"
                  key={r.id}
                  title={`${r.name} · ${formatPrice(r.price)}`}
                  style={{ ['--swatch' as string]: r.color }}
                >
                  <input
                    type="radio"
                    name="ribbon"
                    className="visually-hidden"
                    checked={composition.ribbon === r.id}
                    onChange={() => setComposition((c) => ({ ...c, ribbon: r.id }))}
                  />
                  <span className="visually-hidden">{r.name}</span>
                </label>
              ))}
            </div>

            <div className="summary">
              <h2 className="builder__heading">Ваш букет</h2>
              {empty ? (
                <p className="muted">Пока пусто.</p>
              ) : (
                <ul className="summary__stems">
                  {composition.stems.map((s) => (
                    <li key={`${s.flower}.${s.color}`}>
                      <span>{stemLabel(s)}</span>
                      <button
                        type="button"
                        className="summary__remove"
                        aria-label={`Убрать: ${stemLabel(s)}`}
                        onClick={() => change(s.flower, s.color, -s.count)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="summary__price">
                <div>
                  <dt>Цветы</dt>
                  <dd>{formatPrice(price.flowers)}</dd>
                </div>
                <div>
                  <dt>Упаковка и лента</dt>
                  <dd>{formatPrice(price.wrap + price.ribbon)}</dd>
                </div>
                <div>
                  <dt>Работа флориста</dt>
                  <dd>{formatPrice(price.florist)}</dd>
                </div>
                <div className="summary__total">
                  <dt>Итого</dt>
                  <dd>{empty ? '—' : formatPrice(price.total)}</dd>
                </div>
              </dl>

              <label className="field budget">
                <span className="field__label">Мой бюджет</span>
                <input
                  className="field__input"
                  inputMode="numeric"
                  placeholder="Например, 5 000"
                  value={budget}
                  onChange={(e) => setBudget(e.currentTarget.value)}
                />
              </label>
              {fit && !empty && (
                <div className="budget__hint" role="status">
                  {fit.fits ? (
                    <>
                      <p>
                        Чтобы уложиться в {formatPrice(budgetValue)}, уберите:{' '}
                        {fit.removed.map((r) => stemLabel(r)).join(', ')}.
                      </p>
                      <button className="btn btn--sm" type="button" onClick={() => setComposition(fit.composition)}>
                        Убрать и уложиться
                      </button>
                    </>
                  ) : (
                    <p>
                      Даже по одному цветку каждого вида выходит {formatPrice(priceOf(fit.composition))} — больше
                      бюджета. Уберите один из видов цветов или выберите упаковку подешевле.
                    </p>
                  )}
                </div>
              )}

              <div className="summary__actions">
                <button className="btn btn--lg" type="button" disabled={empty} onClick={addToCart}>
                  В корзину · {formatPrice(price.total)}
                </button>
                <div className="cluster">
                  <button
                    className="btn btn--sm btn--ghost"
                    type="button"
                    disabled={empty}
                    aria-pressed={saved}
                    onClick={() => toggleFavorite(favKey)}
                  >
                    {saved ? '♥ Сохранён' : '♡ Сохранить'}
                  </button>
                  <button className="btn btn--sm btn--ghost" type="button" disabled={empty} onClick={share}>
                    Поделиться
                  </button>
                  <button
                    className="btn btn--sm btn--ghost"
                    type="button"
                    disabled={empty}
                    onClick={() => setComposition(EMPTY)}
                  >
                    Очистить
                  </button>
                </div>
                <Link className="small muted" to="/catalog">
                  или выбрать готовый букет →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

/** Строка цветка: фото, цена, оттенки, количество. */
function FlowerRow({
  flower,
  composition,
  onChange,
}: {
  flower: Flower
  composition: Composition
  onChange: (f: FlowerId, c: ColorId, delta: number) => void
}) {
  const [color, setColor] = useState<ColorId>(flower.colors[0])
  const count = composition.stems.find((s) => s.flower === flower.id && s.color === color)?.count ?? 0
  const total = composition.stems.filter((s) => s.flower === flower.id).reduce((sum, s) => sum + s.count, 0)

  return (
    <li className="flower-row">
      {/* Фото — чтобы было понятно, что это за цветок; оттенок — образцы ниже. */}
      <img className="flower-row__photo" src={flowerPhoto(flower.id)} alt="" width="300" height="300" loading="lazy" />
      <div className="flower-row__info">
        <p className="flower-row__name">
          {flower.name} {total > 0 && <span className="flower-row__total">× {total}</span>}
        </p>
        <p className="flower-row__note">
          {formatPrice(flower.price)} · {flower.note}
        </p>
        {flower.colors.length > 1 && (
          <div className="swatches swatches--sm" role="radiogroup" aria-label={`Оттенок: ${flower.name}`}>
            {flower.colors.map((c) => (
              <label
                key={c}
                className="swatch swatch--radio"
                title={COLORS[c].name}
                style={{ ['--swatch' as string]: COLORS[c].petal }}
              >
                <input
                  type="radio"
                  className="visually-hidden"
                  name={`color-${flower.id}`}
                  checked={color === c}
                  onChange={() => setColor(c)}
                />
                <span className="visually-hidden">{COLORS[c].name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <QtyStepper
        small
        value={count}
        onChange={(v) => onChange(flower.id, color, v - count)}
        max={count + MAX_STEMS}
        label={`${flower.name}, ${COLORS[color].name.toLowerCase()}`}
      />
    </li>
  )
}
