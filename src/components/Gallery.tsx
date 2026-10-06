/**
 * Бесконечная галерея букетов — модуль infinite-slider кита.
 * На широком экране — 3D-барабан на WebGL (three.js грузится лениво, только
 * здесь), на телефоне и при «меньше движения» — DOM-лента со свайпом.
 *
 * Картинки — фото букетов (public/photos). Для 3D они должны быть с того же
 * домена или с CORS — иначе WebGL не сможет взять их в текстуру.
 *
 * Клик по боковому слайду — модуль прокручивает к нему; открыть букет —
 * ссылкой «Смотреть букет» под лентой (ведёт на активный).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useBreakpoint, useModule, useReducedMotion } from 'kit/react/index.js'
import infiniteSlider from 'kit/js/modules/infinite-slider/index.js'
import { formatPrice, priceOf } from '../lib/bouquet'
import type { Bouquet } from '../data/bouquets'

const OPTIONS_3D = { mode: '3d', curve: 0.9, reflection: 0.25 }
const OPTIONS_DOM = { mode: 'dom', skew: 6 }

export function Gallery({ bouquets }: { bouquets: Bouquet[] }) {
  const wide = useBreakpoint('lg')
  const reduced = useReducedMotion()
  const options = wide && !reduced ? OPTIONS_3D : OPTIONS_DOM
  const ref = useModule<HTMLDivElement>(infiniteSlider, options)
  const [active, setActive] = useState(0)

  // Активный слайд — из события модуля. В 3D-режиме DOM-слайды не кликаются
  // (рисует canvas), поэтому переход к букету — ссылкой под лентой.
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const onChange = (event: Event) => setActive((event as CustomEvent<{ index: number }>).detail.index)
    el.addEventListener('infinite-slider:change', onChange)
    return () => el.removeEventListener('infinite-slider:change', onChange)
  }, [ref, options.mode])

  const current = bouquets[active] ?? bouquets[0]

  return (
    // key: сменился режим — модуль пересоздаётся на чистой разметке.
    <div className="infinite gallery-3d" ref={ref} key={options.mode}>
      <div
        className="infinite__viewport"
        data-infinite-viewport
        tabIndex={0}
        aria-roledescription="карусель"
        aria-label="Букеты недели"
      >
        {bouquets.map((b) => (
          <figure
            className="infinite__slide"
            data-infinite-slide
            data-title={`${b.title} · ${formatPrice(priceOf(b.composition))}`}
            key={b.id}
          >
            <div className="infinite__art" data-infinite-art>
              <img src={b.photo} alt={b.title} width="600" height="750" draggable={false} />
            </div>
          </figure>
        ))}
      </div>
      <div className="gallery-3d__bar">
        <button className="round-btn" type="button" data-infinite-prev aria-label="Предыдущий букет">
          ←
        </button>
        {/* Подпись меняется каждый слайд: ячейка фиксированной ширины, одна строка — стрелки не двигаются. */}
        <div className="gallery-3d__caption">
          <p className="infinite__title" data-infinite-title />
          <Link className="gallery-3d__open" to={`/bouquet/${current.id}`}>
            Смотреть букет →
          </Link>
        </div>
        <button className="round-btn" type="button" data-infinite-next aria-label="Следующий букет">
          →
        </button>
      </div>
    </div>
  )
}
