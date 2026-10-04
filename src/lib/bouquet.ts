/**
 * Состав букета и всё, что из него считается: цена, размеры S/M/L,
 * «уложиться в бюджет», запись в адрес (поделиться ссылкой).
 * Чистые функции без DOM — покрыты тестами (bouquet.test.ts).
 */
import { plural } from 'kit/js/form/schema.js'
import {
  COLORS,
  FLORIST_FEE,
  FLOWERS,
  RIBBONS,
  WRAPS,
  flowerById,
  ribbonById,
  wrapById,
  type ColorId,
  type FlowerId,
  type RibbonId,
  type WrapId,
} from '../data/flowers'

/** Строка состава: «5 пудровых пионов». */
export interface Stem {
  flower: FlowerId
  color: ColorId
  count: number
}

export interface Composition {
  stems: Stem[]
  wrap: WrapId
  ribbon: RibbonId
}

export type Size = 'S' | 'M' | 'L'

/** Во сколько раз меняется количество цветов. M — как в каталоге. */
export const SIZE_FACTOR: Record<Size, number> = { S: 0.6, M: 1, L: 1.6 }
export const SIZE_LABEL: Record<Size, string> = { S: 'Компактный', M: 'Стандарт', L: 'Пышный' }

/** Больше — букет не поднять и не нарисовать красиво. */
export const MAX_STEMS = 61

export const stemsCount = (c: Composition) => c.stems.reduce((sum, s) => sum + s.count, 0)

export const flowersPrice = (c: Composition) =>
  c.stems.reduce((sum, s) => sum + flowerById(s.flower).price * s.count, 0)

/** Из чего складывается цена — для строки «итого» и расшифровки. */
export function priceBreakdown(c: Composition) {
  const flowers = flowersPrice(c)
  const wrap = wrapById(c.wrap).price
  const ribbon = ribbonById(c.ribbon).price
  return { flowers, wrap, ribbon, florist: FLORIST_FEE, total: flowers + wrap + ribbon + FLORIST_FEE }
}

export const priceOf = (c: Composition) => priceBreakdown(c).total

/** Букет нужного размера: количества умножаются и округляются, минимум 1. */
export function resize(c: Composition, size: Size): Composition {
  const k = SIZE_FACTOR[size]
  return { ...c, stems: c.stems.map((s) => ({ ...s, count: Math.max(1, Math.round(s.count * k)) })) }
}

/** Сложить одинаковые строки (тот же цветок и оттенок) и убрать нулевые. */
export function normalize(c: Composition): Composition {
  // Сначала складываем (в том числе отрицательные — так addStem убирает
  // цветы), и только потом выбрасываем то, что стало ≤ 0.
  const map = new Map<string, Stem>()
  for (const s of c.stems) {
    const key = `${s.flower}:${s.color}`
    const prev = map.get(key)
    map.set(key, prev ? { ...prev, count: prev.count + s.count } : { ...s })
  }
  return { ...c, stems: [...map.values()].filter((s) => s.count > 0) }
}

/** Изменить количество (delta может быть отрицательной). Не выходит за MAX_STEMS. */
export function addStem(c: Composition, flower: FlowerId, color: ColorId, delta: number): Composition {
  const room = MAX_STEMS - stemsCount(c)
  const step = delta > 0 ? Math.min(delta, room) : delta
  if (step === 0) return c
  return normalize({ ...c, stems: [...c.stems, { flower, color, count: step }] })
}

/**
 * Уложиться в бюджет: убираем по одному самые дорогие цветы, пока цена
 * больше бюджета. Каждый вид цветка оставляем хотя бы в одном экземпляре —
 * букет не теряет «характер». Возвращает новый состав и что убрали.
 * Если даже минимальный состав дороже — fits: false.
 */
export function fitBudget(c: Composition, budget: number) {
  let next = normalize(c)
  const removed = new Map<string, number>()
  // Ограничитель на всякий случай: за шаг убирается один цветок, их ≤ MAX_STEMS.
  for (let guard = 0; priceOf(next) > budget && guard <= MAX_STEMS; guard++) {
    const candidate = [...next.stems]
      .filter((s) => s.count > 1)
      .sort((a, b) => flowerById(b.flower).price - flowerById(a.flower).price)[0]
    if (!candidate) break
    next = addStem(next, candidate.flower, candidate.color, -1)
    const key = `${candidate.flower}:${candidate.color}`
    removed.set(key, (removed.get(key) ?? 0) + 1)
  }
  return {
    composition: next,
    removed: [...removed].map(([key, count]) => {
      const [flower, color] = key.split(':') as [FlowerId, ColorId]
      return { flower, color, count }
    }),
    fits: priceOf(next) <= budget,
  }
}

/**
 * «5 пионов (пудровый)». Оттенок — в скобках: прилагательное пришлось бы
 * согласовывать с родом и числом («красная роза», «красных роз»).
 */
export function stemLabel(s: Stem) {
  const f = flowerById(s.flower)
  const color = f.role === 'green' ? '' : ` (${COLORS[s.color].name.toLowerCase()})`
  return `${s.count} ${plural(s.count, f.forms)}${color}`
}

// ─── Запись в адрес ─────────────────────────────────────────────────────────
// ?s=peony.blush.5,eucalyptus.sage.3&w=kraft&r=satin-blush
// Адрес может прийти чужой или испорченный — всё проверяем по справочникам.

export function toParams(c: Composition) {
  const p = new URLSearchParams()
  p.set('s', c.stems.map((s) => `${s.flower}.${s.color}.${s.count}`).join(','))
  p.set('w', c.wrap)
  p.set('r', c.ribbon)
  return p
}

export function fromParams(p: URLSearchParams, fallback: Composition): Composition {
  const stems: Stem[] = []
  for (const part of (p.get('s') ?? '').split(',')) {
    const [flower, color, n] = part.split('.')
    const f = FLOWERS.find((x) => x.id === flower)
    const count = Math.floor(Number(n))
    if (!f || !f.colors.includes(color as ColorId) || !(count > 0)) continue
    stems.push({ flower: f.id, color: color as ColorId, count })
  }
  const wrap = WRAPS.find((w) => w.id === p.get('w'))?.id ?? fallback.wrap
  const ribbon = RIBBONS.find((r) => r.id === p.get('r'))?.id ?? fallback.ribbon
  if (!stems.length) return { ...fallback, wrap, ribbon }
  // Не больше MAX_STEMS: лишнее срезаем с конца.
  let left = MAX_STEMS
  const limited = normalize({ stems, wrap, ribbon }).stems.map((s) => {
    const count = Math.min(s.count, left)
    left -= count
    return { ...s, count }
  })
  return normalize({ stems: limited, wrap, ribbon })
}

/** Короткий код состава для избранного: «peony.blush.5,…|kraft|satin-blush». */
export const toCode = (c: Composition) => toParams(c).toString()
export const fromCode = (code: string, fallback: Composition) => fromParams(new URLSearchParams(code), fallback)

/** Стабильное число из состава — seed для рисунка (одинаковый букет = одинаковая картинка). */
export function seedOf(c: Composition | string) {
  const text = typeof c === 'string' ? c : toCode(c)
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export const formatPrice = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`
