/**
 * Переключатель темы: дорожка «рассвет → ночное небо», ползунок — цветок.
 * Тёмная тема: цветок прокатывается вправо, поворачивается и становится
 * лунно-сиреневым, на дорожке загораются звёзды.
 *
 * Логика — модуль кита theme-switch (data-theme на <html>, запоминает выбор,
 * aria-pressed). Сохранённая тема ставится ещё в index.html — без вспышки.
 */
import { useModule } from 'kit/react/index.js'
import themeSwitch from 'kit/js/modules/theme-switch/index.js'

const PETALS = Array.from({ length: 8 }, (_, i) => i * 45)

export function ThemeToggle() {
  const ref = useModule<HTMLButtonElement>(themeSwitch)
  return (
    <button ref={ref} className="theme-toggle" type="button" aria-label="Тёмная тема">
      <span className="theme-toggle__stars" aria-hidden="true" />
      <span className="theme-toggle__thumb" aria-hidden="true">
        <svg viewBox="-12 -12 24 24">
          <g className="theme-toggle__petals">
            {PETALS.map((a) => (
              <ellipse key={a} cx="0" cy="-6.2" rx="2.6" ry="4.6" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle className="theme-toggle__core" r="3.4" />
        </svg>
      </span>
    </button>
  )
}
