/** 404: «эта страница завяла» — лепестки логотипа опадают (CSS-анимация). */
import { useEffect } from 'react'
import { Link } from 'react-router'

export function NotFound() {
  useEffect(() => {
    document.title = 'Страница не найдена — Лепесток'
  }, [])
  return (
    <main id="main" className="section">
      <div className="container state state--page not-found">
        <svg className="not-found__art" viewBox="-20 -20 40 40" aria-hidden="true">
          {[0, 72, 144, 216, 288].map((a, i) => (
            // Поворот — на <g>: CSS-анимация transform у самого path перебила бы атрибут.
            <g key={a} transform={`rotate(${a})`}>
              <path className={`not-found__petal not-found__petal--${i}`} d="M0 0C5 -3 5 -12 0 -15C-5 -12 -5 -3 0 0Z" />
            </g>
          ))}
          <circle r="3" className="not-found__center" />
        </svg>
        <p className="state__title">404 — эта страница завяла</p>
        <p className="muted">Возможно, букет сняли с продажи или ссылка устарела.</p>
        <div className="cluster">
          <Link className="btn" to="/catalog">
            Свежие букеты
          </Link>
          <Link className="btn btn--ghost" to="/">
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound
