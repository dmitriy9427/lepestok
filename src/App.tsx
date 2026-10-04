/**
 * Каркас: шапка + страница + подвал. Маршруты — здесь.
 * Главная грузится сразу, остальные страницы — лениво (меньше стартовый бандл).
 */
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { ScrollTrigger } from 'kit/js/core/gsap.js'
import { useKit } from 'kit/react/index.js'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'

const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })))

const Catalog = page(() => import('./pages/Catalog'), 'Catalog')
const BouquetPage = page(() => import('./pages/BouquetPage'), 'BouquetPage')
const Builder = page(() => import('./pages/Builder'), 'Builder')
const Cart = page(() => import('./pages/Cart'), 'Cart')
const Checkout = page(() => import('./pages/Checkout'), 'Checkout')
const Subscription = page(() => import('./pages/Subscription'), 'Subscription')
const Favorites = page(() => import('./pages/Favorites'), 'Favorites')
const NotFound = page(() => import('./pages/NotFound'), 'NotFound')

const TITLES: Record<string, string> = {
  '/': 'Лепесток — цветочная мастерская',
  '/catalog': 'Готовые букеты — Лепесток',
  '/builder': 'Конструктор букета — Лепесток',
  '/cart': 'Корзина — Лепесток',
  '/checkout': 'Оформление заказа — Лепесток',
  '/subscription': 'Подписка на цветы — Лепесток',
  '/favorites': 'Избранное — Лепесток',
}

/**
 * При смене страницы: прокрутка наверх, пересчёт ScrollTrigger, <title>.
 * Переход по якорю (/#delivery) — прокручиваем к блоку, а не наверх.
 */
function useRouteReset() {
  const { pathname, hash } = useLocation()
  const kit = useKit()
  useEffect(() => {
    // Страница букета и 404 ставят заголовок сами (эффекты детей срабатывают
    // раньше родителя — общий заголовок отсюда их бы перезаписал).
    if (TITLES[pathname]) document.title = TITLES[pathname]
    if (hash) {
      // Секция могла ещё не отрисоваться (ленивая страница) — ждём кадр.
      requestAnimationFrame(() => {
        const target = document.getElementById(hash.slice(1))
        if (!target) return
        if (kit?.scroll) kit.scroll.scrollTo(target)
        else target.scrollIntoView()
      })
      return
    }
    if (kit?.scroll) kit.scroll.scrollTo(0, { immediate: true, offset: 0 })
    else window.scrollTo(0, 0)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [pathname, hash, kit])
}

export function App() {
  useRouteReset()
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <Header />
      <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/bouquet/:id" element={<BouquetPage />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  )
}
