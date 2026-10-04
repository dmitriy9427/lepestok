/**
 * Фильтры каталога: что выбрано → подходит ли букет; запись в адрес и обратно.
 * Адрес — источник правды: ?occasion=love&price=3000-8000&flowers=rose,peony&tone=pink&sort=-price
 * (ссылкой можно поделиться, «Назад» возвращает прошлый фильтр).
 */
import type { Bouquet, Occasion } from '../data/bouquets'
import { OCCASIONS } from '../data/bouquets'
import { FLOWERS, flowerById, type ColorId, type FlowerId } from '../data/flowers'
import { priceOf } from './bouquet'

/** Тона для фильтра — группы оттенков из справочника. */
export const TONES = {
  white: { title: 'Белые', colors: ['white', 'cream'], swatch: '#f6efe2' },
  pink: { title: 'Розовые', colors: ['blush', 'pink', 'peony'], swatch: '#eba3b4' },
  red: { title: 'Красные', colors: ['red', 'burgundy'], swatch: '#b42e3e' },
  warm: { title: 'Тёплые', colors: ['coral', 'peach', 'yellow'], swatch: '#f3a77e' },
  lilac: { title: 'Сиреневые', colors: ['lilac'], swatch: '#bfa6db' },
} satisfies Record<string, { title: string; colors: ColorId[]; swatch: string }>

export type Tone = keyof typeof TONES

export type Sort = 'popular' | 'price' | '-price'

export const SORTS: Record<Sort, string> = {
  popular: 'Сначала популярные',
  price: 'Сначала дешевле',
  '-price': 'Сначала дороже',
}

export interface Filters {
  occasion: Occasion | null
  price: [number, number] | null
  flowers: FlowerId[]
  tone: Tone | null
  sort: Sort
}

export const EMPTY_FILTERS: Filters = { occasion: null, price: null, flowers: [], tone: null, sort: 'popular' }

/** Основной тон букета — по самому многочисленному цветку (без зелени). */
export function toneOf(b: Bouquet): Tone | null {
  const main = [...b.composition.stems]
    .filter((s) => flowerById(s.flower).role !== 'green')
    .sort((a, z) => z.count - a.count)[0]
  if (!main) return null
  return (Object.keys(TONES) as Tone[]).find((t) => (TONES[t].colors as ColorId[]).includes(main.color)) ?? null
}

export function matches(b: Bouquet, f: Filters) {
  if (f.occasion && !b.occasions.includes(f.occasion)) return false
  if (f.price) {
    const price = priceOf(b.composition)
    if (price < f.price[0] || price > f.price[1]) return false
  }
  if (f.flowers.length && !f.flowers.some((id) => b.composition.stems.some((s) => s.flower === id))) return false
  if (f.tone && toneOf(b) !== f.tone) return false
  return true
}

export function applyFilters(list: Bouquet[], f: Filters) {
  const result = list.filter((b) => matches(b, f))
  // «Популярные» — порядок каталога (букеты с плашкой — первыми).
  if (f.sort === 'popular') return result.sort((a, b) => Number(!!b.badge) - Number(!!a.badge))
  const dir = f.sort === 'price' ? 1 : -1
  return result.sort((a, b) => (priceOf(a.composition) - priceOf(b.composition)) * dir)
}

/** Мин. и макс. цена каталога — границы ползунка. Округлены до сотен наружу. */
export function priceBounds(list: Bouquet[]): [number, number] {
  const prices = list.map((b) => priceOf(b.composition))
  return [Math.floor(Math.min(...prices) / 100) * 100, Math.ceil(Math.max(...prices) / 100) * 100]
}

export function fromSearch(search: string): Filters {
  const p = new URLSearchParams(search)
  const occasion = p.get('occasion')
  const tone = p.get('tone')
  const sort = p.get('sort')
  const price = p
    .get('price')
    ?.split('-')
    .map(Number)
    .filter((v) => Number.isFinite(v))
  return {
    occasion: occasion && occasion in OCCASIONS ? (occasion as Occasion) : null,
    price: price?.length === 2 && price[0] <= price[1] ? [price[0], price[1]] : null,
    flowers: (p.get('flowers') ?? '').split(',').filter((id): id is FlowerId => FLOWERS.some((f) => f.id === id)),
    tone: tone && tone in TONES ? (tone as Tone) : null,
    sort: sort && sort in SORTS ? (sort as Sort) : 'popular',
  }
}

/** Фильтры → строка адреса. Пустые и «по умолчанию» не пишутся; цена = границам — тоже. */
export function toSearch(f: Filters, bounds?: [number, number]) {
  const p = new URLSearchParams()
  if (f.occasion) p.set('occasion', f.occasion)
  if (f.price && !(bounds && f.price[0] <= bounds[0] && f.price[1] >= bounds[1])) p.set('price', f.price.join('-'))
  if (f.flowers.length) p.set('flowers', f.flowers.join(','))
  if (f.tone) p.set('tone', f.tone)
  if (f.sort !== 'popular') p.set('sort', f.sort)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const isFiltered = (f: Filters) => !!(f.occasion || f.price || f.flowers.length || f.tone)
