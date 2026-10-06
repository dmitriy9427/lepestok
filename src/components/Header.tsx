/**
 * Шапка: логотип, меню, избранное и корзина со счётчиками, бургер.
 * Модули кита sticky-header и menu — через useModule.
 */
import type { CSSProperties } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useModule } from 'kit/react/index.js'
import stickyHeader from 'kit/js/modules/sticky-header/index.js'
import menu from 'kit/js/modules/menu/index.js'
import { cart, cartCount, favorites } from '../lib/cart'
import { Logo } from './Logo'
import { Bloom } from './Bloom'
import { ThemeToggle } from './ThemeToggle'

const LINKS = [
  { to: '/catalog', label: 'Букеты' },
  { to: '/builder', label: 'Собрать букет' },
  { to: '/subscription', label: 'Подписка' },
  { to: '/#delivery', label: 'Доставка' },
]

const MENU_OPTIONS = { target: 'site-menu' }

export function Header() {
  const { pathname, hash } = useLocation()
  const header = useModule<HTMLElement>(stickyHeader)
  const burger = useModule<HTMLButtonElement>(menu, MENU_OPTIONS)
  const count = cartCount(cart.use())
  const favCount = favorites.use().length

  return (
    <header className="header" ref={header}>
      <div className="header__inner">
        <Logo />
        <nav id="site-menu" className="nav mobile-menu" aria-label="Основное меню" data-lenis-prevent>
          <ul className="nav__list">
            {LINKS.map(({ to, label }, i) => (
              <li key={to} style={{ '--i': i } as CSSProperties}>
                {to.includes('#') ? (
                  // NavLink не учитывает #якорь — активность считаем сами.
                  <Link
                    className={`nav__link${pathname + hash === to ? ' active' : ''}`}
                    to={to}
                    aria-current={pathname + hash === to ? 'location' : undefined}
                  >
                    <span className="nav__index">0{i + 1}</span>
                    {label}
                  </Link>
                ) : (
                  <NavLink className="nav__link" to={to}>
                    <span className="nav__index">0{i + 1}</span>
                    {label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          {/* Только в мобильном меню: контакты, кнопка и цветы-украшения. */}
          <div className="mobile-menu__extra">
            <Link className="btn btn--lg btn--light" to="/builder">
              Собрать букет
            </Link>
            <a className="mobile-menu__phone" href="tel:+78000000000">
              +7 (800) 000-00-00
            </a>
            <p className="mobile-menu__hours">Ежедневно 8:00–22:00 · доставка за 2 часа</p>
          </div>
          <div className="mobile-menu__decor" aria-hidden="true">
            <Bloom petal="#f2a7b8" shade="#c24c6f" center="#a8375a" petals={6} className="mobile-menu__bloom" />
            <Bloom petal="#f7c29f" shade="#dc7560" center="#c85f4b" petals={5} className="mobile-menu__bloom" />
            <Bloom petal="#d9c8ec" shade="#9b7fc4" center="#7d5fae" petals={7} className="mobile-menu__bloom" />
          </div>
        </nav>
        <div className="header__actions">
          <ThemeToggle />
          <Link className="icon-link" to="/favorites" aria-label={`Избранное: ${favCount}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20z" />
            </svg>
            {favCount > 0 && <span className="icon-link__count">{favCount}</span>}
          </Link>
          <Link className="icon-link" to="/cart" aria-label={`Корзина: ${count}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1.3 11.1a1 1 0 0 1-1 .9H7.3a1 1 0 0 1-1-.9L5 8zm4 0V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {count > 0 && (
              <span className="icon-link__count" key={count}>
                {count}
              </span>
            )}
          </Link>
          {/* aria-expanded/aria-label ставит модуль menu — в JSX не пишем */}
          <button ref={burger} className="burger" type="button">
            <span className="burger__lines" />
          </button>
        </div>
      </div>
    </header>
  )
}
