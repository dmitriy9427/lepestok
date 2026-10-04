/**
 * Падающие лепестки на canvas — фон первого экрана. Модуль по контракту кита
 * (init(el, ctx) → { destroy }), в React подключается useModule(petals).
 *
 *   <canvas class="petals" ref={useModule(petals, { count: 28 })} />
 *
 * Canvas 2D, а не WebGL: 30 фигурок — ему по силам, а код втрое короче.
 * Бережём батарею: кадры только пока canvas виден, плотность пикселей ≤ 2.
 * «Меньше движения» — модуль не запускается (canvas пустой, фон — CSS).
 */
import { gsap } from 'kit/js/core/gsap.js'
import { createDisposer, onViewport } from 'kit/js/core/lifecycle.js'
import { readOptions } from 'kit/js/core/options.js'
import { createRandom, between } from '../lib/random'

const DEFAULTS = {
  count: 26,
  /** Цвета через запятую. */
  colors: '#f4d9d4,#eba3b4,#f6ead2,#e2708f,#f7c29f',
}

interface Petal {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  phase: number
  spin: number
  angle: number
  color: string
}

export default function petals(
  canvas: HTMLCanvasElement,
  ctx: { reduced?: boolean; options?: Partial<typeof DEFAULTS> } = {},
) {
  if (ctx.reduced) return undefined
  const g = canvas.getContext('2d')
  if (!g) return undefined
  const options = readOptions(canvas, 'petals', DEFAULTS, ctx.options) as typeof DEFAULTS
  const colors = String(options.colors).split(',')
  const d = createDisposer()
  const rnd = createRandom(7)
  let width = 0
  let height = 0

  const spawn = (p: Partial<Petal> = {}): Petal => ({
    x: between(rnd, 0, width),
    y: between(rnd, -height, 0),
    size: between(rnd, 6, 14),
    speed: between(rnd, 18, 42),
    sway: between(rnd, 10, 40),
    phase: between(rnd, 0, Math.PI * 2),
    spin: between(rnd, -1.2, 1.2),
    angle: between(rnd, 0, Math.PI * 2),
    color: colors[Math.floor(rnd() * colors.length)],
    ...p,
  })

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  d.add(() => ro.disconnect())

  // Сразу разбросаны по всей высоте — не «начинают падать» с пустого экрана.
  const list = Array.from({ length: Number(options.count) }, () => spawn({ y: between(rnd, 0, height) }))

  let time = 0
  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.05)
    time += dt
    g.clearRect(0, 0, width, height)
    for (const p of list) {
      p.y += p.speed * dt
      p.angle += p.spin * dt
      if (p.y > height + 20) Object.assign(p, spawn({ y: -20 }))
      const x = p.x + Math.sin(time * 0.8 + p.phase) * p.sway
      g.save()
      g.translate(x, p.y)
      g.rotate(p.angle)
      // «Переворот» лепестка в воздухе — сжатие по одной оси.
      g.scale(1, 0.55 + 0.45 * Math.sin(time * 1.6 + p.phase))
      g.fillStyle = p.color
      g.globalAlpha = 0.85
      g.beginPath()
      g.moveTo(0, -p.size)
      g.bezierCurveTo(p.size * 0.8, -p.size * 0.6, p.size * 0.6, p.size * 0.7, 0, p.size)
      g.bezierCurveTo(-p.size * 0.6, p.size * 0.7, -p.size * 0.8, -p.size * 0.6, 0, -p.size)
      g.fill()
      g.restore()
    }
  }

  let running = false
  d.add(
    onViewport(canvas, {
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
