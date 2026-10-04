/**
 * Корзина и избранное.
 *
 * Корзина хранит СОСТАВ букета, а не цену: цена всегда пересчитывается из
 * текущих цен (data/flowers.ts). Изменили цены — корзина у всех обновится,
 * старая цена «не залипнет» в localStorage.
 *
 * Избранное — список строк: «b:<id>» — готовый букет, «c:<код>» — собранный в
 * конструкторе (код состава из lib/bouquet → toCode).
 */
import { CARD_PRICE, FLOWERS, RIBBONS, WRAPS } from '../data/flowers'
import { priceOf, toCode, type Composition, type Size } from './bouquet'
import { createStore } from './store'

export interface CartItem {
  id: string
  title: string
  composition: Composition
  /** Готовый букет из каталога (для ссылки на его страницу). */
  bouquetId?: string
  size?: Size
  /** Текст открытки, '' — без открытки. */
  card: string
  qty: number
}

export const MAX_QTY = 20

export const lineTotal = (item: CartItem) => (priceOf(item.composition) + (item.card ? CARD_PRICE : 0)) * item.qty

export const cartTotal = (items: CartItem[]) => items.reduce((sum, item) => sum + lineTotal(item), 0)

export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.qty, 0)

/** Тот же букет с той же открыткой — не новая строка, а +1 к количеству. */
export function addItem(items: CartItem[], item: Omit<CartItem, 'id' | 'qty'>, qty = 1): CartItem[] {
  const same = items.find(
    (i) =>
      i.bouquetId === item.bouquetId &&
      i.size === item.size &&
      i.card === item.card &&
      toCode(i.composition) === toCode(item.composition),
  )
  if (same) return items.map((i) => (i === same ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i))
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return [...items, { ...item, id, qty: Math.min(MAX_QTY, qty) }]
}

export const setQty = (items: CartItem[], id: string, qty: number) =>
  items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, Math.round(qty) || 1)) } : i))

export const removeItem = (items: CartItem[], id: string) => items.filter((i) => i.id !== id)

/** Проверка того, что лежит в localStorage: битые строки выбрасываем. */
export function validateCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((i): i is CartItem => {
    const c = i?.composition
    return (
      typeof i?.id === 'string' &&
      typeof i.title === 'string' &&
      typeof i.card === 'string' &&
      Number.isInteger(i.qty) &&
      i.qty > 0 &&
      Array.isArray(c?.stems) &&
      c.stems.length > 0 &&
      c.stems.every((s: { flower: string; count: number }) => FLOWERS.some((f) => f.id === s.flower) && s.count > 0) &&
      WRAPS.some((w) => w.id === c.wrap) &&
      RIBBONS.some((r) => r.id === c.ribbon)
    )
  })
}

export const cart = createStore<CartItem[]>('lepestok:cart', [], validateCart)

export const favorites = createStore<string[]>('lepestok:favorites', [], (v) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^[bc]:/.test(x)) : [],
)

export function toggleFavorite(key: string) {
  let added = false
  favorites.set((list) => {
    added = !list.includes(key)
    return added ? [...list, key] : list.filter((k) => k !== key)
  })
  return added
}
