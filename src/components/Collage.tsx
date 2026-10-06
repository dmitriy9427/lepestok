/**
 * «Ваш букет» из фото: каждый цветок состава — круглое фото нужного оттенка
 * с количеством, рядом — упаковка и лента образцами.
 *
 * Почему не картинка букета целиком: собранный букет из произвольных цветов
 * честно не показать (фото для каждой комбинации не бывает), а рисунок
 * выглядел игрушечно. Коллаж из настоящих фото — понятно и правдиво.
 *
 *   <StemCollage composition={c} />              — большой (конструктор)
 *   <StemCollage composition={c} compact />      — превью (корзина, избранное)
 *   <ItemImage composition={c} bouquetId="…" />  — фото готового букета или коллаж
 */
import { COLORS, flowerById, flowerPhoto, ribbonById, wrapById } from '../data/flowers'
import { bouquetById } from '../data/bouquets'
import type { Composition } from '../lib/bouquet'

export function StemCollage({ composition, compact = false }: { composition: Composition; compact?: boolean }) {
  const stems = compact ? composition.stems.slice(0, 4) : composition.stems
  const wrap = wrapById(composition.wrap)
  const ribbon = ribbonById(composition.ribbon)
  return (
    <div className={`collage ${compact ? 'collage--compact' : ''}`}>
      <ul className="collage__stems">
        {stems.map((s) => {
          const f = flowerById(s.flower)
          const label = `${f.name}${f.role === 'green' ? '' : `, ${COLORS[s.color].name.toLowerCase()}`}`
          return (
            // key — оттенок+цветок: при смене количества плитка не пересоздаётся,
            // а новая «прилетает» с анимацией (CSS .collage__stem).
            <li className="collage__stem" key={`${s.flower}.${s.color}`} title={`${label} × ${s.count}`}>
              <img
                src={flowerPhoto(s.flower, s.color)}
                alt=""
                width="300"
                height="300"
                loading="lazy"
                decoding="async"
              />
              <span className="collage__count" key={s.count}>
                ×{s.count}
              </span>
              {!compact && <span className="collage__name">{label}</span>}
            </li>
          )
        })}
      </ul>
      {!compact && (
        <p className="collage__wrap">
          <span className="collage__swatch" style={{ background: wrap.color }} aria-hidden="true" />
          {wrap.name}
          <span
            className="collage__swatch collage__swatch--ribbon"
            style={{ background: ribbon.color }}
            aria-hidden="true"
          />
          {ribbon.name.toLowerCase()}
        </p>
      )}
    </div>
  )
}

/** Превью строки корзины/избранного: фото готового букета или коллаж собранного. */
export function ItemImage({
  composition,
  bouquetId,
  alt = '',
}: {
  composition: Composition
  bouquetId?: string
  alt?: string
}) {
  const photo = bouquetId ? bouquetById(bouquetId)?.photo : undefined
  if (photo)
    return <img className="item-photo" src={photo} alt={alt} width="600" height="750" loading="lazy" decoding="async" />
  return <StemCollage composition={composition} compact />
}
