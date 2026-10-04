import { Link } from 'react-router'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p className="muted">Цветочная мастерская. Собираем букеты в день заказа и привозим за 2 часа.</p>
        </div>
        <nav className="footer__nav" aria-label="Разделы">
          <Link to="/catalog">Готовые букеты</Link>
          <Link to="/builder">Конструктор</Link>
          <Link to="/subscription">Подписка</Link>
          <Link to="/favorites">Избранное</Link>
        </nav>
        <div className="footer__contacts">
          {/* TODO: настоящие контакты */}
          <a className="footer__phone" href="tel:+78000000000">
            +7 (800) 000-00-00
          </a>
          <p className="muted">Ежедневно 8:00–22:00</p>
        </div>
        <p className="footer__note muted">
          Пет-проект: магазин вымышленный, заказы не отправляются. Фото букетов — Pexels, 3D-модель — Blender, цветы в
          конструкторе нарисованы кодом.
        </p>
      </div>
    </footer>
  )
}
