/**
 * Букет целиком: раскладка цветов «куполом» + упаковка, стебли, лента.
 *
 *   renderBouquet(composition, { seed }) → { width, height, back, items, front }
 *   bouquetSvg(composition)              → готовая строка <svg> (карточки, галерея)
 *   bouquetDataUrl(composition)          → data:image/svg+xml… для <img> и WebGL
 *
 * ─── Раскладка ──────────────────────────────────────────────────────────────
 * Головки цветов — по спирали подсолнуха (золотой угол): точки равномерно
 * заполняют круг без сетки и без наложений. Крупные цветы (роль focal) — в
 * центре, мелкие — дальше. Круг сплющен по вертикали — получается купол,
 * как у настоящего букета, если смотреть спереди. Нижние головки рисуются
 * позже верхних — они ближе к зрителю и перекрывают их.
 * Зелень — веером по краю, сзади; гипсофила — облаками между головками.
 * Цветов много — головки уменьшаются, чтобы букет не вылезал за картинку.
 *
 * ─── Стабильность (важно для конструктора) ─────────────────────────────────
 * У каждого цветка свой ключ «peony.blush.2» и своё зерно случайности от
 * ключа. Добавили цветок — остальные сдвинутся на новые места, но не
 * поменяют форму: в React это плавное перестроение, а не «мигание».
 */
import { COLORS, flowerById, ribbonById, wrapById, type FlowerId } from '../../data/flowers'
import type { Composition } from '../bouquet'
import { FLOWER_ART } from './flowers'
import { between, createRandom, hashString, n } from './random'

export const ART_WIDTH = 400
export const ART_HEIGHT = 480

const CX = ART_WIDTH / 2
const DOME_Y = 190
const BIND_Y = 335
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const MAX_RADIUS = 145

export interface PlacedItem {
  key: string
  flower: FlowerId
  /** Слой: 0 — зелень, 1 — гипсофила, 2 — головки. */
  layer: number
  x: number
  y: number
  rotate: number
  scale: number
  svg: string
}

export interface BouquetArt {
  width: number
  height: number
  /** Что под цветами: тень, задний лист бумаги/коробка, стебли. */
  back: string
  items: PlacedItem[]
  /** Что поверх: передний лист, лента, бант. */
  front: string
}

interface Options {
  /** Зерно — меняет «почерк» букета (наклоны, детали), не состав. */
  seed?: number
  /**
   * Свой фон (мягкое розовое пятно). Нужен для WebGL-галереи: прозрачный
   * фон SVG в текстуре становится чёрным.
   */
  background?: boolean
}

/** Разложить состав на отдельные цветы с местами на картинке. */
export function layoutBouquet(c: Composition, { seed = 1 }: Options = {}) {
  const isBox = c.wrap === 'box'
  const heads: { key: string; flower: FlowerId; color: string; size: number; order: number }[] = []
  const clouds: typeof heads = []
  const greens: typeof heads = []

  for (const stem of c.stems) {
    const f = flowerById(stem.flower)
    for (let i = 0; i < stem.count; i++) {
      const key = `${stem.flower}.${stem.color}.${i}`
      const rnd = createRandom(hashString(key) ^ seed)
      const item = { key, flower: stem.flower, color: stem.color, size: f.size, order: f.size + rnd() * 0.25 }
      if (f.role === 'green') greens.push(item)
      else if (f.id === 'gypsophila') clouds.push(item)
      else heads.push(item)
    }
  }

  // Размер купола: как если бы на головку приходилось ~30 px радиуса. Не
  // влезает — уменьшаем все головки (k < 1). Головки рисуются на 20 % крупнее
  // шага — соседние слегка перекрываются, букет выглядит пышным, без дыр.
  const avg = heads.length ? heads.reduce((s, h) => s + h.size, 0) / heads.length : 1
  const natural = 30 * avg * Math.sqrt(Math.max(heads.length, 1))
  const radius = Math.min(MAX_RADIUS, Math.max(natural, clouds.length ? 70 : 30))
  const k = Math.min(1.15, radius / Math.max(natural, 1))
  const squash = isBox ? 0.55 : 0.8
  const centerY = isBox ? 230 : DOME_Y

  // Крупные — ближе к центру: сортируем по размеру, точки спирали идут от центра.
  heads.sort((a, b) => b.order - a.order)
  const items: PlacedItem[] = []
  heads.forEach((h, i) => {
    const rnd = createRandom(hashString(h.key) ^ seed)
    const r = radius * Math.sqrt((i + 0.5) / heads.length)
    const a = i * GOLDEN + seed
    items.push({
      key: h.key,
      flower: h.flower,
      layer: 2,
      x: CX + Math.cos(a) * r,
      y: centerY + Math.sin(a) * r * squash,
      rotate: h.flower === 'tulip' ? between(rnd, -18, 18) + Math.cos(a) * (r / radius) * 25 : between(rnd, 0, 360),
      scale: 1.2 * k * h.size * between(rnd, 0.92, 1.06),
      svg: FLOWER_ART[h.flower](rnd, COLORS[h.color as keyof typeof COLORS]),
    })
  })

  clouds.forEach((h, i) => {
    const rnd = createRandom(hashString(h.key) ^ seed)
    const a = (i / clouds.length) * Math.PI * 2 + between(rnd, -0.4, 0.4) + seed
    const r = radius * between(rnd, 0.55, 1.05)
    items.push({
      key: h.key,
      flower: h.flower,
      layer: 1,
      x: CX + Math.cos(a) * r,
      y: centerY + Math.sin(a) * r * squash,
      rotate: between(rnd, 0, 360),
      scale: Math.max(0.75, k) * between(rnd, 0.9, 1.15),
      svg: FLOWER_ART[h.flower](rnd, COLORS[h.color as keyof typeof COLORS]),
    })
  })

  // Зелень веером: от −105° до 105° от вертикали, основание — внутри купола.
  greens.forEach((h, i) => {
    const rnd = createRandom(hashString(h.key) ^ seed)
    const spread = isBox ? 80 : 105
    const deg = -spread + (2 * spread * (i + 0.5)) / greens.length + between(rnd, -8, 8)
    const rad = (deg * Math.PI) / 180
    items.push({
      key: h.key,
      flower: h.flower,
      layer: 0,
      x: CX + Math.sin(rad) * radius * 0.7,
      y: centerY - Math.cos(rad) * radius * 0.6 * squash + 6,
      rotate: deg,
      scale: 0.8 + (radius / MAX_RADIUS) * 0.55,
      svg: FLOWER_ART[h.flower](rnd, COLORS[h.color as keyof typeof COLORS]),
    })
  })

  // Порядок рисования: слой, затем сверху вниз (нижние ближе к зрителю).
  items.sort((a, b) => a.layer - b.layer || a.y - b.y)
  return { items, radius, centerY, isBox }
}

/** Букет в виде частей — для React (каждый цветок отдельным <g> с анимацией). */
export function renderBouquet(c: Composition, options: Options = {}): BouquetArt {
  const { items, radius, centerY, isBox } = layoutBouquet(c, options)
  const wrap = wrapById(c.wrap)
  const ribbon = ribbonById(c.ribbon)
  const heads = items.filter((i) => i.layer === 2)
  const w = radius + 40

  let back = `<ellipse cx="${CX}" cy="458" rx="${n(isBox ? w : 90)}" ry="12" fill="#2b2321" opacity=".08"/>`
  let front: string

  if (isBox) {
    const top = centerY + radius * 0.35
    back += `<ellipse cx="${CX}" cy="${n(top)}" rx="${n(w)}" ry="22" fill="${wrap.shade}"/>`
    front =
      `<path d="M${n(CX - w)} ${n(top)}V448A${n(w)} 22 0 0 0 ${n(CX + w)} 448V${n(top)}A${n(w)} 22 0 0 1 ${n(CX - w)} ${n(top)}Z" fill="${wrap.color}"/>` +
      `<path d="M${n(CX - w)} ${n(top + 70)}A${n(w)} 22 0 0 0 ${n(CX + w)} ${n(top + 70)}V${n(top + 90)}A${n(w)} 22 0 0 1 ${n(CX - w)} ${n(top + 90)}Z" fill="${ribbon.color}"/>` +
      bow(CX, top + 98, ribbon.color)
  } else {
    // Стебли: от каждой головки к точке связки, ниже — пучком вниз.
    const stems = heads
      .map((h, i) => {
        const spread = ((i % 7) - 3) * 4
        return `M${n(h.x)} ${n(h.y + 8)}Q${n((h.x + CX) / 2)} ${n((h.y + BIND_Y) / 2 + 20)} ${CX} ${BIND_Y}L${n(CX + spread)} 452`
      })
      .join('')
    const topY = centerY - radius * 0.55
    // Задний лист: широкий «конус» с неровным верхним краем.
    back +=
      `<path d="M${n(CX - w - 18)} ${n(topY + 30)}Q${n(CX - w / 2)} ${n(topY - 14)} ${CX} ${n(topY + 6)}Q${n(CX + w / 2)} ${n(topY - 18)} ${n(CX + w + 18)} ${n(topY + 26)}L${CX + 12} 430L${CX - 12} 430Z" fill="${wrap.shade}"/>` +
      `<path d="${stems}" fill="none" stroke="#6f8a5c" stroke-width="2.2" stroke-linecap="round"/>`
    // Передний лист: два крыла, сходящихся к связке, со складкой посередине.
    const lowY = Math.max(centerY + radius * 0.62, 268)
    const fw = w * 0.88
    front =
      `<path d="M${n(CX - fw)} ${n(lowY - 6)}L${CX - 8} 440L${CX + 8} 440L${n(CX + fw)} ${n(lowY - 6)}Q${CX} ${n(lowY + 36)} ${n(CX - fw)} ${n(lowY - 6)}Z" fill="${wrap.color}"/>` +
      `<path d="M${n(CX - fw * 0.55)} ${n(lowY + 10)}L${CX - 3} 438M${n(CX + fw * 0.55)} ${n(lowY + 10)}L${CX + 3} 438" stroke="${wrap.shade}" stroke-width="1.2" fill="none" opacity=".8"/>` +
      bow(CX, BIND_Y + 22, ribbon.color)
  }

  return { width: ART_WIDTH, height: ART_HEIGHT, back, items, front }
}

/** Бант: две петли и два хвоста. */
function bow(x: number, y: number, color: string) {
  return (
    `<g transform="translate(${n(x)} ${n(y)})" fill="${color}" stroke="#00000022" stroke-width=".8">` +
    `<path d="M0 0C-26 -22 -40 -2 -30 8C-22 16 -8 6 0 0Z"/><path d="M0 0C26 -22 40 -2 30 8C22 16 8 6 0 0Z"/>` +
    `<path d="M-2 2L-16 44L-8 40L-2 46Z"/><path d="M2 2L14 42L6 40L2 46Z"/><circle r="6"/></g>`
  )
}

export const itemTransform = (i: Pick<PlacedItem, 'x' | 'y' | 'rotate' | 'scale'>) =>
  `translate(${n(i.x)} ${n(i.y)}) rotate(${n(i.rotate)}) scale(${n(i.scale * 100) / 100})`

/** Готовая строка SVG. width/height обязательны — без них WebGL-текстура и <img> получают размер 0. */
export function bouquetSvg(c: Composition, options: Options = {}) {
  const art = renderBouquet(c, options)
  const items = art.items.map((i) => `<g transform="${itemTransform(i)}">${i.svg}</g>`).join('')
  const background = options.background
    ? `<defs><radialGradient id="bg" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#f4d9d4"/><stop offset="1" stop-color="#f3e9df"/></radialGradient></defs><rect width="${art.width}" height="${art.height}" fill="url(#bg)"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width}" height="${art.height}" viewBox="0 0 ${art.width} ${art.height}">${background}${art.back}${items}${art.front}</svg>`
}

const cache = new Map<string, string>()

/** Картинка для <img> (кэшируется: каталог перерисовывается часто). */
export function bouquetDataUrl(c: Composition, options: Options = {}) {
  const key = JSON.stringify([c, options.seed ?? 1, !!options.background])
  let url = cache.get(key)
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bouquetSvg(c, options))}`
    if (cache.size > 300) cache.clear()
    cache.set(key, url)
  }
  return url
}
