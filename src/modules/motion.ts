/**
 * Анимации всего сайта одним модулем: появление при прокрутке и эффекты
 * при наведении. Ставится один раз на <body> (App).
 *
 * ─── Появление ─────────────────────────────────────────────────────────────
 * Элементы находятся по классам (GROUPS), атрибуты в разметке не нужны.
 * Каждый получает data-anim="<вид>"; виды описаны в CSS (_motion.scss).
 * Почему не reveal из кита: тот размечает элементы один раз при запуске,
 * а у нас списки меняются (фильтры каталога, корзина) — новые карточки
 * остались бы невидимыми. Здесь MutationObserver подхватывает новые узлы.
 * Элементы, попавшие на экран вместе, идут «волной» (задержка по порядку).
 *
 * ─── Наведение ─────────────────────────────────────────────────────────────
 * Один делегированный pointermove на документ:
 *   [блик]   SPOT  — --mx/--my: светлое пятно следует за курсором;
 *   [наклон] TILT  — --tx/--ty (−1…1): карточка букета наклоняется в 3D.
 * Только мышь (на тач-экране нет наведения).
 *
 * Анимирует CSS (transition по классу is-in) — модуль только ставит классы
 * и переменные. «Меньше движения» — модуль не включается, всё видно сразу.
 */
import { createDisposer } from 'kit/js/core/lifecycle.js'

/** [селектор, вид появления] */
const GROUPS: [string, string][] = [
  ['.section-title, .product__title, .builder__heading, .state__title', 'title'],
  ['.eyebrow', 'eyebrow'],
  ['.lead, .breadcrumbs', 'text'],
  [
    '.bouquet-card-wrap, .occasion, .steps__item, .plan-option, .flower-row, .cart-item, .review, .wrap-option, .accordion__item, .order-summary, .filters',
    'card',
  ],
  ['.product__photo, .subscription__art, .builder-promo__art, .not-found__art, .builder__stage', 'media'],
]

/** Где ничего не трогаем: свой сценарий (hero, меню) или анимирует kit reveal. */
const SKIP = '.hero, .header, .mobile-menu, [data-reveal], .page-transition'

const SPOT = '.occasion, .plan-option, .review, .steps__item, .cart-item, .wrap-option, .flower-row, .order-summary'
const TILT = '.bouquet-card-wrap'

export default function motion(root: HTMLElement, ctx: { reduced?: boolean } = {}) {
  if (ctx.reduced || typeof IntersectionObserver === 'undefined') return undefined
  const d = createDisposer()
  document.documentElement.classList.add('motion')
  d.add(() => document.documentElement.classList.remove('motion'))

  const io = new IntersectionObserver(
    (entries) => {
      // Вошедшие вместе — волной: сверху вниз, слева направо.
      const entering = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target as HTMLElement)
        .sort((a, b) => {
          const ra = a.getBoundingClientRect()
          const rb = b.getBoundingClientRect()
          return ra.top - rb.top || ra.left - rb.left
        })
      entering.forEach((el, i) => {
        el.style.setProperty('--anim-delay', `${Math.min(i, 8) * 0.07}s`)
        el.classList.add('is-in')
        io.unobserve(el)
      })
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  d.add(() => io.disconnect())

  // Учёт — свой у каждого запуска, а не по data-anim: при перезапуске модуля
  // (StrictMode, HMR) размеченные прошлым запуском элементы иначе остались бы
  // без наблюдателя — и невидимыми навсегда.
  const observed = new WeakSet<Element>()
  const scan = () => {
    for (const [selector, kind] of GROUPS) {
      for (const el of root.querySelectorAll<HTMLElement>(selector)) {
        if (observed.has(el) || el.classList.contains('is-in') || el.closest(SKIP)) continue
        observed.add(el)
        el.dataset.anim = kind
        io.observe(el)
      }
    }
  }
  scan()

  // Новые узлы (смена страницы, фильтры, корзина) — размечаем в том же кадре,
  // до отрисовки: MutationObserver срабатывает раньше paint.
  const mo = new MutationObserver(scan)
  mo.observe(root, { childList: true, subtree: true })
  d.add(() => mo.disconnect())

  let tilted: HTMLElement | null = null
  const resetTilt = () => {
    tilted?.style.removeProperty('--tx')
    tilted?.style.removeProperty('--ty')
    tilted = null
  }
  d.listen(
    document,
    'pointermove',
    (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const target = event.target as Element | null
      const spot = target?.closest<HTMLElement>(SPOT)
      if (spot) {
        const r = spot.getBoundingClientRect()
        spot.style.setProperty('--mx', `${event.clientX - r.left}px`)
        spot.style.setProperty('--my', `${event.clientY - r.top}px`)
      }
      const card = target?.closest<HTMLElement>(TILT) ?? null
      if (card !== tilted) resetTilt()
      if (card) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--tx', (((event.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
        card.style.setProperty('--ty', (((event.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
        tilted = card
      }
    },
    { passive: true },
  )
  d.listen(document, 'pointerleave', resetTilt)

  return { destroy: d.dispose }
}
