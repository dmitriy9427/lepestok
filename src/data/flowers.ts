/**
 * Справочник: цветы, оттенки, упаковка, ленты. Отсюда берут данные
 * конструктор, каталог и расчёт цены.
 *
 * Новый цветок или оттенок: запись здесь + фото
 * public/photos/flowers/<id>-<оттенок>.jpg (квадрат 300×300).
 * Тест в lib.test.ts проверяет, что фото есть для каждого оттенка.
 * Цены — за штуку, в рублях.
 */

export type ColorId =
  'white' | 'cream' | 'blush' | 'pink' | 'peony' | 'coral' | 'peach' | 'red' | 'burgundy' | 'yellow' | 'lilac' | 'sage'

/** Оттенок: название и цвета для образцов (кружков выбора) в интерфейсе. */
export interface Palette {
  name: string
  petal: string
  shade: string
  center: string
}

export const COLORS: Record<ColorId, Palette> = {
  white: { name: 'Белый', petal: '#fbf8f3', shade: '#e4dccf', center: '#e9e1c8' },
  cream: { name: 'Кремовый', petal: '#f6ead2', shade: '#e2cfa9', center: '#e8d39d' },
  blush: { name: 'Пудровый', petal: '#f4d9d4', shade: '#e2b3ad', center: '#d99b95' },
  pink: { name: 'Розовый', petal: '#f2a7b8', shade: '#d97a92', center: '#c45d79' },
  peony: { name: 'Пионовый', petal: '#e2708f', shade: '#c24c6f', center: '#a8375a' },
  coral: { name: 'Коралловый', petal: '#f39a83', shade: '#dc7560', center: '#c85f4b' },
  peach: { name: 'Персиковый', petal: '#f7c29f', shade: '#e8a07a', center: '#d98a63' },
  red: { name: 'Красный', petal: '#d33a45', shade: '#a8222f', center: '#861a26' },
  burgundy: { name: 'Бордовый', petal: '#8e2a3c', shade: '#6a1a2b', center: '#4f1220' },
  yellow: { name: 'Жёлтый', petal: '#f6d36b', shade: '#e3b13f', center: '#c98f22' },
  lilac: { name: 'Сиреневый', petal: '#c9b2e0', shade: '#a68cc6', center: '#8a6fae' },
  sage: { name: 'Шалфей', petal: '#a9bba3', shade: '#7f957a', center: '#5f7559' },
}

export type FlowerId =
  'rose' | 'peony' | 'tulip' | 'ranunculus' | 'lisianthus' | 'chamomile' | 'eucalyptus' | 'gypsophila'

/**
 * Роль в букете — от неё зависит, куда цветок ставит раскладка:
 * focal — крупные, в центре; accent — вокруг них; filler — мелочь между;
 * green — зелень по краю.
 */
export type Role = 'focal' | 'accent' | 'filler' | 'green'

export interface Flower {
  id: FlowerId
  name: string
  /** Формы для «1 роза / 3 розы / 5 роз». */
  forms: [string, string, string]
  price: number
  role: Role
  colors: ColorId[]
  note: string
}

/** Фото цветка в нужном оттенке: public/photos/flowers/<id>-<оттенок>.jpg (Pexels). */
export const flowerPhoto = (id: FlowerId, color: ColorId) => `/photos/flowers/${id}-${color}.jpg`

export const FLOWERS: Flower[] = [
  {
    id: 'peony',
    name: 'Пион',
    forms: ['пион', 'пиона', 'пионов'],
    price: 590,
    role: 'focal',
    colors: ['blush', 'pink', 'peony', 'white', 'coral'],
    note: 'Пышный, раскрывается за 2–3 дня',
  },
  {
    id: 'rose',
    name: 'Роза',
    forms: ['роза', 'розы', 'роз'],
    price: 290,
    role: 'focal',
    colors: ['red', 'blush', 'cream', 'white', 'peach', 'burgundy', 'pink'],
    note: 'Кенийская, 50 см, стоит до 10 дней',
  },
  {
    id: 'ranunculus',
    name: 'Ранункулюс',
    forms: ['ранункулюс', 'ранункулюса', 'ранункулюсов'],
    price: 260,
    role: 'accent',
    colors: ['peach', 'coral', 'white', 'yellow', 'burgundy', 'pink'],
    note: 'Плотный, как маленькая роза',
  },
  {
    id: 'tulip',
    name: 'Тюльпан',
    forms: ['тюльпан', 'тюльпана', 'тюльпанов'],
    price: 160,
    role: 'accent',
    colors: ['pink', 'red', 'yellow', 'white', 'lilac', 'peach'],
    note: 'Голландский, сезон — с февраля по май',
  },
  {
    id: 'lisianthus',
    name: 'Эустома',
    forms: ['эустома', 'эустомы', 'эустом'],
    price: 240,
    role: 'accent',
    colors: ['white', 'lilac', 'blush', 'cream'],
    note: 'Нежная, несколько бутонов на ветке',
  },
  {
    id: 'chamomile',
    name: 'Ромашка',
    forms: ['ромашка', 'ромашки', 'ромашек'],
    price: 120,
    role: 'filler',
    colors: ['white', 'yellow'],
    note: 'Полевая, для лёгких букетов',
  },
  {
    id: 'gypsophila',
    name: 'Гипсофила',
    forms: ['ветка гипсофилы', 'ветки гипсофилы', 'веток гипсофилы'],
    price: 180,
    role: 'filler',
    colors: ['white', 'blush'],
    note: 'Облако мелких цветков',
  },
  {
    id: 'eucalyptus',
    name: 'Эвкалипт',
    forms: ['ветка эвкалипта', 'ветки эвкалипта', 'веток эвкалипта'],
    price: 150,
    role: 'green',
    colors: ['sage'],
    note: 'Серебристая зелень, приятно пахнет',
  },
]

export const flowerById = (id: FlowerId) => FLOWERS.find((f) => f.id === id)!

export type WrapId = 'kraft' | 'film' | 'paper' | 'box'

export interface Wrap {
  id: WrapId
  name: string
  price: number
  /** Цвет бумаги (для рисования). */
  color: string
  shade: string
}

export const WRAPS: Wrap[] = [
  { id: 'kraft', name: 'Крафт', price: 250, color: '#d4b48c', shade: '#b8956b' },
  { id: 'film', name: 'Матовая плёнка', price: 300, color: '#efe6ea', shade: '#d6c7cd' },
  { id: 'paper', name: 'Тишью «шалфей»', price: 350, color: '#c7d3c0', shade: '#a3b39b' },
  { id: 'box', name: 'Шляпная коробка', price: 900, color: '#2f3d33', shade: '#1f2a22' },
]

export const wrapById = (id: WrapId) => WRAPS.find((w) => w.id === id)!

export type RibbonId = 'satin-blush' | 'satin-sage' | 'silk-cream' | 'twine'

export interface Ribbon {
  id: RibbonId
  name: string
  price: number
  color: string
}

export const RIBBONS: Ribbon[] = [
  { id: 'satin-blush', name: 'Атлас, пудровая', price: 90, color: '#e7b9b4' },
  { id: 'satin-sage', name: 'Атлас, шалфей', price: 90, color: '#8fa58a' },
  { id: 'silk-cream', name: 'Шёлк, кремовая', price: 180, color: '#f1e3c6' },
  { id: 'twine', name: 'Джутовая бечёвка', price: 40, color: '#a88661' },
]

export const ribbonById = (id: RibbonId) => RIBBONS.find((r) => r.id === id)!

/** Работа флориста — в каждом букете. */
export const FLORIST_FEE = 350
/** Открытка с текстом. */
export const CARD_PRICE = 150
