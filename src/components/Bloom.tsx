/**
 * Декоративный цветок (SVG): два яруса лепестков с градиентом, серединка
 * с тычинками и пара листьев. Используется за карточками букетов (выползает
 * при наведении) и в мобильном меню.
 *
 *   <Bloom petal="#e2708f" shade="#c24c6f" center="#a8375a" />
 *
 * Только украшение: aria-hidden, без фокуса. id градиентов — через useId,
 * иначе десяток цветков на странице делил бы один градиент.
 */
import { useId } from 'react'

interface Props {
  petal: string
  shade: string
  center: string
  /** Сколько лепестков во внешнем ярусе (5–8). */
  petals?: number
  className?: string
}

const PETAL = 'M0 0 C 14 -10 18 -34 0 -46 C -18 -34 -14 -10 0 0 Z'

export function Bloom({ petal, shade, center, petals = 6, className = '' }: Props) {
  const id = useId().replace(/:/g, '')
  const step = 360 / petals
  return (
    <svg className={`bloom ${className}`} viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="-46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={shade} />
          <stop offset="0.55" stopColor={petal} />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}c`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="1" stopColor={center} />
        </radialGradient>
      </defs>
      <g className="bloom__leaves" fill="#7f9a78">
        <path d="M6 10 C 30 14 50 34 54 56 C 32 52 12 36 6 10 Z" />
        <path d="M-8 12 C -30 22 -44 44 -42 58 C -24 50 -10 34 -8 12 Z" opacity="0.8" />
      </g>
      <g className="bloom__outer">
        {Array.from({ length: petals }, (_, i) => (
          <path key={i} d={PETAL} fill={`url(#${id}p)`} transform={`rotate(${i * step})`} />
        ))}
      </g>
      <g className="bloom__inner" transform={`rotate(${step / 2}) scale(0.62)`}>
        {Array.from({ length: petals }, (_, i) => (
          <path key={i} d={PETAL} fill={`url(#${id}p)`} transform={`rotate(${i * step})`} />
        ))}
      </g>
      <circle r="9" fill={`url(#${id}c)`} />
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={i}
          r="1.6"
          fill={center}
          cx={Math.cos((i / 8) * Math.PI * 2) * 12}
          cy={Math.sin((i / 8) * Math.PI * 2) * 12}
        />
      ))}
    </svg>
  )
}
