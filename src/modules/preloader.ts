/**
 * Прелоадер первой загрузки. Разметка и стили — в index.html (виден с первого
 * кадра, ещё до JS); здесь — прогресс и уход.
 *
 *   finishPreloader()   — вызвать один раз после монтирования приложения
 *
 * Прогресс честный: шрифты, постер первого экрана (на главной), запуск
 * приложения. Не меньше MIN_MS — чтобы цветок успел распуститься (иначе
 * мелькнёт), и не больше MAX_MS — ждать дольше хуже любой анимации.
 * Видео (4+ МБ) не ждём: у него есть постер.
 *
 * Уход: под прелоадер мгновенно кладётся заливка шейдерного перехода
 * (те же цвета), прелоадер гаснет, и заливка растворяется цветком из
 * центра — как при смене страниц. Один раз за сессию вкладки.
 */
import { gsap } from 'kit/js/core/gsap.js'
import { prefersReducedMotion } from 'kit/js/core/env.js'
import { coverNow, reveal } from './pageTransition'

const MIN_MS = 1300
const MAX_MS = 4000

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function imageLoaded(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

export async function finishPreloader() {
  const el = document.getElementById('preloader')
  if (!el) return
  // Приложение запустилось — страховка из index.html больше не нужна.
  el.dataset.owned = 'true'
  if (document.documentElement.classList.contains('no-preloader')) {
    el.remove()
    return
  }

  const count = el.querySelector('.preloader__count')
  const ring = el.querySelector<SVGCircleElement>('.preloader__ring')
  const length = 2 * Math.PI * 20
  const shown = { value: 0 }
  const render = () => {
    if (count) count.textContent = `${Math.round(shown.value)} %`
    ring?.style.setProperty('stroke-dashoffset', String(length * (1 - shown.value / 100)))
  }

  // Задачи загрузки; прогресс — доля выполненных, плавно догоняет.
  const tasks = [
    document.fonts?.ready ?? Promise.resolve(),
    location.pathname === '/' ? imageLoaded('/video/hero-poster.jpg') : Promise.resolve(),
    delay(MIN_MS),
  ]
  let done = 0
  const target = { value: 12 } // приложение уже смонтировано
  const chase = () => gsap.to(shown, { value: target.value, duration: 0.5, ease: 'power2.out', onUpdate: render })
  chase()
  tasks.forEach((t) =>
    t.then(() => {
      done += 1
      target.value = 12 + (88 * done) / tasks.length
      chase()
    }),
  )
  await Promise.race([Promise.all(tasks), delay(MAX_MS)])
  target.value = 100
  await chase().then()

  try {
    sessionStorage.setItem('preloaded', '1')
  } catch {
    /* приватный режим — покажем и в следующий раз, не страшно */
  }

  if (prefersReducedMotion()) {
    el.classList.add('is-done')
    await delay(350)
    el.remove()
    return
  }
  coverNow()
  el.classList.add('is-done')
  await delay(350)
  el.remove()
  await reveal()
}
