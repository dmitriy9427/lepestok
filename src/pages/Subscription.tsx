/**
 * Цветочная подписка: калькулятор (размер × частота × срок) и форма.
 * Расчёт — lib/subscription.ts (тесты). Форма — модуль form со своей отправкой.
 */
import { useState } from 'react'
import { useModule } from 'kit/react/index.js'
import form from 'kit/js/modules/form/index.js'
import { plural } from 'kit/js/form/schema.js'
import { formatPrice } from '../lib/bouquet'
import { firstAvailableDate, lastAvailableDate } from '../lib/delivery'
import { FREQUENCIES, PLAN_SIZES, TERMS, subscriptionPrice, type Frequency, type PlanSize } from '../lib/subscription'
import { createSubscription } from '../lib/api'
import { subscriptionSchema } from '../forms/schemas'
import { bouquetById } from '../data/bouquets'
import { Bloom } from '../components/Bloom'

const FORM = {
  schema: subscriptionSchema,
  resetOnSuccess: true,
  onSubmit: (values: Record<string, unknown>) => createSubscription(values),
}

/** Пример букета для каждого размера подписки — фото из каталога. */
const PHOTO: Record<PlanSize, string> = {
  S: bouquetById('malenkoe-schaste')!.photo,
  M: bouquetById('lavandovyy-son')!.photo,
  L: bouquetById('persikovyy-zakat')!.photo,
}

export function Subscription() {
  const [size, setSize] = useState<PlanSize>('M')
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [months, setMonths] = useState(3)
  const price = subscriptionPrice(size, frequency, months)
  const formRef = useModule<HTMLFormElement>(form, FORM)

  return (
    <main id="main" className="section subscription">
      <div className="container">
        <p className="eyebrow">Подписка</p>
        <h1 className="section-title">Цветы дома — всегда</h1>
        <p className="lead subscription__lead">
          Свежий букет по расписанию: каждый раз новый, по сезону. Скидка до 30 %, пауза и отмена — в любой момент.
        </p>

        <div className="subscription__grid">
          {/* Фото в «живом» контуре-лепестке; бейдж и плашка — поверх, вне обрезки. */}
          <div className="subscription__art">
            <div className="subscription__photo">
              <img key={size} src={PHOTO[size]} alt="Пример букета по подписке" width="1200" height="1500" />
            </div>
            <div className="subscription__badge" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <path id="sub-badge-circle" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" fill="none" />
                <text>
                  <textPath href="#sub-badge-circle" startOffset="0">
                    свежие цветы · каждый раз новый букет ·
                  </textPath>
                </text>
              </svg>
              <Bloom petal="#f2a7b8" shade="#c24c6f" center="#a8375a" className="subscription__badge-bloom" />
            </div>
            <p className="subscription__sticker" aria-live="polite">
              <span className="subscription__sticker-label">
                {FREQUENCIES[frequency].title} · −{Math.round(price.discount * 100)} %
              </span>
              <strong>{formatPrice(price.perDelivery)}</strong>
              <span className="subscription__sticker-label">за букет «{PLAN_SIZES[size].title.toLowerCase()}»</span>
            </p>
          </div>

          <div className="subscription__calc">
            <fieldset>
              <legend className="field__label">Размер букета</legend>
              <div className="plan-options">
                {(Object.keys(PLAN_SIZES) as PlanSize[]).map((id) => (
                  <label className="plan-option" key={id}>
                    <input type="radio" name="planSize" checked={size === id} onChange={() => setSize(id)} />
                    <span className="plan-option__title">{PLAN_SIZES[id].title}</span>
                    <span className="plan-option__text">{PLAN_SIZES[id].text}</span>
                    <span className="plan-option__price">{formatPrice(PLAN_SIZES[id].price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="field__label">Как часто</legend>
              <div className="pills">
                {(Object.keys(FREQUENCIES) as Frequency[]).map((id) => (
                  <label className="pill" key={id}>
                    <input type="radio" name="frequency" checked={frequency === id} onChange={() => setFrequency(id)} />
                    <span>
                      {FREQUENCIES[id].title} <small>−{FREQUENCIES[id].discount * 100} %</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="field__label">Срок</legend>
              <div className="pills">
                {Object.keys(TERMS)
                  .map(Number)
                  .map((m) => (
                    <label className="pill" key={m}>
                      <input type="radio" name="months" checked={months === m} onChange={() => setMonths(m)} />
                      <span>
                        {m} {plural(m, ['месяц', 'месяца', 'месяцев'])}{' '}
                        {TERMS[m] > 0 && <small>ещё −{TERMS[m] * 100} %</small>}
                      </span>
                    </label>
                  ))}
              </div>
            </fieldset>

            <div className="subscription__total" aria-live="polite">
              <p>
                {price.deliveries} {plural(price.deliveries, ['доставка', 'доставки', 'доставок'])} по{' '}
                {formatPrice(price.perDelivery)}
              </p>
              <p className="subscription__price">
                {formatPrice(price.total)} <s className="muted">{formatPrice(price.full)}</s>
              </p>
              <p className="subscription__saving">Экономия {formatPrice(price.saving)}</p>
            </div>
          </div>
        </div>

        <form ref={formRef} className="subscription__form" noValidate>
          <h2 className="h3">Оформить подписку</h2>
          <input type="hidden" name="plan" value={`${size}/${frequency}/${months}`} />
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Имя</span>
              <input className="field__input" name="name" autoComplete="name" />
            </label>
            <label className="field">
              <span className="field__label">Телефон</span>
              <input className="field__input" name="phone" type="tel" data-mask="phone" autoComplete="tel" />
            </label>
            <label className="field">
              <span className="field__label">Адрес доставки</span>
              <input className="field__input" name="address" autoComplete="street-address" />
            </label>
            <label className="field">
              <span className="field__label">Первая доставка</span>
              <input
                className="field__input"
                name="start"
                type="date"
                min={firstAvailableDate(new Date())}
                max={lastAvailableDate(new Date())}
              />
            </label>
          </div>
          <label className="checkbox field">
            <input type="checkbox" name="consent" />
            <span>Соглашаюсь с обработкой персональных данных</span>
          </label>
          <button className="btn btn--lg" type="submit">
            Подписаться · {formatPrice(price.total)}
          </button>
          <p data-form-status role="status" />
        </form>
      </div>
    </main>
  )
}
