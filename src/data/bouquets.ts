/**
 * Готовые букеты каталога. Цена не хранится — считается из состава
 * (lib/bouquet.ts → priceOf), поэтому изменить цену = изменить состав или
 * цены цветов в data/flowers.ts.
 *
 * id — часть адреса (/bouquet/<id>), не меняйте у опубликованных букетов.
 *
 * Фото — public/photos/<id>.jpg (Pexels, бесплатная лицензия; авторы — в
 * credit и README). Состав подобран под фото, чтобы цена «совпадала» с
 * картинкой. Своё фото: положите файл и поменяйте photo/credit.
 */
import { asset } from '../lib/asset'
import type { Composition } from '../lib/bouquet'

export type Occasion = 'birthday' | 'love' | 'wedding' | 'sorry' | 'mom' | 'just' | 'baby'

export const OCCASIONS: Record<Occasion, { title: string; emoji: string; text: string }> = {
  birthday: { title: 'День рождения', emoji: '🎂', text: 'Яркие и праздничные' },
  love: { title: 'Любимой', emoji: '💌', text: 'Розы, пионы, признания' },
  wedding: { title: 'Свадьба', emoji: '💍', text: 'Белые и пудровые' },
  sorry: { title: 'Извиниться', emoji: '🕊', text: 'Нежно и без пафоса' },
  mom: { title: 'Маме', emoji: '🌷', text: 'Тёплые и уютные' },
  just: { title: 'Просто так', emoji: '☀️', text: 'Поднять настроение' },
  baby: { title: 'Рождение ребёнка', emoji: '🍼', text: 'Светлые оттенки' },
}

export interface Bouquet {
  id: string
  title: string
  text: string
  occasions: Occasion[]
  composition: Composition
  /** Путь от корня сайта: /photos/<id>.jpg. */
  photo: string
  credit: { author: string; url: string }
  badge?: 'Хит' | 'Новинка' | 'Сезон'
}

export const BOUQUETS: Bouquet[] = [
  {
    id: 'utro-v-provanse',
    title: 'Утро в Провансе',
    text: 'Пятнадцать розовых пионов в матовой плёнке. Пышный, нежный и самый популярный букет коллекции.',
    occasions: ['love', 'wedding', 'mom'],
    badge: 'Хит',
    composition: {
      stems: [{ flower: 'peony', color: 'pink', count: 15 }],
      wrap: 'film',
      ribbon: 'satin-blush',
    },
    photo: asset('/photos/utro-v-provanse.jpg'),
    credit: { author: 'Julia Çarı', url: 'https://www.pexels.com/photo/32178975/' },
  },
  {
    id: 'alaya-strast',
    title: 'Алая страсть',
    text: 'Пятнадцать красных роз с зеленью в яркой бумаге. Классика, которая всегда работает.',
    occasions: ['love', 'birthday'],
    composition: {
      stems: [
        { flower: 'rose', color: 'red', count: 15 },
        { flower: 'eucalyptus', color: 'sage', count: 4 },
      ],
      wrap: 'kraft',
      ribbon: 'satin-sage',
    },
    photo: asset('/photos/alaya-strast.jpg'),
    credit: { author: 'Shameel Mukkath', url: 'https://www.pexels.com/photo/11196806/' },
  },
  {
    id: 'persikovyy-zakat',
    title: 'Персиковый закат',
    text: 'Большой круглый букет из персиковых и кремовых роз — тёплый, как вечер в августе.',
    occasions: ['birthday', 'mom', 'wedding'],
    badge: 'Новинка',
    composition: {
      stems: [
        { flower: 'rose', color: 'peach', count: 21 },
        { flower: 'rose', color: 'cream', count: 12 },
        { flower: 'eucalyptus', color: 'sage', count: 5 },
      ],
      wrap: 'film',
      ribbon: 'silk-cream',
    },
    photo: asset('/photos/persikovyy-zakat.jpg'),
    credit: { author: 'Faustin Nkurunziza', url: 'https://www.pexels.com/photo/31624870/' },
  },
  {
    id: 'polevoy',
    title: 'Полевой',
    text: 'Охапка ромашек — как будто собрали на лугу по дороге домой.',
    occasions: ['just', 'mom', 'sorry'],
    composition: {
      stems: [{ flower: 'chamomile', color: 'white', count: 25 }],
      wrap: 'kraft',
      ribbon: 'twine',
    },
    photo: asset('/photos/polevoy.jpg'),
    credit: { author: 'Katrenur', url: 'https://www.pexels.com/photo/10583573/' },
  },
  {
    id: 'belaya-vual',
    title: 'Белая вуаль',
    text: 'Белые розы с зеленью — свадебная классика. Для свадьбы, выписки и важных «спасибо».',
    occasions: ['wedding', 'baby', 'sorry'],
    composition: {
      stems: [
        { flower: 'rose', color: 'white', count: 15 },
        { flower: 'eucalyptus', color: 'sage', count: 3 },
      ],
      wrap: 'paper',
      ribbon: 'silk-cream',
    },
    photo: asset('/photos/belaya-vual.jpg'),
    credit: { author: 'Brent Keane', url: 'https://www.pexels.com/photo/1702371/' },
  },
  {
    id: 'rozy-v-korobke',
    title: 'Розы в шляпной коробке',
    text: 'Пудровые и малиновые розы в шляпной коробке — подарок, который не нужно ставить в вазу.',
    occasions: ['birthday', 'love', 'mom'],
    badge: 'Хит',
    composition: {
      stems: [
        { flower: 'rose', color: 'blush', count: 7 },
        { flower: 'rose', color: 'pink', count: 4 },
        { flower: 'eucalyptus', color: 'sage', count: 3 },
      ],
      wrap: 'box',
      ribbon: 'satin-blush',
    },
    photo: asset('/photos/rozy-v-korobke.jpg'),
    credit: { author: 'Vladimir Srajber', url: 'https://www.pexels.com/photo/18057437/' },
  },
  {
    id: 'lavandovyy-son',
    title: 'Лавандовый сон',
    text: 'Эустома в сиреневых и розовых тонах. Спокойный и стильный букет.',
    occasions: ['just', 'sorry', 'mom'],
    composition: {
      stems: [
        { flower: 'lisianthus', color: 'lilac', count: 7 },
        { flower: 'lisianthus', color: 'blush', count: 5 },
        { flower: 'eucalyptus', color: 'sage', count: 3 },
      ],
      wrap: 'film',
      ribbon: 'satin-sage',
    },
    photo: asset('/photos/lavandovyy-son.jpg'),
    credit: { author: 'Ssümçiğ', url: 'https://www.pexels.com/photo/39282635/' },
  },
  {
    id: 'malenkoe-schaste',
    title: 'Маленькое счастье',
    text: 'Семь нежно-розовых роз в крафте. Помещается в руку и в любую вазу.',
    occasions: ['baby', 'just', 'sorry'],
    composition: {
      stems: [{ flower: 'rose', color: 'blush', count: 7 }],
      wrap: 'kraft',
      ribbon: 'satin-blush',
    },
    photo: asset('/photos/malenkoe-schaste.jpg'),
    credit: { author: 'Anastasiya Badun', url: 'https://www.pexels.com/photo/36688271/' },
  },
  {
    id: 'osenniy-barhat',
    title: 'Осенний бархат',
    text: 'Персиковые и пудровые розы с тёмной зеленью — глубокий осенний букет.',
    occasions: ['love', 'birthday'],
    composition: {
      stems: [
        { flower: 'rose', color: 'peach', count: 9 },
        { flower: 'rose', color: 'blush', count: 5 },
        { flower: 'eucalyptus', color: 'sage', count: 5 },
      ],
      wrap: 'kraft',
      ribbon: 'silk-cream',
    },
    photo: asset('/photos/osenniy-barhat.jpg'),
    credit: { author: 'Ellie Burgin', url: 'https://www.pexels.com/photo/28890606/' },
  },
  {
    id: 'vesenniy-sad',
    title: 'Весенний сад',
    text: 'Разноцветные тюльпаны охапкой — от жёлтого до сиреневого. Пахнет весной.',
    occasions: ['mom', 'just', 'birthday'],
    badge: 'Сезон',
    composition: {
      stems: [
        { flower: 'tulip', color: 'red', count: 7 },
        { flower: 'tulip', color: 'yellow', count: 5 },
        { flower: 'tulip', color: 'peach', count: 5 },
        { flower: 'tulip', color: 'lilac', count: 4 },
      ],
      wrap: 'paper',
      ribbon: 'satin-sage',
    },
    photo: asset('/photos/vesenniy-sad.jpg'),
    credit: { author: 'Michael Obstoj', url: 'https://www.pexels.com/photo/30734753/' },
  },
  {
    id: 'oblako',
    title: 'Облако',
    text: 'Большая охапка гипсофилы. Лёгкий, воздушный и очень фотогеничный.',
    occasions: ['wedding', 'baby', 'just'],
    composition: {
      stems: [{ flower: 'gypsophila', color: 'white', count: 11 }],
      wrap: 'film',
      ribbon: 'silk-cream',
    },
    photo: asset('/photos/oblako.jpg'),
    credit: { author: 'Tuan Vy', url: 'https://www.pexels.com/photo/19843318/' },
  },
  {
    id: 'korallovyy-rif',
    title: 'Коралловый риф',
    text: 'Семь коралловых пионов — сочный цвет, который видно из другого конца комнаты.',
    occasions: ['birthday', 'just'],
    badge: 'Сезон',
    composition: {
      stems: [{ flower: 'peony', color: 'coral', count: 7 }],
      wrap: 'film',
      ribbon: 'satin-blush',
    },
    photo: asset('/photos/korallovyy-rif.jpg'),
    credit: { author: 'Marta Dzedyshko', url: 'https://www.pexels.com/photo/17117470/' },
  },
]

export const bouquetById = (id: string) => BOUQUETS.find((b) => b.id === id)
