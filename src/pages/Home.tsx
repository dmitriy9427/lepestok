/**
 * Главная: первый экран с 3D-букетом и лепестками, бесконечная
 * галерея, поводы, промо конструктора, как мы работаем, отзывы, доставка.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useModule, useReducedMotion } from 'kit/react/index.js'
import accordion from 'kit/js/modules/accordion/index.js'
import swiper from 'kit/js/modules/swiper/index.js'
import splitText from 'kit/js/modules/split-text/index.js'
import reveal from 'kit/js/modules/reveal/index.js'
import { BOUQUETS, OCCASIONS, type Occasion } from '../data/bouquets'
import { FAQ, REVIEWS, STEPS } from '../data/content'
import type { Composition } from '../lib/bouquet'
import { ASSEMBLY_HOURS } from '../lib/delivery'
import petals from '../modules/petals'
import bouquet3d from '../modules/bouquet3d/index'
import { BouquetArt } from '../components/BouquetArt'
import { Gallery } from '../components/Gallery'

/** Сцены промо конструктора: букет «собирается» на глазах. */
const DEMO: Composition[] = [
  { stems: [{ flower: 'peony', color: 'peony', count: 3 }], wrap: 'kraft', ribbon: 'satin-blush' },
  {
    stems: [
      { flower: 'peony', color: 'peony', count: 3 },
      { flower: 'rose', color: 'cream', count: 4 },
    ],
    wrap: 'kraft',
    ribbon: 'satin-blush',
  },
  {
    stems: [
      { flower: 'peony', color: 'peony', count: 3 },
      { flower: 'rose', color: 'cream', count: 4 },
      { flower: 'eucalyptus', color: 'sage', count: 4 },
    ],
    wrap: 'kraft',
    ribbon: 'satin-blush',
  },
  {
    stems: [
      { flower: 'peony', color: 'peony', count: 3 },
      { flower: 'rose', color: 'cream', count: 4 },
      { flower: 'eucalyptus', color: 'sage', count: 4 },
      { flower: 'gypsophila', color: 'white', count: 3 },
    ],
    wrap: 'film',
    ribbon: 'silk-cream',
  },
  {
    stems: [
      { flower: 'peony', color: 'peony', count: 5 },
      { flower: 'rose', color: 'cream', count: 4 },
      { flower: 'ranunculus', color: 'peach', count: 4 },
      { flower: 'eucalyptus', color: 'sage', count: 4 },
      { flower: 'gypsophila', color: 'white', count: 3 },
    ],
    wrap: 'film',
    ribbon: 'silk-cream',
  },
]

const ACCORDION = { multiple: false }
const SPLIT = { type: 'lines' }
const PETALS = { count: 26 }

function DemoBouquet() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(DEMO.length - 1)
  useEffect(() => {
    if (reduced) return undefined
    const timer = window.setInterval(() => setStep((s) => (s + 1) % DEMO.length), 1800)
    return () => window.clearInterval(timer)
  }, [reduced])
  return <BouquetArt composition={DEMO[step]} label="Букет собирается в конструкторе" />
}

export function Home() {
  const main = useModule<HTMLElement>(reveal)
  const petalsRef = useModule<HTMLCanvasElement>(petals, PETALS)
  const model = useModule<HTMLDivElement>(bouquet3d)
  const title = useModule<HTMLHeadingElement>(splitText, SPLIT)
  const faq = useModule<HTMLDivElement>(accordion, ACCORDION)
  const reviews = useModule<HTMLDivElement>(swiper)

  return (
    <main id="main" ref={main}>
      <section className="hero">
        <canvas className="petals" ref={petalsRef} aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__text">
            <p className="eyebrow">Цветочная мастерская</p>
            <h1 className="hero__title" ref={title}>
              Букеты, которые собирают для&nbsp;вас — и&nbsp;вместе с&nbsp;вами
            </h1>
            <p className="lead hero__lead" data-reveal>
              Выберите готовый букет или соберите свой в конструкторе: цена и вид меняются вживую. Фото букета пришлём
              до отправки.
            </p>
            <div className="cluster" data-reveal>
              <Link className="btn btn--lg" to="/catalog">
                Выбрать букет
              </Link>
              <Link className="btn btn--lg btn--ghost" to="/builder">
                Собрать свой
              </Link>
            </div>
            <ul className="hero__perks" data-reveal>
              <li>Фото перед отправкой</li>
              <li>Свежесть 7 дней</li>
              <li>Доставка за {ASSEMBLY_HOURS} часа</li>
            </ul>
          </div>
          <div className="hero__art">
            {/* 3D-модель (blender/bouquet.py). Постер — пока грузится и без WebGL. */}
            <div
              className="bouquet3d"
              ref={model}
              role="img"
              aria-label="3D-модель букета из розовых пионов — можно повернуть"
            >
              <img className="bouquet3d__poster" src="/models/bouquet-poster.webp" alt="" width="600" height="733" />
              <p className="bouquet3d__hint" aria-hidden="true">
                ⟲ потяните, чтобы повернуть
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section gallery-section">
        <div className="container section-head">
          <p className="eyebrow">Букеты недели</p>
          <h2 className="section-title" data-reveal>
            Потяните ленту
          </h2>
        </div>
        <Gallery bouquets={BOUQUETS} />
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Поводы</p>
            <h2 className="section-title" data-reveal>
              Для кого букет?
            </h2>
          </div>
          <ul className="occasions">
            {(Object.keys(OCCASIONS) as Occasion[]).map((id) => (
              <li key={id} data-reveal>
                <Link className="occasion" to={`/catalog?occasion=${id}`}>
                  <span className="occasion__emoji" aria-hidden="true">
                    {OCCASIONS[id].emoji}
                  </span>
                  <span className="occasion__title">{OCCASIONS[id].title}</span>
                  <span className="occasion__text">{OCCASIONS[id].text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section builder-promo">
        <div className="container builder-promo__grid">
          <div className="builder-promo__art">
            <DemoBouquet />
          </div>
          <div>
            <p className="eyebrow eyebrow--light">Конструктор</p>
            <h2 className="section-title" data-reveal>
              Соберите букет сами — как в мастерской
            </h2>
            <p className="lead" data-reveal>
              Выбирайте цветы, оттенки, упаковку и ленту. Букет растёт на экране, цена считается сразу. Укажите бюджет —
              подскажем, что убрать.
            </p>
            <Link className="btn btn--lg btn--light" to="/builder" data-reveal>
              Открыть конструктор
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Как мы работаем</p>
            <h2 className="section-title" data-reveal>
              От заказа до вазы
            </h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li className="steps__item" key={step.title} data-reveal>
                <span className="steps__index">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="steps__title">{step.title}</h3>
                <p className="muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section reviews">
        <div className="container">
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow">Отзывы</p>
              <h2 className="section-title" data-reveal>
                Нам пишут
              </h2>
            </div>
            <div className="swiper-nav">
              <button className="swiper-button-prev" type="button" aria-label="Назад" />
              <button className="swiper-button-next" type="button" aria-label="Вперёд" />
            </div>
          </div>
          <div
            className="swiper"
            ref={reviews}
            data-swiper-breakpoints='{"md": {"slidesPerView": 2}, "lg": {"slidesPerView": 3}}'
          >
            <div className="swiper-wrapper">
              {REVIEWS.map((review) => (
                <div className="swiper-slide" key={review.name}>
                  <figure className="review">
                    <p className="review__stars" aria-label={`Оценка ${review.rating} из 5`}>
                      {'★'.repeat(review.rating)}
                      <span aria-hidden="true">{'★'.repeat(5 - review.rating)}</span>
                    </p>
                    <blockquote>{review.text}</blockquote>
                    <figcaption>{review.name}</figcaption>
                  </figure>
                </div>
              ))}
            </div>
            <div className="swiper-pagination" />
          </div>
        </div>
      </section>

      <section className="section delivery" id="delivery">
        <div className="container delivery__grid">
          <div>
            <p className="eyebrow">Доставка</p>
            <h2 className="section-title" data-reveal>
              Привезём сегодня
            </h2>
            <p className="lead">Подписка на цветы — со скидкой до 30 % и без забот о поводе.</p>
            <Link className="btn btn--ghost" to="/subscription">
              Подробнее о подписке
            </Link>
          </div>
          <div className="accordion" ref={faq}>
            {FAQ.map((item, i) => (
              <div
                className="accordion__item"
                data-accordion-item
                key={item.q}
                {...(i === 0 ? { 'data-open': '' } : {})}
              >
                <h3>
                  <button className="accordion__trigger" type="button" data-accordion-trigger>
                    {item.q}
                  </button>
                </h3>
                <div className="accordion__panel" data-accordion-panel>
                  <div className="accordion__inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
