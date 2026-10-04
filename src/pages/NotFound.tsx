/** 404 — с увядшим цветком (та же рисовалка, серая палитра и поникший стебель). */
import { useEffect } from 'react'
import { Link } from 'react-router'
import { FLOWER_ART } from '../lib/art/flowers'
import { createRandom } from '../lib/art/random'

const WILTED = { name: 'Увядший', petal: '#d9cfc7', shade: '#b4a79c', center: '#8e8076' }
const flower = FLOWER_ART.rose(createRandom(4), WILTED)

export function NotFound() {
  useEffect(() => {
    document.title = 'Страница не найдена — Лепесток'
  }, [])
  return (
    <main id="main" className="section">
      <div className="container state state--page not-found">
        <svg className="not-found__art" viewBox="0 0 200 220" aria-hidden="true">
          <path
            d="M100 210C100 150 104 110 130 80"
            fill="none"
            stroke="#9aa58f"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M104 160c-20-6-34-2-42 8 14 6 30 4 42-8z" fill="#a9b39d" />
          <g transform="translate(140 92) rotate(130) scale(1.3)" dangerouslySetInnerHTML={{ __html: flower }} />
          <path
            d="M60 205c6-3 10-2 14 1M150 206c-5-4-9-3-13 0"
            stroke="#c9bdb2"
            strokeWidth="3"
            strokeLinecap="round"
          />
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
