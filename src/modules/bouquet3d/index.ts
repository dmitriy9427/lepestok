/**
 * 3D-букет на первом экране. Модуль по контракту кита (init(el, ctx) → { destroy }).
 *
 *   <div class="bouquet3d" ref={useModule(bouquet3d)}>
 *     <img class="bouquet3d__poster" src="/models/bouquet-poster.webp" alt="…">
 *   </div>
 *
 * - three.js и модель (~700 КБ) грузятся лениво, после показа страницы;
 *   пока грузятся — виден постер (рендер той же модели из Blender).
 * - Сам медленно вращается; мышью/пальцем можно повернуть (с инерцией).
 *   Горизонтальный жест — вращение, вертикальный — отдаётся прокрутке страницы.
 * - Кадры — только пока блок на экране. Нет WebGL — остаётся постер.
 * - «Меньше движения» — без автовращения (повернуть рукой можно).
 */
import { gsap } from 'kit/js/core/gsap.js'
import { createDisposer, onViewport } from 'kit/js/core/lifecycle.js'
import { supportsWebGL } from 'kit/js/core/webgl.js'

const MODEL_URL = `${import.meta.env.BASE_URL}models/bouquet.glb`

export default async function bouquet3d(el: HTMLElement, ctx: { reduced?: boolean } = {}) {
  if (!supportsWebGL()) return undefined
  const d = createDisposer()
  const { createBouquetScene } = await import('./scene')
  if (d.disposed) return undefined
  let scene: Awaited<ReturnType<typeof createBouquetScene>>
  try {
    scene = await createBouquetScene(el, MODEL_URL, Math.min(window.devicePixelRatio || 1, 2))
  } catch (error) {
    console.warn('[bouquet3d] модель не загрузилась — остаётся постер', error)
    return undefined
  }
  if (d.disposed) {
    scene.dispose()
    return undefined
  }
  d.add(() => scene.dispose())

  const resize = () => scene.resize(el.clientWidth, el.clientHeight)
  const ro = new ResizeObserver(resize)
  ro.observe(el)
  d.add(() => ro.disconnect())
  resize()
  // Плавная смена постера на 3D (CSS: .bouquet3d.is-ready).
  requestAnimationFrame(() => el.classList.add('is-ready'))
  d.add(() => el.classList.remove('is-ready'))

  // Вращение: угол + скорость. Тянут — скорость от руки, отпустили — затухает
  // к автоскорости. Наклон — от вертикального положения мыши.
  const auto = ctx.reduced ? 0 : 0.35 // рад/с
  const state = { angle: -0.4, speed: auto, tilt: 0, tiltTarget: 0, dragging: false, lastX: 0, time: 0 }

  d.listen(el, 'pointerdown', (e: PointerEvent) => {
    state.dragging = true
    state.lastX = e.clientX
    el.setPointerCapture(e.pointerId)
  })
  d.listen(el, 'pointermove', (e: PointerEvent) => {
    const rect = el.getBoundingClientRect()
    state.tiltTarget = ((e.clientY - rect.top) / rect.height - 0.5) * 0.25
    if (!state.dragging) return
    const dx = e.clientX - state.lastX
    state.lastX = e.clientX
    state.angle += dx * 0.01
    state.speed = dx * 0.6
  })
  const release = () => (state.dragging = false)
  d.listen(el, 'pointerup', release)
  d.listen(el, 'pointercancel', release)
  d.listen(el, 'pointerleave', () => (state.tiltTarget = 0))

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.05)
    state.time += dt
    if (!state.dragging) {
      state.speed += (auto - state.speed) * (1 - Math.exp(-dt * 2))
      state.angle += state.speed * dt
    }
    state.tilt += (state.tiltTarget - state.tilt) * (1 - Math.exp(-dt * 4))
    const float = ctx.reduced ? 0 : Math.sin(state.time * 1.2) * 0.04
    scene.render(state.angle, state.tilt, float)
  }

  let running = false
  d.add(
    onViewport(el, {
      enter: () => {
        if (!running) gsap.ticker.add(tick)
        running = true
      },
      leave: () => {
        gsap.ticker.remove(tick)
        running = false
      },
    }),
  )
  d.add(() => gsap.ticker.remove(tick))
  return { destroy: d.dispose }
}
