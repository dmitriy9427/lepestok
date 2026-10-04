/**
 * «Сервер» магазина. Бэкенда у пет-проекта нет, поэтому запросы имитируются:
 * задержка сети, отмена (AbortSignal) и ошибки — интерфейс ведёт себя как с
 * настоящим API (загрузка, пустое состояние, «повторить»).
 *
 * Подключить настоящий бэкенд: замените тела функций на fetch(…) — сигнатуры
 * и типы оставьте, компоненты менять не придётся.
 *
 * Проверить ошибки: добавьте к адресу ?fail — каталог не загрузится;
 * имя получателя «ошибка» при оформлении — сервер ответит ошибкой поля.
 */
import { BOUQUETS, type Bouquet } from '../data/bouquets'
import type { CartItem } from './cart'

export class ApiError extends Error {
  /** Ошибки по полям формы: { name: 'текст' } — form кита покажет их под полями. */
  errors?: Record<string, string>
  constructor(message: string, errors?: Record<string, string>) {
    super(message)
    this.errors = errors
  }
}

const failRequested = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('fail')

/** Пауза, которую можно прервать (ушли со страницы — запрос отменился). */
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Запрос отменён', 'AbortError'))
    })
  })
}

/** Задержка «сети». В тестах — 0 (import.meta.env.MODE === 'test'). */
const latency = (ms: number) => (import.meta.env.MODE === 'test' ? 0 : ms)

export async function fetchBouquets(signal?: AbortSignal): Promise<Bouquet[]> {
  await wait(latency(600), signal)
  if (failRequested()) throw new ApiError('Не удалось загрузить каталог. Проверьте интернет и попробуйте ещё раз.')
  return BOUQUETS
}

export interface OrderRequest {
  items: CartItem[]
  values: Record<string, unknown>
  total: number
}

export async function createOrder(order: OrderRequest) {
  await wait(latency(1100))
  const name = String(order.values.recipientName ?? '')
  if (name.trim().toLowerCase() === 'ошибка') {
    throw new ApiError('Проверьте данные получателя', { recipientName: 'Сервер не принял имя (тестовая ошибка)' })
  }
  const number = `LP-${String(Date.now()).slice(-6)}`
  return { number }
}

export async function createSubscription(values: Record<string, unknown>) {
  await wait(latency(900))
  return { message: `Готово! Первую доставку согласуем по телефону ${String(values.phone ?? '')}.` }
}
