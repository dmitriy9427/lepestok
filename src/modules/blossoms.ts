/**
 * Фон всего сайта: цветы медленно плывут вверх и покачиваются, на трёх
 * «глубинах». Дальние — мелкие и бледные, ближние — крупнее и чётче; при
 * прокрутке слои сдвигаются с разной скоростью (параллакс — ощущение объёма).
 * Курсор мягко расталкивает ближайшие цветы.
 *
 *   <canvas class="ambient" ref={useModule(blossoms)} />   ← position: fixed
 *
 * ─── Производительность ────────────────────────────────────────────────────
 * Каждый вид цветка рисуется ОДИН раз в offscreen-canvas (спрайт), а в кадре
 * только drawImage с поворотом — дешевле, чем 20 раз строить кривые.
 * Плотность пикселей ≤ 2; вкладка в фоне — gsap.ticker сам стоит.
 * «Меньше движения» — один статичный кадр.
 */
import { gsap } from 'kit/js/core/gsap.js'
import { createDisposer } from 'kit/js/core/lifecycle.js'
import { createRandom, between } from '../lib/random'

const PALETTES = [
  ['#f4d9d4', '#e2b3ad'],
  ['#f2a7b8', '#d97a92'],
  ['#f6ead2', '#e2cfa9'],
  ['#d9c8ec', '#b49bd4'],
  ['#f7c29f', '#e89a73'],
  ['#e2708f', '#c24c6f'],
]

/** Глубины: масштаб, прозрачность, скорость параллакса. */
const LAYERS = [
  { scale: 0.45, alpha: 0.35, parallax: 0.08 },
  { scale: 0.7, alpha: 0.5, parallax: 0.18 },
  { scale: 1, alpha: 0.7, parallax: 0.32 },
]

const SPRITE = 96

function drawSprite([petal, shade]: string[], petals: number) {
  const c = document.createElement('canvas')
  c.width = c.height = SPRITE
  const g = c.getContext('2d')!
  g.translate(SPRITE / 2, SPRITE / 2)
  const r = SPRITE * 0.46
  for (const [k, scale, offset] of [
    [0, 1, 0],
    [1, 0.62, 0.5],
  ]) {
    for (let i = 0; i < petals; i++) {
      g.save()
      g.rotate(((i + offset) / petals) * Math.PI * 2)
      g.scale(scale, scale)
      const grad = g.createLinearGradient(0, 0, 0, -r)
      grad.addColorStop(0, shade)
      grad.addColorStop(0.6, petal)
      grad.addColorStop(1, k ? '#fff' : petal)
      g.fillStyle = grad
      g.beginPath()
      g.moveTo(0, 0)
      g.bezierCurveTo(r * 0.3, -r * 0.22, r * 0.4, -r * 0.74, 0, -r)
      g.bezierCurveTo(-r * 0.4, -r * 0.74, -r * 0.3, -r * 0.22, 0, 0)
      g.fill()
      g.restore()
    }
  }
  g.fillStyle = '#f3d98b'
  g.beginPath()
  g.arc(0, 0, r * 0.16, 0, Math.PI * 2)
  g.fill()
  return c
}

interface Flower {
  x: number
  y: number
  layer: (typeof LAYERS)[number]
  size: number
  speed: number
  sway: number
  phase: number
  angle: number
  spin: number
  sprite: HTMLCanvasElement
  /** Сдвиг от курсора (затухает). */
  px: number
  py: number
}

export default function blossoms(
  canvas: HTMLCanvasElement,
  ctx: { reduced?: boolean; options?: { count?: number } } = {},
) {
  const g = canvas.getContext('2d')
  if (!g) return undefined
  const d = createDisposer()
  const rnd = createRandom(11)
  const sprites = PALETTES.flatMap((p) => [drawSprite(p, 5), drawSprite(p, 6)])
  let width = 0
  let height = 0
  const mouse = { x: -9999, y: -9999 }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  d.listen(window, 'resize', resize)

  const count = ctx.options?.count ?? (width < 768 ? 9 : 16)
  const flowers: Flower[] = Array.from({ length: count }, (_, i) => {
    const layer = LAYERS[i % LAYERS.length]
    return {
      x: between(rnd, 0, width),
      y: between(rnd, 0, height),
      layer,
      size: between(rnd, 34, 64) * layer.scale,
      speed: between(rnd, 6, 14) * layer.scale,
      sway: between(rnd, 14, 40),
      phase: between(rnd, 0, Math.PI * 2),
      angle: between(rnd, 0, Math.PI * 2),
      spin: between(rnd, -0.25, 0.25),
      sprite: sprites[Math.floor(rnd() * sprites.length)],
      px: 0,
      py: 0,
    }
  })

  let time = 0
  const draw = (dt: number) => {
    time += dt
    const scroll = window.scrollY
    g.clearRect(0, 0, width, height)
    for (const f of flowers) {
      f.y -= f.speed * dt
      f.angle += f.spin * dt
      const span = height + 160
      // Параллакс: слой «отстаёт» от прокрутки; заворачиваем по высоте экрана.
      let y = (((f.y - scroll * f.layer.parallax) % span) + span) % span - 80
      const x = f.x + Math.sin(time * 0.35 + f.phase) * f.sway
      // Курсор расталкивает только ближние слои.
      const dx = x + f.px - mouse.x
      const dy = y + f.py - mouse.y
      const dist = Math.hypot(dx, dy)
      if (dist < 140 && f.layer.scale > 0.5) {
        const push = ((140 - dist) / 140) * 2.2
        f.px += (dx / (dist || 1)) * push
        f.py += (dy / (dist || 1)) * push
      }
      f.px *= 0.96
      f.py *= 0.96
      y += f.py
      g.save()
      g.globalAlpha = f.layer.alpha
      g.translate(x + f.px, y)
      g.rotate(f.angle)
      g.drawImage(f.sprite, -f.size / 2, -f.size / 2, f.size, f.size)
      g.restore()
    }
  }

  if (ctx.reduced) {
    draw(0)
    return { destroy: d.dispose }
  }

  d.listen(
    window,
    'pointermove',
    (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouse.x = e.clientX
      mouse.y = e.clientY
    },
    { passive: true },
  )
  d.listen(document, 'pointerleave', () => {
    mouse.x = mouse.y = -9999
  })

  const tick = (_t: number, deltaMs: number) => draw(Math.min(deltaMs / 1000, 0.05))
  gsap.ticker.add(tick)
  d.add(() => gsap.ticker.remove(tick))
  return { destroy: d.dispose }
}
