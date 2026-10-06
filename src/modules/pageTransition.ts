/**
 * Переход между страницами: шейдер «распускающийся цветок».
 *
 *   await cover()    — из центра распускается цветок и заливает экран
 *   …меняем страницу под заливкой…
 *   await reveal()   — в центре открывается «дыра» того же цветочного
 *                      контура и растворяет заливку до краёв
 *
 * ─── Как устроен шейдер ────────────────────────────────────────────────────
 * Один полноэкранный треугольник, вся форма — во фрагментном шейдере:
 * радиус фронта R зависит от угла (6 лепестков, cos(6θ)) и шума (рваный
 * «живой» край), фронт растёт с uProgress. Внутри — градиент цветов бренда,
 * на кромке — светящийся ободок. Для reveal маска инвертируется.
 *
 * ─── Почему заливка, а не «растворение» самой страницы ──────────────────────
 * Чтобы растворять страницу, её надо отрисовать в текстуру — DOM в WebGL
 * не снять без html2canvas-подобных костылей (медленно, ломает шрифты и
 * видео). Заливка брендом + раскрытие новой страницы из центра выглядит
 * как растворение и работает за 60 fps.
 *
 * Без WebGL — тот же сценарий на CSS (clip-path: circle). «Меньше
 * движения» — без перехода (промисы сразу выполнены).
 */
import { gsap } from 'kit/js/core/gsap.js'
import { prefersReducedMotion } from 'kit/js/core/env.js'

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uProgress;
uniform float uTime;
uniform float uReveal;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uRim;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float r = length(p);
  float a = atan(p.y, p.x);
  float maxR = length(vec2(aspect, 1.0)) * 0.5;

  // Контур цветка: 6 лепестков, поворачивается по мере раскрытия.
  float petals = 0.5 + 0.5 * cos(6.0 * (a + uProgress * 1.4));
  float n = noise(p * 4.0 + uTime * 0.4) * 0.14;
  float R = uProgress * (maxR + 0.55) * (0.78 + 0.32 * petals) + n - 0.2 * (1.0 - uProgress);
  float d = R - r; // > 0 — внутри цветка

  float inside = smoothstep(-0.012, 0.012, d);
  float cover = uReveal > 0.5 ? 1.0 - inside : inside;

  // Заливка: от пиона в центре к глубокому краю, с мягкими разводами.
  float mixer = smoothstep(0.0, maxR, r + (noise(p * 2.5 - uTime * 0.2) - 0.5) * 0.35);
  vec3 fill = mix(uA, uB, mixer);

  // Светящаяся кромка лепестков (только пока фронт на экране).
  // Розовая, приглушённая и узкая: свечение только намекает на край лепестка.
  float live = step(0.001, uProgress) * (1.0 - step(0.999, uProgress));
  float rim = exp(-abs(d) * 70.0) * live * 0.55;

  float alpha = clamp(cover + rim * 0.6, 0.0, 1.0);
  vec3 color = mix(fill, uRim, rim * (1.0 - cover * 0.5));
  gl_FragColor = vec4(color * alpha, alpha);
}
`

const hex = (value: string) => {
  const v = value.trim().replace('#', '')
  const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

interface Renderer {
  draw(progress: number, reveal: boolean): void
  resize(): void
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl) return null
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
    return shader
  }
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  gl.useProgram(program)

  // Один треугольник, перекрывающий весь экран.
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const uRes = u('uRes')
  const uProgress = u('uProgress')
  const uTime = u('uTime')
  const uReveal = u('uReveal')
  const start = performance.now()

  const resize = () => {
    // Плотность ≤ 1.5: кромка мягкая, лишние пиксели — лишняя работа.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()

  return {
    resize,
    draw(progress, reveal) {
      // Цвета — из темы на момент кадра (тёмная тема — глубже край).
      const css = getComputedStyle(document.documentElement)
      gl.uniform3fv(u('uA'), hex(css.getPropertyValue('--color-accent') || '#c24c6f'))
      gl.uniform3fv(u('uB'), hex(css.getPropertyValue('--transition-deep') || '#2a1220'))
      gl.uniform3fv(u('uRim'), hex(css.getPropertyValue('--transition-rim') || '#f2a7b8'))
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uProgress, progress)
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.uniform1f(uReveal, reveal ? 1 : 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}

let root: HTMLDivElement | null = null
let canvas: HTMLCanvasElement | null = null
let renderer: Renderer | null | undefined
let tween: gsap.core.Tween | null = null
/** Экран сейчас залит (cover закончился, reveal ещё не начат). */
let covered = false

/** Слой перехода создаётся при первом переходе и живёт до конца. */
function ensureLayer() {
  if (root) return
  root = document.createElement('div')
  root.className = 'page-transition'
  root.setAttribute('aria-hidden', 'true')
  canvas = document.createElement('canvas')
  canvas.className = 'page-transition__canvas'
  const mark = document.createElement('div')
  mark.className = 'page-transition__mark'
  root.append(canvas, mark)
  document.body.append(root)
  try {
    renderer = createRenderer(canvas)
  } catch {
    renderer = null
  }
  if (!renderer) root.classList.add('is-fallback')
  window.addEventListener('resize', () => renderer?.resize())
}

function run(reveal: boolean, duration: number, ease: string): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve()
  ensureLayer()
  const layer = root!
  tween?.kill()
  layer.classList.add('is-active')
  layer.classList.toggle('is-covered', !reveal)
  const state = { p: 0 }
  return new Promise((resolve) => {
    tween = gsap.to(state, {
      p: 1,
      duration,
      ease,
      onUpdate: () => {
        if (renderer) renderer.draw(state.p, reveal)
        else layer.style.setProperty('--p', String(reveal ? 1 - state.p : state.p))
      },
      onComplete: () => {
        if (reveal) layer.classList.remove('is-active')
        covered = !reveal
        resolve()
      },
    })
  })
}

/** Цветок заливает экран. */
export const cover = () => run(false, 0.65, 'power2.in')

/** Заливка растворяется из центра, открывая новую страницу. Не залито — ничего. */
export const reveal = () => {
  if (!covered) return Promise.resolve()
  covered = false
  return run(true, 0.9, 'power2.out')
}

/** Идёт ли переход (залито или заливается) — тогда прокрутка мгновенная. */
export const isTransitioning = () => covered || Boolean(tween?.isActive())
