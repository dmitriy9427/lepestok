/**
 * Рисование цветов в SVG — по одному на каждый вид из data/flowers.ts.
 *
 * Каждая функция рисует цветок с центром в (0, 0), радиус головки ≈ 30
 * (у розы; у остальных — × size из справочника). Масштаб, поворот и место
 * задаёт раскладка (bouquet-art.ts). Возвращается строка SVG-фигур без
 * градиентов и id: их можно вставлять сколько угодно раз в один документ.
 *
 * Немного случайности (повороты лепестков, их длина) — от зерна rnd:
 * два пиона в букете похожи, но не одинаковы.
 *
 * Новый цветок: функция (rnd, palette) => string и строка в FLOWER_ART.
 */
import type { FlowerId, Palette } from '../../data/flowers'
import { between, n, type Random } from './random'

type Draw = (rnd: Random, p: Palette) => string

const R = 30

/** Лепесток «вверх» от (0,0): узкое основание, округлый кончик. */
function petal(len: number, width: number) {
  return `M0 0C${n(width)} ${n(-len * 0.3)} ${n(width * 0.95)} ${n(-len)} 0 ${n(-len)}C${n(-width * 0.95)} ${n(-len)} ${n(-width)} ${n(-len * 0.3)} 0 0Z`
}

/** Лепесток с волнистым краем (пион): три «волны» по верхнему краю. */
function ruffledPetal(len: number, width: number, rnd: Random) {
  const top = -len
  const w = width
  const bump = () => n(top - between(rnd, 0, len * 0.12))
  return (
    `M0 0C${n(w * 0.9)} ${n(-len * 0.2)} ${n(w * 1.05)} ${n(-len * 0.6)} ${n(w * 0.8)} ${n(-len * 0.85)}` +
    `Q${n(w * 0.55)} ${bump()} ${n(w * 0.3)} ${n(top * 0.92)}` +
    `Q0 ${bump()} ${n(-w * 0.3)} ${n(top * 0.92)}` +
    `Q${n(-w * 0.55)} ${bump()} ${n(-w * 0.8)} ${n(-len * 0.85)}` +
    `C${n(-w * 1.05)} ${n(-len * 0.6)} ${n(-w * 0.9)} ${n(-len * 0.2)} 0 0Z`
  )
}

const ring = (
  count: number,
  offset: number,
  rnd: Random,
  jitter: number,
  shape: (i: number) => string,
  attrs: string,
) =>
  Array.from({ length: count }, (_, i) => {
    const angle = offset + (360 / count) * i + between(rnd, -jitter, jitter)
    return `<path transform="rotate(${n(angle)})" d="${shape(i)}" ${attrs}/>`
  }).join('')

const rose: Draw = (rnd, p) => {
  const start = between(rnd, 0, 72)
  const stroke = `stroke="${p.shade}" stroke-width=".8"`
  // Спираль в середине — «закрученные» внутренние лепестки.
  const spiral: string[] = []
  for (let t = 0; t <= 1; t += 0.04) {
    const a = t * Math.PI * 5 + start
    const r = R * 0.4 * (1 - t)
    spiral.push(`${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)}`)
  }
  return (
    ring(5, start, rnd, 8, () => petal(R, R * 0.62), `fill="${p.petal}" ${stroke}`) +
    ring(5, start + 36, rnd, 8, () => petal(R * 0.78, R * 0.5), `fill="${p.petal}" ${stroke}`) +
    `<circle r="${n(R * 0.5)}" fill="${p.shade}" opacity=".55"/>` +
    ring(3, start + 20, rnd, 15, () => petal(R * 0.5, R * 0.42), `fill="${p.petal}" ${stroke}`) +
    `<circle r="${n(R * 0.3)}" fill="${p.shade}"/>` +
    `<path d="M${spiral.join('L')}" fill="none" stroke="${p.center}" stroke-width="1.5" stroke-linecap="round"/>`
  )
}

const peony: Draw = (rnd, p) => {
  const stroke = `stroke="${p.shade}" stroke-width=".6"`
  return (
    ring(9, between(rnd, 0, 40), rnd, 10, () => ruffledPetal(R, R * 0.5, rnd), `fill="${p.petal}" ${stroke}`) +
    ring(8, between(rnd, 0, 45), rnd, 14, () => ruffledPetal(R * 0.78, R * 0.42, rnd), `fill="${p.petal}" ${stroke}`) +
    `<circle r="${n(R * 0.5)}" fill="${p.shade}" opacity=".35"/>` +
    ring(
      7,
      between(rnd, 0, 50),
      rnd,
      20,
      () => ruffledPetal(R * between(rnd, 0.42, 0.55), R * 0.3, rnd),
      `fill="${p.petal}" ${stroke}`,
    ) +
    ring(5, between(rnd, 0, 70), rnd, 25, () => petal(R * 0.28, R * 0.18), `fill="${p.shade}"`) +
    `<circle r="${n(R * 0.1)}" fill="${p.center}"/>`
  )
}

const ranunculus: Draw = (rnd, p) => {
  // Много тонких слоёв «чашкой»: каждый слой — венчик из круглых лепестков,
  // следующий меньше, сдвинут вверх и повёрнут — края получаются «чешуйками».
  const layers: string[] = []
  const shiftX = between(rnd, -1.5, 1.5)
  for (let i = 0; i < 6; i++) {
    const r = R * (1 - i * 0.15)
    const count = 11 - i
    const fill = i % 2 ? p.shade : p.petal
    layers.push(
      `<g transform="translate(${n(shiftX * i)} ${n(-i * 1.6)})">` +
        ring(
          count,
          between(rnd, 0, 40),
          rnd,
          4,
          () => petal(r, r * 0.42),
          `fill="${fill}" stroke="${p.shade}" stroke-width=".6"`,
        ) +
        `</g>`,
    )
  }
  return layers.join('') + `<circle cx="${n(shiftX * 6)}" cy="-10" r="${n(R * 0.11)}" fill="#7d8b4e"/>`
}

const tulip: Draw = (rnd, p) => {
  // Вид сбоку: «бокал» из трёх лепестков. Основание — в (0, 14).
  const tilt = between(rnd, -0.15, 0.15)
  const w = R * 0.7
  const h = R * 1.35
  const back = `M${n(-w)} -4C${n(-w)} ${n(-h)} ${n(w)} ${n(-h)} ${n(w)} -4C${n(w * 0.8)} 14 ${n(-w * 0.8)} 14 ${n(-w)} -4Z`
  const left = `M2 14C${n(-w * 1.1)} 10 ${n(-w * 1.05)} ${n(-h * 0.6)} ${n(-w * 0.35 + tilt * 20)} ${n(-h * 0.95)}C${n(-w * 0.1)} ${n(-h * 0.6)} 4 ${n(-h * 0.3)} 2 14Z`
  const right = `M-2 14C${n(w * 1.1)} 10 ${n(w * 1.05)} ${n(-h * 0.6)} ${n(w * 0.35 + tilt * 20)} ${n(-h * 0.95)}C${n(w * 0.1)} ${n(-h * 0.6)} -4 ${n(-h * 0.3)} -2 14Z`
  return (
    `<path d="${back}" fill="${p.shade}"/>` +
    `<path d="${left}" fill="${p.petal}" stroke="${p.shade}" stroke-width=".8"/>` +
    `<path d="${right}" fill="${p.petal}" stroke="${p.shade}" stroke-width=".8"/>`
  )
}

const lisianthus: Draw = (rnd, p) => {
  const start = between(rnd, 0, 72)
  return (
    ring(5, start, rnd, 6, () => petal(R, R * 0.72), `fill="${p.petal}" stroke="${p.shade}" stroke-width=".7"`) +
    ring(5, start + 36, rnd, 6, () => petal(R * 0.55, R * 0.4), `fill="${p.shade}" opacity=".45"`) +
    `<circle r="${n(R * 0.16)}" fill="#c9d48a"/>` +
    ring(5, start, rnd, 0, () => 'M0 0L0 -7', `stroke="#8a9a4d" stroke-width="1.2"`)
  )
}

const chamomile: Draw = (rnd, p) => {
  const dots = Array.from({ length: 14 }, () => {
    const a = between(rnd, 0, Math.PI * 2)
    const r = between(rnd, 0, R * 0.26)
    return `<circle cx="${n(Math.cos(a) * r)}" cy="${n(Math.sin(a) * r)}" r="1.1" fill="#c9821c"/>`
  }).join('')
  return (
    ring(
      18,
      between(rnd, 0, 20),
      rnd,
      4,
      () => petal(R, R * 0.17),
      `fill="${p.petal}" stroke="${p.shade}" stroke-width=".5"`,
    ) +
    `<circle r="${n(R * 0.34)}" fill="#f2b632"/>` +
    dots
  )
}

const gypsophila: Draw = (rnd, p) => {
  // Облако мелких цветков на тонких веточках, расходящихся из центра.
  const twigs: string[] = []
  const blossoms: string[] = []
  for (let i = 0; i < 9; i++) {
    const a = between(rnd, 0, Math.PI * 2)
    const len = between(rnd, R * 0.5, R * 1.25)
    const x = Math.cos(a) * len
    const y = Math.sin(a) * len * 0.8
    twigs.push(`M0 0Q${n(x * 0.3)} ${n(y * 0.7)} ${n(x)} ${n(y)}`)
    for (let j = 0; j < 4; j++) {
      const bx = x + between(rnd, -6, 6)
      const by = y + between(rnd, -6, 6)
      blossoms.push(`<circle cx="${n(bx)}" cy="${n(by)}" r="${n(between(rnd, 1.6, 2.8))}"/>`)
    }
  }
  return (
    `<path d="${twigs.join('')}" fill="none" stroke="#a3b08f" stroke-width=".7"/>` +
    `<g fill="${p.petal}" stroke="${p.shade}" stroke-width=".4">${blossoms.join('')}</g>`
  )
}

const eucalyptus: Draw = (rnd, p) => {
  // Ветка «вверх» от (0,0): изогнутый стебель и круглые листья парами.
  const len = R * 2.4
  const bend = between(rnd, -12, 12)
  const leaves: string[] = []
  for (let i = 1; i <= 6; i++) {
    const t = i / 6.4
    const y = -len * t
    const x = bend * t * t
    const r = R * 0.27 * (1 - t * 0.55)
    for (const side of [-1, 1]) {
      leaves.push(
        `<ellipse cx="${n(x + side * r * 0.95)}" cy="${n(y + between(rnd, -2, 2))}" rx="${n(r)}" ry="${n(r * 0.9)}" opacity="${n(between(rnd, 0.85, 1))}"/>`,
      )
    }
  }
  return (
    `<path d="M0 0Q${n(bend * 0.3)} ${n(-len * 0.5)} ${n(bend)} ${n(-len)}" fill="none" stroke="#6d7f68" stroke-width="1.4"/>` +
    `<g fill="${p.petal}" stroke="${p.shade}" stroke-width=".6">${leaves.join('')}</g>`
  )
}

export const FLOWER_ART: Record<FlowerId, Draw> = {
  rose,
  peony,
  ranunculus,
  tulip,
  lisianthus,
  chamomile,
  gypsophila,
  eucalyptus,
}
