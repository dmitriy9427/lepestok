/**
 * Каркас: шапка + страница + подвал. Маршруты — здесь.
 * Главная грузится сразу, остальные страницы — лениво (меньше стартовый бандл).
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation, type Location } from 'react-router'
import { ScrollTrigger } from 'kit/js/core/gsap.js'
import { useKit, useModule, useReducedMotion } from 'kit/react/index.js'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import blossoms from './modules/blossoms'
import motion from './modules/motion'
import { cover, isTransitioning, reveal } from './modules/pageTransition'

const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })))

/** Загрузчики страниц: те же import(), что у lazy, — повторный вызов берёт кеш. */
const LOADERS = {
  '/catalog': () => import('./pages/Catalog'),
  '/bouquet': () => import('./pages/BouquetPage'),
  '/builder': () => import('./pages/Builder'),
  '/cart': () => import('./pages/Cart'),
  '/checkout': () => import('./pages/Checkout'),
  '/subscription': () => import('./pages/Subscription'),
  '/favorites': () => import('./pages/Favorites'),
  '*': () => import('./pages/NotFound'),
}

const Catalog = page(LOADERS['/catalog'], 'Catalog')
const BouquetPage = page(LOADERS['/bouquet'], 'BouquetPage')
const Builder = page(LOADERS['/builder'], 'Builder')
const Cart = page(LOADERS['/cart'], 'Cart')
const Checkout = page(LOADERS['/checkout'], 'Checkout')
const Subscription = page(LOADERS['/subscription'], 'Subscription')
const Favorites = page(LOADERS['/favorites'], 'Favorites')
const NotFound = page(LOADERS['*'], 'NotFound')

/** Начать грузить код страницы заранее — пока идёт заливка перехода. */
function preload(pathname: string) {
  if (pathname === '/') return Promise.resolve()
  const key = pathname.startsWith('/bouquet/') ? '/bouquet' : pathname
  const load = LOADERS[key as keyof typeof LOADERS] ?? LOADERS['*']
  return load().catch(() => {})
}

/** Ждём, пока ленивая страница смонтируется (вместо заглушки Suspense). */
function pageReady(): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now()
    const check = () => {
      const main = document.getElementById('main')
      if ((main && !main.classList.contains('page-loading')) || performance.now() - started > 3000) resolve()
      else requestAnimationFrame(check)
    }
    check()
  })
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

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
 * Переход между страницами: шейдерная заливка (modules/pageTransition) →
 * под ней меняется страница → заливка растворяется из центра.
 *
 * Роутер уже на новом адресе, а показываем «старую» локацию (shown), пока
 * экран не залит. Та же страница (сменился только ?фильтр или #якорь) —
 * без заливки, сразу.
 */
function usePageTransition() {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  // Та же страница — переключаем прямо в рендере (без лишнего кадра).
  if (location.key !== shown.key && location.pathname === shown.pathname) setShown(location)

  useEffect(() => {
    if (location.pathname === shown.pathname) return undefined
    let cancelled = false
    Promise.all([cover(), preload(location.pathname)]).then(() => {
      if (!cancelled) setShown(location)
    })
    return () => {
      cancelled = true
    }
  }, [location, shown.pathname])
  return shown
}

/**
 * После смены страницы (под заливкой): <title>, прокрутка наверх или к
 * #якорю, пересчёт ScrollTrigger — и только потом раскрытие.
 *
 * Якорь с другой страницы (/catalog → /#delivery) раньше «недокручивал»:
 * прокрутка стартовала до того, как главная достроилась (hero вырастает
 * до 200svh в эффекте). Теперь ждём монтирования, два кадра и refresh.
 */
function useRouteReset(shown: Location) {
  const kit = useKit()
  const { pathname, hash } = shown
  // Ключ — только для якоря: повторный клик по «Доставка» снова докручивает.
  // Смена ?фильтров каталога (тот же путь, без #) прокрутку не трогает.
  const anchorKey = hash ? shown.key : ''
  useEffect(() => {
    // Страница букета и 404 ставят заголовок сами (эффекты детей срабатывают
    // раньше родителя — общий заголовок отсюда их бы перезаписал).
    if (TITLES[pathname]) document.title = TITLES[pathname]
    let cancelled = false
    const instant = isTransitioning()
    const scroll = (target: Element | number) => {
      if (kit?.scroll) kit.scroll.scrollTo(target, { immediate: instant, ...(target === 0 ? { offset: 0 } : {}) })
      else if (typeof target === 'number') window.scrollTo(0, target)
      else target.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
    }
    if (!hash) scroll(0)
    pageReady()
      .then(nextFrame)
      .then(() => {
        if (cancelled) return
        // Lenis помнит высоту СТАРОЙ страницы (обновляет её с задержкой) —
        // без resize прокрутка к якорю упиралась в предел каталога.
        kit?.scroll?.lenis?.resize()
        ScrollTrigger.refresh()
        const target = hash ? document.getElementById(hash.slice(1)) : null
        if (target) scroll(target)
        return reveal()
      })
    return () => {
      cancelled = true
    }
  }, [pathname, hash, anchorKey, kit])
}

export function App() {
  const shown = usePageTransition()
  useRouteReset(shown)
  const ambient = useModule<HTMLCanvasElement>(blossoms)
  // Появление при прокрутке и hover-эффекты — на весь сайт (modules/motion).
  const reduced = useReducedMotion()
  useEffect(() => motion(document.body, { reduced })?.destroy, [reduced])
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      {/* Фон всего сайта: плывущие цветы (fixed, под контентом). */}
      <canvas className="ambient" ref={ambient} aria-hidden="true" />
      <Header />
      <Suspense fallback={<main id="main" className="page-loading" aria-busy="true" />}>
        <Routes location={shown}>
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
