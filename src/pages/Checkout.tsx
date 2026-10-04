/**
 * Оформление заказа в три шага: контакты → доставка → оплата.
 *
 * Одна форма (модуль form кита со схемой orderSchema), шаги — fieldset'ы,
 * неактивные скрыты. «Далее» проверяет только поля текущего шага
 * (api.validateField). При отправке проверяется всё: если ошибка на скрытом
 * шаге (например, сервер не принял имя получателя) — открываем этот шаг.
 *
 * Поля неконтролируемые (значения — в DOM, собирает модуль). В React-состоянии
 * только то, от чего зависит разметка: шаг, способ доставки, дата (интервалы).
 *
 * Проверить ошибку сервера: имя получателя «ошибка» (lib/api.ts).
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useModule } from 'kit/react/index.js'
import form from 'kit/js/modules/form/index.js'
import { plural } from 'kit/js/form/schema.js'
import { formatPrice } from '../lib/bouquet'
import { cart, cartCount, cartTotal } from '../lib/cart'
import { createOrder, ApiError } from '../lib/api'
import { deliveryPrice, firstAvailableDate, lastAvailableDate, slotsFor, type Method } from '../lib/delivery'
import { PAYMENTS, orderSchema } from '../forms/schemas'
import { ItemImage } from '../components/BouquetArt'

const STEPS = ['Контакты', 'Доставка', 'Оплата']

interface FormApi {
  validateField: (key: string) => string
  getValues: () => Record<string, unknown>
}

export function Checkout() {
  const items = cart.use()
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<Method>('courier')
  const [date, setDate] = useState(() => firstAvailableDate(new Date()))
  const [order, setOrder] = useState<{ number: string; total: number } | null>(null)
  const api = useRef<FormApi | null>(null)

  const itemsTotal = cartTotal(items)
  const delivery = deliveryPrice(method, itemsTotal)
  const total = itemsTotal + delivery

  // Отправка — своя (onSubmit): «сервер» из lib/api. Ссылки на свежие данные —
  // через ref, чтобы опции модуля не менялись на каждом рендере.
  const latest = useRef({ items, total })
  useEffect(() => {
    latest.current = { items, total }
  })
  const [options] = useState(() => ({
    schema: orderSchema,
    async onSubmit(values: Record<string, unknown>) {
      try {
        const result = await createOrder({ items: latest.current.items, values, total: latest.current.total })
        setOrder({ number: result.number, total: latest.current.total })
        cart.set([])
        window.scrollTo({ top: 0 })
      } catch (error) {
        if (error instanceof ApiError && error.errors) throw { errors: error.errors }
        throw error
      }
    },
  }))
  const formEl = useModule<HTMLFormElement>(form, options, (instance) => (api.current = instance as FormApi | null))

  // Ошибка на скрытом шаге (при отправке или с сервера) — показываем этот шаг.
  useEffect(() => {
    const el = formEl.current
    if (!el) return undefined
    // Без requestAnimationFrame: модуль form ставит aria-invalid синхронно до
    // события, а rAF во вкладке в фоне не вызывается — шаг бы не переключился.
    const showInvalid = () => {
      const invalid = el.querySelector<HTMLElement>('[aria-invalid="true"]')
      const index = Number(invalid?.closest<HTMLElement>('[data-step]')?.dataset.step ?? -1)
      if (index >= 0) setStep(index)
    }
    el.addEventListener('form:invalid', showInvalid)
    el.addEventListener('form:error', showInvalid)
    return () => {
      el.removeEventListener('form:invalid', showInvalid)
      el.removeEventListener('form:error', showInvalid)
    }
  }, [order, formEl])

  const next = () => {
    const el = formEl.current
    if (!el || !api.current) return
    const fieldset = el.querySelector(`[data-step="${step}"]`)
    const names = new Set([...(fieldset?.querySelectorAll<HTMLInputElement>('[name]') ?? [])].map((f) => f.name))
    const errors = [...names].map((name) => api.current!.validateField(name)).filter(Boolean)
    if (errors.length) {
      fieldset?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setStep((s) => s + 1)
  }

  // Enter в поле промежуточного шага — «Далее», а не отправка всей формы.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && step < STEPS.length - 1 && (event.target as HTMLElement).tagName === 'INPUT') {
      event.preventDefault()
      next()
    }
  }

  // Перешли на шаг — фокус на его первое поле (кроме первого показа страницы:
  // на телефоне это сразу открыло бы клавиатуру).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Сначала — поле с ошибкой (вернулись на шаг из-за неё), иначе первое поле.
    const fieldset = formEl.current?.querySelector(`[data-step="${step}"]`)
    const target =
      fieldset?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      fieldset?.querySelector<HTMLElement>('input:not([type=hidden])')
    target?.focus({ preventScroll: true })
  }, [step, formEl])

  if (order) {
    return (
      <main id="main" className="section">
        <div className="container state state--page state--success">
          <svg className="state__icon" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" />
            <path d="M14 25l7 7 13-15" />
          </svg>
          <p className="state__title">Заказ {order.number} принят!</p>
          <p className="muted">
            Сумма {formatPrice(order.total)}. Флорист пришлёт фото букета перед отправкой. (Это пет-проект — заказ
            никуда не ушёл.)
          </p>
          <Link className="btn" to="/">
            На главную
          </Link>
        </div>
      </main>
    )
  }

  if (!items.length) {
    return (
      <main id="main" className="section">
        <div className="container state state--page">
          <p className="state__title">Нечего оформлять</p>
          <p className="muted">Корзина пуста.</p>
          <Link className="btn" to="/catalog">
            В каталог
          </Link>
        </div>
      </main>
    )
  }

  const slots = slotsFor(date, new Date())
  const count = cartCount(items)

  return (
    <main id="main" className="section">
      <div className="container">
        <h1 className="section-title">Оформление заказа</h1>
        <ol className="progress-steps" aria-label="Шаги оформления">
          {STEPS.map((title, i) => (
            <li
              key={title}
              className={i === step ? 'is-current' : i < step ? 'is-done' : ''}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? (
                <button type="button" onClick={() => setStep(i)}>
                  {title}
                </button>
              ) : (
                <span>{title}</span>
              )}
            </li>
          ))}
        </ol>

        <div className="checkout__grid">
          <form ref={formEl} className="checkout-form" noValidate onKeyDown={onKeyDown}>
            <fieldset data-step="0" hidden={step !== 0}>
              <legend className="checkout-form__legend">Ваши контакты и получатель</legend>
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Ваше имя</span>
                  <input className="field__input" name="name" autoComplete="name" />
                </label>
                <label className="field">
                  <span className="field__label">Ваш телефон</span>
                  <input className="field__input" name="phone" type="tel" data-mask="phone" autoComplete="tel" />
                </label>
                <label className="field">
                  <span className="field__label">Имя получателя</span>
                  <input className="field__input" name="recipientName" autoComplete="off" />
                </label>
                <label className="field">
                  <span className="field__label">Телефон получателя</span>
                  <input
                    className="field__input"
                    name="recipientPhone"
                    type="tel"
                    data-mask="phone"
                    autoComplete="off"
                  />
                  <span className="field__hint">Курьер позвонит, если не застанет. Можно не указывать.</span>
                </label>
              </div>
              <label className="checkbox">
                <input type="checkbox" name="anonymous" />
                <span>Анонимно — курьер не назовёт отправителя</span>
              </label>
            </fieldset>

            <fieldset data-step="1" hidden={step !== 1}>
              <legend className="checkout-form__legend">Доставка</legend>
              <div className="pills" role="radiogroup" aria-label="Способ получения">
                {(
                  [
                    ['courier', 'Курьером'],
                    ['pickup', 'Самовывоз'],
                  ] as const
                ).map(([value, label]) => (
                  <label className="pill" key={value}>
                    <input
                      type="radio"
                      name="method"
                      value={value}
                      checked={method === value}
                      onChange={() => setMethod(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {method === 'courier' ? (
                <div className="form-grid">
                  <label className="field form-grid__wide">
                    <span className="field__label">Улица и дом</span>
                    <input className="field__input" name="address" autoComplete="off" placeholder="Цветочная, 7" />
                  </label>
                  <label className="field">
                    <span className="field__label">Квартира / офис</span>
                    <input className="field__input" name="apartment" autoComplete="off" />
                  </label>
                </div>
              ) : (
                <p className="muted">
                  Мастерская: Цветочная улица, 7 (вымышленный адрес). Букет будет готов к началу интервала.
                </p>
              )}
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Дата</span>
                  <input
                    className="field__input"
                    name="date"
                    type="date"
                    min={firstAvailableDate(new Date())}
                    max={lastAvailableDate(new Date())}
                    defaultValue={date}
                    onChange={(e) => setDate(e.currentTarget.value)}
                  />
                </label>
              </div>
              <fieldset className="field slots">
                <legend className="field__label">
                  {method === 'courier' ? 'Интервал доставки' : 'Когда заберёте'}
                </legend>
                <div className="pills">
                  {slots.map((slot) => (
                    <label
                      className="pill"
                      key={slot.id}
                      title={slot.disabled ? 'Не успеем собрать к этому времени' : undefined}
                    >
                      <input type="radio" name="slot" value={slot.id} disabled={slot.disabled} />
                      <span>{slot.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="field">
                <span className="field__label">Комментарий курьеру</span>
                <textarea
                  className="field__input"
                  name="comment"
                  rows={2}
                  maxLength={300}
                  placeholder="Домофон не работает, позвоните"
                />
              </label>
            </fieldset>

            <fieldset data-step="2" hidden={step !== 2}>
              <legend className="checkout-form__legend">Оплата</legend>
              <fieldset className="field">
                <legend className="field__label">Способ оплаты</legend>
                <div className="pills">
                  {(Object.keys(PAYMENTS) as (keyof typeof PAYMENTS)[]).map((id) => (
                    <label className="pill" key={id}>
                      <input type="radio" name="payment" value={id} defaultChecked={id === 'card'} />
                      <span>{PAYMENTS[id]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="small muted">Демо: оплата не проводится, данные карты не запрашиваются.</p>
              <label className="checkbox field">
                <input type="checkbox" name="consent" />
                <span>Соглашаюсь с обработкой персональных данных</span>
              </label>
            </fieldset>

            <p data-form-status role="status" />
            <div className="checkout-form__nav">
              {step > 0 && (
                <button className="btn btn--ghost" type="button" onClick={() => setStep((s) => s - 1)}>
                  Назад
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button className="btn btn--lg" type="button" onClick={next}>
                  Далее
                </button>
              ) : (
                <button className="btn btn--lg" type="submit">
                  Заказать · {formatPrice(total)}
                </button>
              )}
            </div>
          </form>

          <aside className="order-summary">
            <p className="order-summary__title">
              {count} {plural(count, ['букет', 'букета', 'букетов'])}
            </p>
            <ul className="order-summary__items">
              {items.map((item) => (
                <li key={item.id}>
                  <ItemImage composition={item.composition} bouquetId={item.bouquetId} />
                  <span>
                    {item.title} × {item.qty}
                  </span>
                </li>
              ))}
            </ul>
            <p className="order-summary__row">
              <span>Букеты</span>
              <span>{formatPrice(itemsTotal)}</span>
            </p>
            <p className="order-summary__row">
              <span>Доставка</span>
              <span>{delivery ? formatPrice(delivery) : 'бесплатно'}</span>
            </p>
            <p className="order-summary__row order-summary__total">
              <span>Итого</span>
              <strong>{formatPrice(total)}</strong>
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
