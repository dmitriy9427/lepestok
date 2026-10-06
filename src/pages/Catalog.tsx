/**
 * Каталог готовых букетов.
 *
 * Фильтры живут в адресе (useSearchParams): ссылкой можно поделиться, «Назад»
 * возвращает прошлый фильтр. Логика фильтрации — lib/catalog.ts (тесты).
 * Данные — «с сервера» (lib/api.ts): загрузка со скелетонами, ошибка с
 * «Повторить» (проверить: /catalog?fail), пустой результат со сбросом.
 *
 * Перестановка карточек при фильтрации — useFlip кита: в update() снимок
 * «где карточки сейчас», после рендера они плавно едут с прежних мест.
 *
 * Ползунок цены и выбор цветов — модули кита (range, select). Они управляют
 * своими полями сами (неконтролируемые), поэтому при смене адреса «снаружи»
 * (сброс, «Назад») значения в них выставляются эффектами ниже.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useFlip, useModule } from 'kit/react/index.js'
import range from 'kit/js/modules/range/index.js'
import select from 'kit/js/modules/select/index.js'
import { OCCASIONS, type Occasion } from '../data/bouquets'
import { FLOWERS, type FlowerId } from '../data/flowers'
import {
  SORTS,
  TONES,
  applyFilters,
  fromSearch,
  isFiltered,
  priceBounds,
  toSearch,
  type Filters,
  type Sort,
  type Tone,
} from '../lib/catalog'
import { plural } from 'kit/js/form/schema.js'
import { fetchBouquets } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { BouquetCard } from '../components/BouquetCard'

const RANGE = { format: 'price' }
const FLOWER_SELECT = { search: true, placeholder: 'Любые цветы' }
const SORT_SELECT = {}

interface SelectApi {
  value: string | string[]
  setValue: (v: string | string[]) => void
}

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => fromSearch(params.toString()), [params])
  const { status, data, error, retry } = useAsync((signal) => fetchBouquets(signal), [])
  const bounds = useMemo<[number, number]>(() => (data ? priceBounds(data) : [0, 0]), [data])
  const list = useMemo(() => (data ? applyFilters(data, filters) : []), [data, filters])
  // absolute — карточки меняют ряды; у сетки min-height, чтобы не «схлопывалась».
  const [gridRef, captureGrid] = useFlip<HTMLDivElement>(list.map((b) => b.id).join(), {
    absolute: true,
    duration: 0.55,
  })

  const update = (patch: Partial<Filters>) => {
    captureGrid()
    setParams(new URLSearchParams(toSearch({ ...filters, ...patch }, bounds)), { preventScrollReset: true })
  }

  // ─── Выбор цветов (модуль select, multiple) ────────────────────────────────
  const flowersApi = useRef<SelectApi | null>(null)
  const flowersRef = useModule<HTMLSelectElement>(
    select,
    FLOWER_SELECT,
    (api) => (flowersApi.current = api as SelectApi | null),
  )
  useEffect(() => {
    const api = flowersApi.current
    if (api && [...(api.value as string[])].sort().join() !== [...filters.flowers].sort().join())
      api.setValue(filters.flowers)
  }, [filters.flowers])

  const sortApi = useRef<SelectApi | null>(null)
  const sortRef = useModule<HTMLSelectElement>(
    select,
    SORT_SELECT,
    (api) => (sortApi.current = api as SelectApi | null),
  )
  useEffect(() => {
    if (sortApi.current && sortApi.current.value !== filters.sort) sortApi.current.setValue(filters.sort)
  }, [filters.sort])

  const reset = () => update({ occasion: null, price: null, flowers: [], tone: null })

  return (
    <main id="main" className="section catalog">
      <div className="container">
        <p className="eyebrow">Каталог</p>
        <h1 className="section-title">Готовые букеты</h1>

        <div className="filters">
          <div className="filters__row" role="group" aria-label="Повод">
            <button
              className="chip"
              type="button"
              aria-pressed={!filters.occasion}
              onClick={() => update({ occasion: null })}
            >
              Все
            </button>
            {(Object.keys(OCCASIONS) as Occasion[]).map((id) => (
              <button
                key={id}
                className="chip"
                type="button"
                aria-pressed={filters.occasion === id}
                onClick={() => update({ occasion: filters.occasion === id ? null : id })}
              >
                {OCCASIONS[id].emoji} {OCCASIONS[id].title}
              </button>
            ))}
          </div>

          <div className="filters__grid">
            <div className="filters__group">
              <span className="field__label">Цена</span>
              {data && <PriceRange bounds={bounds} value={filters.price} onChange={(price) => update({ price })} />}
            </div>

            <label className="filters__group">
              <span className="field__label">Цветы в составе</span>
              <select
                ref={flowersRef}
                multiple
                defaultValue={filters.flowers}
                onChange={(e) =>
                  update({ flowers: [...e.currentTarget.selectedOptions].map((o) => o.value as FlowerId) })
                }
              >
                {FLOWERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="filters__group" role="group" aria-label="Оттенок">
              <span className="field__label">Оттенок</span>
              <div className="swatches">
                {(Object.keys(TONES) as Tone[]).map((tone) => (
                  <button
                    key={tone}
                    className="swatch"
                    type="button"
                    style={{ ['--swatch' as string]: TONES[tone].swatch }}
                    aria-pressed={filters.tone === tone}
                    aria-label={TONES[tone].title}
                    title={TONES[tone].title}
                    onClick={() => update({ tone: filters.tone === tone ? null : tone })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="filters__bar">
            <p className="filters__count" aria-live="polite">
              {status === 'success'
                ? `${list.length} ${plural(list.length, ['букет', 'букета', 'букетов'])}`
                : status === 'loading'
                  ? 'Загружаем…'
                  : '—'}
            </p>
            {/* Кнопка всегда в разметке: прячется visibility — место остаётся, сортировка не прыгает. */}
            <button
              className="btn btn--sm btn--ghost filters__reset"
              type="button"
              onClick={reset}
              disabled={!isFiltered(filters)}
              aria-hidden={!isFiltered(filters)}
            >
              Сбросить фильтры
            </button>
            <label className="filters__sort">
              <span className="visually-hidden">Сортировка</span>
              <select
                ref={sortRef}
                defaultValue={filters.sort}
                onChange={(e) => update({ sort: e.currentTarget.value as Sort })}
              >
                {(Object.keys(SORTS) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {SORTS[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Общая область результатов с min-height: скелетон → ошибка/пусто → карточки без скачков футера. */}
        <div className="catalog__results">
          {status === 'loading' && (
            <div className="catalog__grid" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="bouquet-card bouquet-card--skeleton" key={i} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="state" role="alert">
              <p className="state__title">Не получилось загрузить букеты</p>
              <p className="muted">{error.message}</p>
              <button className="btn" type="button" onClick={retry}>
                Повторить
              </button>
            </div>
          )}

          {status === 'success' && list.length === 0 && (
            <div className="state">
              <p className="state__title">Таких букетов пока нет</p>
              <p className="muted">Попробуйте убрать часть фильтров — или соберите свой букет в конструкторе.</p>
              <button className="btn" type="button" onClick={reset}>
                Сбросить фильтры
              </button>
            </div>
          )}

          {status === 'success' && list.length > 0 && (
            <div className="catalog__grid" ref={gridRef}>
              {list.map((b) => (
                <BouquetCard bouquet={b} key={b.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/**
 * Ползунок цены (модуль range кита) — отдельным компонентом: он появляется
 * только когда загружены данные (нужны границы), а useModule запускает модуль
 * при монтировании своего элемента.
 */
function PriceRange({
  bounds,
  value,
  onChange,
}: {
  bounds: [number, number]
  value: [number, number] | null
  onChange: (v: [number, number]) => void
}) {
  const ref = useModule<HTMLDivElement>(range, RANGE)
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const handler = (event: Event) => {
      const { min, max } = (event as CustomEvent<{ min: number; max: number }>).detail
      latest.current([min, max])
    }
    el.addEventListener('range:change', handler)
    return () => el.removeEventListener('range:change', handler)
  }, [ref])

  // Адрес поменялся «снаружи» (сброс, «Назад») — двигаем ручки.
  const [min, max] = value ?? bounds
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const [low, high] = el.querySelectorAll<HTMLInputElement>('input[type="range"]')
    if (Number(low.value) === min && Number(high.value) === max) return
    low.value = String(min)
    high.value = String(max)
    low.dispatchEvent(new Event('input', { bubbles: true }))
  }, [min, max, ref])

  return (
    <div className="range" ref={ref}>
      <div className="range__track">
        <input
          type="range"
          name="priceMin"
          min={bounds[0]}
          max={bounds[1]}
          step={100}
          defaultValue={min}
          aria-label="Цена от"
        />
        <input
          type="range"
          name="priceMax"
          min={bounds[0]}
          max={bounds[1]}
          step={100}
          defaultValue={max}
          aria-label="Цена до"
        />
      </div>
      <p className="range__values">
        <output data-range-min /> <output data-range-max />
      </p>
    </div>
  )
}
