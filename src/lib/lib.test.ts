/**
 * Тесты чистой логики: цена и состав, рисунок, доставка, подписка,
 * фильтры каталога, корзина.
 */
import { describe, expect, it } from 'vitest'
import { BOUQUETS } from '../data/bouquets'
import { FLORIST_FEE, flowerById, ribbonById, wrapById } from '../data/flowers'
import {
  MAX_STEMS,
  addStem,
  fitBudget,
  fromParams,
  priceOf,
  resize,
  stemLabel,
  stemsCount,
  toParams,
  type Composition,
} from './bouquet'
import { ART_HEIGHT, ART_WIDTH, bouquetSvg, layoutBouquet, renderBouquet } from './art/bouquet-art'
import {
  checkSlot,
  deliveryPrice,
  firstAvailableDate,
  slotsFor,
  toDateValue,
  FREE_DELIVERY_FROM,
  DELIVERY_PRICE,
} from './delivery'
import { subscriptionPrice } from './subscription'
import { EMPTY_FILTERS, applyFilters, fromSearch, priceBounds, toSearch, toneOf } from './catalog'
import { addItem, cartTotal, setQty, validateCart, type CartItem } from './cart'

const base: Composition = {
  stems: [
    { flower: 'peony', color: 'blush', count: 5 },
    { flower: 'eucalyptus', color: 'sage', count: 3 },
  ],
  wrap: 'kraft',
  ribbon: 'twine',
}

describe('состав и цена', () => {
  it('цена = цветы + упаковка + лента + работа', () => {
    const expected =
      5 * flowerById('peony').price +
      3 * flowerById('eucalyptus').price +
      wrapById('kraft').price +
      ribbonById('twine').price +
      FLORIST_FEE
    expect(priceOf(base)).toBe(expected)
  })

  it('размеры S/M/L меняют количество, но не меньше одного', () => {
    expect(stemsCount(resize(base, 'L'))).toBeGreaterThan(stemsCount(base))
    const small = resize({ ...base, stems: [{ flower: 'rose', color: 'red', count: 1 }] }, 'S')
    expect(small.stems[0].count).toBe(1)
  })

  it('addStem складывает одинаковые строки, убирает нулевые и держит лимит', () => {
    let c = addStem(base, 'peony', 'blush', 2)
    expect(c.stems.find((s) => s.flower === 'peony')!.count).toBe(7)
    c = addStem(c, 'eucalyptus', 'sage', -3)
    expect(c.stems.some((s) => s.flower === 'eucalyptus')).toBe(false)
    c = addStem(c, 'rose', 'red', 500)
    expect(stemsCount(c)).toBe(MAX_STEMS)
  })

  it('fitBudget убирает самые дорогие, но оставляет хотя бы по одному', () => {
    const big = addStem(base, 'rose', 'red', 10)
    const result = fitBudget(big, 4000)
    expect(result.fits).toBe(true)
    expect(priceOf(result.composition)).toBeLessThanOrEqual(4000)
    expect(result.composition.stems.every((s) => s.count >= 1)).toBe(true)
    expect(result.removed[0].flower).toBe('peony') // самый дорогой
    expect(fitBudget(big, 100).fits).toBe(false)
  })

  it('адрес: туда и обратно; мусор и превышение лимита отбрасываются', () => {
    expect(fromParams(toParams(base), base)).toEqual(base)
    const junk = new URLSearchParams('s=peony.red.3,hack.x.1,rose.blush.-2,rose.blush.999&w=nope&r=twine')
    const parsed = fromParams(junk, base)
    expect(parsed.stems.some((s) => s.flower === 'peony')).toBe(false) // у пиона нет красного
    expect(stemsCount(parsed)).toBe(MAX_STEMS)
    expect(parsed.wrap).toBe('kraft')
  })

  it('подпись состава с правильными окончаниями', () => {
    expect(stemLabel({ flower: 'rose', color: 'red', count: 1 })).toBe('1 роза (красный)')
    expect(stemLabel({ flower: 'rose', color: 'red', count: 5 })).toBe('5 роз (красный)')
    expect(stemLabel({ flower: 'eucalyptus', color: 'sage', count: 2 })).toBe('2 ветки эвкалипта')
  })
})

describe('рисунок букета', () => {
  it('один состав — одна и та же картинка; цветов столько же, сколько в составе', () => {
    expect(bouquetSvg(base)).toBe(bouquetSvg(base))
    expect(renderBouquet(base).items).toHaveLength(stemsCount(base))
  })

  it('все готовые букеты, даже в размере L, помещаются в картинку', () => {
    for (const b of BOUQUETS) {
      for (const item of layoutBouquet(resize(b.composition, 'L')).items) {
        expect(item.x).toBeGreaterThan(0)
        expect(item.x).toBeLessThan(ART_WIDTH)
        expect(item.y).toBeGreaterThan(0)
        expect(item.y).toBeLessThan(ART_HEIGHT)
      }
    }
  })

  it('добавили цветок — у остальных не меняется форма (только место)', () => {
    const before = renderBouquet(base).items.find((i) => i.key === 'peony.blush.0')!
    const after = renderBouquet(addStem(base, 'rose', 'cream', 3)).items.find((i) => i.key === 'peony.blush.0')!
    expect(after.svg).toBe(before.svg)
  })

  it('зелень рисуется раньше (сзади) головок', () => {
    const layers = renderBouquet(base).items.map((i) => i.layer)
    expect(layers).toEqual([...layers].sort((a, b) => a - b))
  })
})

describe('доставка', () => {
  const morning = new Date(2026, 9, 4, 8, 0)
  const evening = new Date(2026, 9, 4, 19, 30)

  it('сегодня: недоступны интервалы, к которым не успеть собрать', () => {
    const slots = slotsFor(toDateValue(morning), morning)
    expect(slots.map((s) => s.disabled)).toEqual([true, false, false, false]) // 9:00 < 8:00 + 2 ч
    expect(slotsFor('2026-10-05', evening).every((s) => !s.disabled)).toBe(true)
  })

  it('вечером ближайшая дата — завтра', () => {
    expect(firstAvailableDate(evening)).toBe('2026-10-05')
    expect(firstAvailableDate(morning)).toBe('2026-10-04')
  })

  it('checkSlot: прошлое, далёкое будущее, неуспеваемый интервал', () => {
    expect(checkSlot('2026-10-03', '12-15', morning)).toMatch(/не получится/)
    expect(checkSlot('2026-12-31', '12-15', morning)).toMatch(/не получится/)
    expect(checkSlot('2026-10-04', '9-12', morning)).toMatch(/Не успеем/)
    expect(checkSlot('2026-10-04', '12-15', morning)).toBe('')
    expect(checkSlot('2026-10-04', '', morning)).toBe('Выберите интервал')
  })

  it('цена доставки', () => {
    expect(deliveryPrice('pickup', 100)).toBe(0)
    expect(deliveryPrice('courier', FREE_DELIVERY_FROM)).toBe(0)
    expect(deliveryPrice('courier', 100)).toBe(DELIVERY_PRICE)
  })

  it('toDateValue — местная дата, а не UTC', () => {
    expect(toDateValue(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
  })
})

describe('подписка', () => {
  it('чаще и дольше — выгоднее; скидка не больше 30 %', () => {
    const month = subscriptionPrice('M', 'monthly', 1)
    const weekly = subscriptionPrice('M', 'weekly', 6)
    expect(month.saving).toBeGreaterThan(0)
    expect(weekly.discount).toBeGreaterThan(month.discount)
    expect(weekly.discount).toBeLessThanOrEqual(0.3)
    expect(weekly.deliveries).toBe(24)
  })
})

describe('каталог', () => {
  it('адрес: туда и обратно, мусор игнорируется', () => {
    const f = {
      ...EMPTY_FILTERS,
      occasion: 'love' as const,
      flowers: ['rose' as const],
      tone: 'red' as const,
      sort: '-price' as const,
      price: [1000, 5000] as [number, number],
    }
    expect(fromSearch(toSearch(f))).toEqual(f)
    expect(fromSearch('?occasion=war&flowers=gun&tone=x&sort=hack&price=9-1')).toEqual(EMPTY_FILTERS)
  })

  it('цена, равная границам, в адрес не пишется', () => {
    const bounds = priceBounds(BOUQUETS)
    expect(toSearch({ ...EMPTY_FILTERS, price: bounds }, bounds)).toBe('')
  })

  it('фильтр и сортировка', () => {
    const red = applyFilters(BOUQUETS, { ...EMPTY_FILTERS, tone: 'red' })
    expect(red.length).toBeGreaterThan(0)
    expect(red.every((b) => toneOf(b) === 'red')).toBe(true)
    const sorted = applyFilters(BOUQUETS, { ...EMPTY_FILTERS, sort: 'price' }).map((b) => priceOf(b.composition))
    expect(sorted).toEqual([...sorted].sort((a, b) => a - b))
  })
})

describe('корзина', () => {
  const item = { title: 'Тест', composition: base, card: '' }

  it('тот же букет — +1 к количеству, с другой открыткой — новая строка', () => {
    let items: CartItem[] = addItem([], item)
    items = addItem(items, item)
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(2)
    items = addItem(items, { ...item, card: 'С днём рождения!' })
    expect(items).toHaveLength(2)
    expect(cartTotal(items)).toBe(priceOf(base) * 3 + 150)
  })

  it('количество от 1 до 20', () => {
    const items = addItem([], item)
    expect(setQty(items, items[0].id, 0)[0].qty).toBe(1)
    expect(setQty(items, items[0].id, 99)[0].qty).toBe(20)
  })

  it('битые данные из localStorage выбрасываются', () => {
    const good = addItem([], item)[0]
    expect(validateCart([good, { id: 1 }, null, { ...good, composition: { ...base, wrap: 'gold' } }])).toEqual([good])
    expect(validateCart('мусор')).toEqual([])
  })
})
