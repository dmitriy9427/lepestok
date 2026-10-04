/**
 * Схемы форм (как zod). Объявлены ВНЕ компонентов: useModule сравнивает
 * объекты в опциях по ссылке — схема, созданная в компоненте, перезапускала
 * бы модуль формы на каждом рендере.
 *
 * Модуль form проверяет только поля, которые есть в форме: при самовывозе
 * поля адреса не рендерятся — и правило address просто не применяется.
 * Методы схем: kit/js/form/schema.js, docs/forms.md.
 */
import { s } from 'kit/js/form/index.js'
import { firstAvailableDate, lastAvailableDate, slotsFor } from '../lib/delivery'

export const PAYMENTS = {
  card: 'Картой онлайн',
  sbp: 'СБП',
  cash: 'Курьеру при получении',
} as const

const name = (message: string) => s.string().trim().min(2, message)

export const orderSchema = s.object({
  name: name('Как к вам обращаться?'),
  phone: s.string().phone(),
  recipientName: name('Кому вручить букет?'),
  recipientPhone: s.string().phone().optional(),
  address: s.string().trim().min(6, 'Укажите улицу и дом'),
  apartment: s.string().max(20).optional(),
  // Дата и интервал — «сейчас» берётся в момент проверки, а не при загрузке
  // страницы: вкладку могли оставить открытой на полдня.
  date: s
    .string()
    .required('Выберите дату')
    .refine(
      (v: string) => v >= firstAvailableDate(new Date()) && v <= lastAvailableDate(new Date()),
      'На эту дату доставить не получится',
    ),
  slot: s
    .string()
    .required('Выберите интервал')
    .refine(
      (v: string, all: Record<string, string>) =>
        !slotsFor(all.date ?? '', new Date()).find((slot) => slot.id === v)?.disabled,
      'Не успеем собрать к этому времени — выберите интервал позже',
    ),
  comment: s.string().max(300).optional(),
  payment: s.enum(Object.keys(PAYMENTS), 'Выберите способ оплаты'),
  consent: s.boolean().isTrue('Нужно согласие на обработку данных'),
})

export const subscriptionSchema = s.object({
  name: name('Как к вам обращаться?'),
  phone: s.string().phone(),
  address: s.string().trim().min(6, 'Укажите улицу и дом'),
  start: s
    .string()
    .required('Выберите дату первой доставки')
    .refine(
      (v: string) => v >= firstAvailableDate(new Date()) && v <= lastAvailableDate(new Date()),
      'Первая доставка — в ближайшие 30 дней',
    ),
  consent: s.boolean().isTrue('Нужно согласие на обработку данных'),
})
