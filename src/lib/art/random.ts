/**
 * Повторяемая случайность: одно и то же зерно (seed) — одна и та же
 * последовательность. Поэтому букет выглядит одинаково при каждой
 * отрисовке, на сервере и в браузере, а в тестах можно сравнивать результат.
 */

/** Генератор mulberry32: быстрый, 32 бита, для графики хватает с запасом. */
export function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Random = ReturnType<typeof createRandom>

export const between = (rnd: Random, min: number, max: number) => min + (max - min) * rnd()

/** Число из строки — зерно для отдельного цветка («peony.blush.3»). */
export function hashString(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Округление для SVG: короче строка, меньше вес картинки. */
export const n = (v: number) => Math.round(v * 10) / 10
