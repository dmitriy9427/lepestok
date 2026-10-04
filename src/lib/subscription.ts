/**
 * Цветочная подписка: калькулятор цены и выгоды.
 * Скидка растёт с частотой доставок и сроком оплаты вперёд (складываются).
 */

export type Frequency = 'weekly' | 'biweekly' | 'monthly'
export type PlanSize = 'S' | 'M' | 'L'

export const FREQUENCIES: Record<Frequency, { title: string; perMonth: number; discount: number }> = {
  weekly: { title: 'Каждую неделю', perMonth: 4, discount: 0.15 },
  biweekly: { title: 'Раз в две недели', perMonth: 2, discount: 0.1 },
  monthly: { title: 'Раз в месяц', perMonth: 1, discount: 0.05 },
}

export const PLAN_SIZES: Record<PlanSize, { title: string; price: number; text: string }> = {
  S: { title: 'Маленький', price: 2400, text: '7–9 стеблей, для кухни или рабочего стола' },
  M: { title: 'Средний', price: 3900, text: '11–15 стеблей, для гостиной' },
  L: { title: 'Большой', price: 5900, text: '19–25 стеблей, когда хочется вау' },
}

/** Срок, месяцев → доп. скидка. */
export const TERMS: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.1 }

export function subscriptionPrice(size: PlanSize, frequency: Frequency, months: number) {
  const f = FREQUENCIES[frequency]
  const deliveries = f.perMonth * months
  const full = PLAN_SIZES[size].price * deliveries
  const discount = Math.min(0.3, f.discount + (TERMS[months] ?? 0))
  const total = Math.round((full * (1 - discount)) / 10) * 10
  return { deliveries, full, total, saving: full - total, perDelivery: Math.round(total / deliveries), discount }
}
