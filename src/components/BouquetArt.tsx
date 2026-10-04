/**
 * Живой рисунок букета (inline SVG) — для конструктора, первого экрана и
 * страницы букета.
 *
 * Каждый цветок — отдельный <g> с ключом: React добавляет/убирает только
 * изменившиеся. Место задаётся CSS-свойством transform (не атрибутом!) —
 * тогда работает transition, и при добавлении цветка остальные плавно
 * переезжают на новые места. Новые цветы «распускаются» (CSS-анимация
 * .art-item__bloom в styles/components/_art.scss).
 *
 * Для списков и галереи (много картинок) — BouquetImage: одна <img>, дешевле.
 */
import { memo, useMemo } from 'react'
import { bouquetDataUrl, renderBouquet } from '../lib/art/bouquet-art'
import type { Composition } from '../lib/bouquet'
import { bouquetById } from '../data/bouquets'

interface Props {
  composition: Composition
  seed?: number
  /** Распускание по очереди при первом показе. */
  bloom?: boolean
  className?: string
  label?: string
}

export const BouquetArt = memo(function BouquetArt({
  composition,
  seed = 1,
  bloom = false,
  className = '',
  label,
}: Props) {
  const art = useMemo(() => renderBouquet(composition, { seed }), [composition, seed])
  return (
    <svg
      className={`bouquet-art ${bloom ? 'bouquet-art--bloom' : ''} ${className}`}
      viewBox={`0 0 ${art.width} ${art.height}`}
      role="img"
      aria-label={label ?? 'Букет'}
    >
      <g dangerouslySetInnerHTML={{ __html: art.back }} />
      {art.items.map((item, i) => (
        <g
          key={item.key}
          className="art-item"
          style={{
            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate}deg) scale(${item.scale})`,
            ['--i' as string]: i,
          }}
        >
          <g className="art-item__bloom" dangerouslySetInnerHTML={{ __html: item.svg }} />
        </g>
      ))}
      <g dangerouslySetInnerHTML={{ __html: art.front }} />
    </svg>
  )
})

export function BouquetImage({
  composition,
  seed,
  alt = '',
  className = '',
}: {
  composition: Composition
  seed?: number
  alt?: string
  className?: string
}) {
  const src = useMemo(() => bouquetDataUrl(composition, { seed }), [composition, seed])
  return <img className={`bouquet-image ${className}`} src={src} alt={alt} width="400" height="480" decoding="async" />
}

/**
 * Превью строки корзины/избранного: у готового букета — его фото, у
 * собранного в конструкторе — рисунок (фото такого букета не существует).
 */
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
    return (
      <img
        className="bouquet-image bouquet-image--photo"
        src={photo}
        alt={alt}
        width="600"
        height="750"
        loading="lazy"
        decoding="async"
      />
    )
  return <BouquetImage composition={composition} alt={alt} />
}
