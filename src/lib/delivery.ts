/**
 * Правила доставки: интервалы, какие из них ещё доступны, стоимость.
 * Время передаётся аргументом (now) — функции чистые, в тестах время любое.
 *
 * Поменять интервалы, время сборки, цены — константы ниже.
 */

export interface Slot {
  id: string
  label: string
  /** Час начала (0–23). */
  from: number
  to: number
}

export const SLOTS: Slot[] = [
  { id: '9-12', label: '9:00–12:00', from: 9, to: 12 },
  { id: '12-15', label: '12:00–15:00', from: 12, to: 15 },
  { id: '15-18', label: '15:00–18:00', from: 15, to: 18 },
  { id: '18-21', label: '18:00–21:00', from: 18, to: 21 },
]

/** Сколько часов нужно флористу на сборку до начала интервала. */
export const ASSEMBLY_HOURS = 2
/** На сколько дней вперёд можно заказать. */
export const MAX_DAYS_AHEAD = 30
export const DELIVERY_PRICE = 390
/** С какой суммы доставка бесплатная. */
export const FREE_DELIVERY_FROM = 7000

export type Method = 'courier' | 'pickup'

/** Дата без времени в формате input[type=date]: '2026-10-04' (по местному времени!). */
export function toDateValue(d: Date) {
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** '2026-10-04' → Date на полночь по местному времени. new Date('2026-10-04') дал бы UTC и «вчера» западнее Гринвича. */
export function fromDateValue(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Интервалы на дату: прошедшие и те, к которым не успеть собрать, — disabled. */
export function slotsFor(dateValue: string, now: Date) {
  const isToday = dateValue === toDateValue(now)
  const hour = now.getHours() + now.getMinutes() / 60
  return SLOTS.map((slot) => ({ ...slot, disabled: isToday && slot.from < hour + ASSEMBLY_HOURS }))
}

/** Ближайшая дата, на которую остался хоть один интервал. */
export function firstAvailableDate(now: Date) {
  const today = toDateValue(now)
  if (slotsFor(today, now).some((s) => !s.disabled)) return today
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return toDateValue(tomorrow)
}

export function lastAvailableDate(now: Date) {
  return toDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + MAX_DAYS_AHEAD))
}

/** Проверка выбранной даты и интервала: '' — всё хорошо, иначе текст ошибки. */
export function checkSlot(dateValue: string, slotId: string, now: Date) {
  if (!dateValue) return 'Выберите дату'
  if (dateValue < firstAvailableDate(now) || dateValue > lastAvailableDate(now))
    return 'На эту дату доставить не получится'
  const slot = slotsFor(dateValue, now).find((s) => s.id === slotId)
  if (!slot) return 'Выберите интервал'
  if (slot.disabled) return 'Не успеем собрать к этому времени — выберите интервал позже'
  return ''
}

export function deliveryPrice(method: Method, itemsTotal: number) {
  if (method === 'pickup' || itemsTotal >= FREE_DELIVERY_FROM) return 0
  return DELIVERY_PRICE
}
