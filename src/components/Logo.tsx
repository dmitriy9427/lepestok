/** Логотип: пять лепестков + название. Цвет лепестков — CSS (.logo__mark). */
import { Link } from 'react-router'

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Лепесток — на главную">
      <svg className="logo__mark" viewBox="-16 -16 32 32" aria-hidden="true">
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M0 0C5 -3 5 -12 0 -15C-5 -12 -5 -3 0 0Z" />
        ))}
        <circle r="3" className="logo__center" />
      </svg>
      <span className="logo__text">Лепесток</span>
    </Link>
  )
}
